import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '../stores/auth.store';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  url: string;
  send = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });

  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  triggerClose(code: number, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason } as CloseEvent);
  }
}

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
    useAuthStore.setState({
      token: 'stale-token',
      user: { id: 1, email: 'analyst@example.com', role: 'admin', workspace_id: 1 },
      isAuthenticated: true,
      hasWorkspace: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    useAuthStore.getState().logout();
  });

  it('logs out and does not reconnect after a websocket policy violation', () => {
    renderHook(() => useWebSocket());

    expect(MockWebSocket.instances).toHaveLength(1);
    const socket = MockWebSocket.instances[0];

    act(() => {
      socket.triggerOpen();
    });

    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth', token: 'stale-token' }));

    act(() => {
      socket.triggerClose(1008, 'invalid_token');
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('SOC stream authentication expired. Please sign in again.');

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
