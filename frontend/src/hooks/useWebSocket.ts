import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAlertsStore } from '../stores/alerts.store';
import { useAuthStore } from '../stores/auth.store';
import type { Alert, WebSocketMessage } from '../types';
import { getAlertTitle } from '../utils/alertTitles';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
const BASE_RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_INTERVAL = 30000;
const HEARTBEAT_INTERVAL = 25000;
const STALE_CONNECTION_MS = 70000;
const POLICY_VIOLATION_CLOSE = 1008;

interface UseWebSocketOptions {
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

const isAlertPayload = (payload: unknown): payload is Alert => {
  return Boolean(payload && typeof payload === 'object' && 'severity' in payload && 'source_ip' in payload);
};

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    enabled = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const lastMessageAt = useRef(0);
  const connectRef = useRef<() => void>(() => undefined);
  const authCloseNotified = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  const { addRealtimeAlert, setWsConnected } = useAlertsStore();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const clearTimers = useCallback(() => {
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    reconnectTimeout.current = undefined;
    heartbeatInterval.current = undefined;
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!enabled || !token || reconnectTimeout.current) return;
    const delay = Math.min(
      BASE_RECONNECT_INTERVAL * Math.max(1, reconnectAttempts.current + 1),
      MAX_RECONNECT_INTERVAL
    );
    reconnectTimeout.current = setTimeout(() => {
      reconnectTimeout.current = undefined;
      reconnectAttempts.current += 1;
      connectRef.current();
    }, delay);
  }, [enabled, token]);

  const handleAlert = useCallback((alert: Alert) => {
    addRealtimeAlert({ ...alert, is_new: true });

    if (alert.severity === 'critical' || alert.severity === 'high') {
      toast.error(getAlertTitle(alert), {
        description: `Source: ${alert.source_ip}`,
        duration: 6000,
      });
    }
  }, [addRealtimeAlert]);

  const connect = useCallback(() => {
    if (!enabled || !token) return;
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        reconnectAttempts.current = 0;
        lastMessageAt.current = Date.now();
        setIsConnected(true);
        setWsConnected(true);

        ws.current?.send(JSON.stringify({
          type: 'auth',
          token,
        }));

        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = setInterval(() => {
          if (ws.current?.readyState !== WebSocket.OPEN) return;
          if (Date.now() - lastMessageAt.current > STALE_CONNECTION_MS) {
            ws.current.close();
            return;
          }
          ws.current.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        }, HEARTBEAT_INTERVAL);

        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        lastMessageAt.current = Date.now();
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'pong') return;

          if (message.type === 'alert' && isAlertPayload(message.data)) {
            handleAlert(message.data);
            onMessage?.(message);
            return;
          }

          if (isAlertPayload(message)) {
            handleAlert(message);
            onMessage?.({ type: 'alert', data: message, timestamp: new Date().toISOString() });
            return;
          }

          onMessage?.(message as WebSocketMessage);
        } catch (error) {
          console.error('WebSocket message parse failed:', error);
        }
      };

      ws.current.onclose = (event) => {
        setWsConnected(false);
        setIsConnected(false);
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = undefined;
        ws.current = null;
        onDisconnect?.();

        if (event.code === POLICY_VIOLATION_CLOSE) {
          clearTimers();
          logout();
          if (!authCloseNotified.current) {
            authCloseNotified.current = true;
            toast.error('SOC stream authentication expired. Please sign in again.');
          }
          return;
        }

        scheduleReconnect();
      };

      ws.current.onerror = (error) => {
        setWsConnected(false);
        setIsConnected(false);
        onError?.(error);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      scheduleReconnect();
    }
  }, [enabled, token, setWsConnected, onConnect, onDisconnect, onError, onMessage, handleAlert, scheduleReconnect, clearTimers, logout]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    authCloseNotified.current = false;
  }, [token]);

  const disconnect = useCallback(() => {
    clearTimers();
    if (ws.current) {
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.onopen = null;
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
    setWsConnected(false);
  }, [clearTimers, setWsConnected]);

  const send = useCallback((message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();

    const reconnectWhenVisible = () => {
      if (document.visibilityState === 'visible') connect();
    };
    const reconnectWhenOnline = () => connect();

    document.addEventListener('visibilitychange', reconnectWhenVisible);
    window.addEventListener('online', reconnectWhenOnline);

    return () => {
      document.removeEventListener('visibilitychange', reconnectWhenVisible);
      window.removeEventListener('online', reconnectWhenOnline);
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    isConnected,
  };
};
