import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAlertsStore } from '../stores/alerts.store';
import { useAuthStore } from '../stores/auth.store'; 
import type { WebSocketMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
const RECONNECT_INTERVAL = 3000; 
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

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  const { addRealtimeAlert, setWsConnected } = useAlertsStore();
  const token = useAuthStore((state) => state.token); 

  const connect = useCallback(() => {
    if (!enabled || !token) return; 
    
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('SOC Connection: Established');
        reconnectAttempts.current = 0;
        setWsConnected(true); 
        
        ws.current?.send(JSON.stringify({ 
            type: "auth", 
            token: token 
        }));

        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'alert') {
            addRealtimeAlert({ ...message.data, is_new: true });
            
            if (message.data.severity === 'critical' || message.data.severity === 'high') {
              toast.error(`CRITICAL THREAT DETECTED`, {
                description: `Type: ${message.data.type} | Source: ${message.data.source_ip}`,
                duration: 6000,
              });
            }
          }
          onMessage?.(message);
        } catch (error) {
          console.error('WS Data Parse Error:', error);
        }
      };

      ws.current.onclose = () => {
        console.warn('SOC Connection: Terminated');
        setWsConnected(false);
        onDisconnect?.();
        
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            console.log(`Retrying connection... (${reconnectAttempts.current})`);
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.current.onerror = (error) => {
        setWsConnected(false); 
        onError?.(error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [enabled, token, onConnect, onDisconnect, onError, onMessage, addRealtimeAlert]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const send = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    send,
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
};