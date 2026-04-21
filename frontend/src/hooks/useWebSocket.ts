import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAlertsStore, useAuthStore} from '../stores/alerts.store';
import type { WebSocketMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

interface UseWebSocketOptions {
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    enabled = true,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;
  const { token } = useAuthStore.getState();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);  const { addRealtimeAlert } = useAlertsStore();
  const connect = useCallback(() => {
    if (!enabled) return;
    
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      // You should append your auth token here if needed by your FastAPI backend
      const urlWithAuth = `${WS_URL}?token=${token}`;
      ws.current = new WebSocket(urlWithAuth);

      ws.current.onopen = () => {
        console.log('WebSocket Connected');
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'alert') {
            addRealtimeAlert({ ...message.data, is_new: true });
            
            if (message.data.severity === 'critical' || message.data.severity === 'high') {
              toast.error(`Critical Threat Detected!`, {
                description: `IP: ${message.data.source_ip} | Type: ${message.data.type}`,
                duration: 5000,
              });
            } else {
              toast.warning(`Suspicious Activity`, {
                description: `Type: ${message.data.type}`,
                duration: 3000,
              });
            }
          }
          
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket Disconnected');
        onDisconnect?.();
        
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.current.onerror = (error) => {
        onError?.(error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [enabled, onConnect, onDisconnect, onError, onMessage, addRealtimeAlert]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const send = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    send,
    disconnect,
    reconnect: connect,
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
};