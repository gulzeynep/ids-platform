export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'reviewing' | 'reviewed' | 'false_positive';
export type AlertAction = 'logged' | 'blocked' | 'allowed';
export type Protocol = 'TCP' | 'UDP' | 'HTTP' | 'HTTPS' | 'ICMP';

export interface Alert {
  id: number;
  type: string;
  title?: string;
  severity: AlertSeverity;
  source_ip: string;
  destination_ip: string;
  source_port: number | null;
  destination_port: number | null;
  protocol: Protocol;
  action: AlertAction;
  status: AlertStatus;
  notes: string | null;
  payload_preview: string | null;
  raw_request?: string | null;
  signature_msg?: string | null;
  signature_class?: string | null;
  signature_sid?: number | null;
  signature_gid?: number | null;
  event_id?: string | null;
  capture_path?: string | null;
  capture_mode?: string | null;
  packet_filter?: string | null;
  capture_window_seconds?: number | null;
  is_flagged: boolean;
  is_saved: boolean;
  timestamp: string;
  workspace_id: number;
}

export interface AlertFilters {
  status?: AlertStatus | 'all';
  severity?: AlertSeverity | 'all';
  is_flagged?: boolean | null;
  is_saved?: boolean | null;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface AlertUpdateDto {
  status?: AlertStatus;
  is_flagged?: boolean;
  is_saved?: boolean;
  notes?: string;
}

export interface AlertStats {
  active_alerts: number;
  total_alerts?: number;
  critical_threats: number;
  resolved_alerts: number;
  false_positive_alerts?: number;
  protected_sites?: number;
  secured_segments?: number;
  blocked_ips?: number;
  recent_alerts_5m?: number;
  active_sensors?: number;
  status: 'Secure' | 'Compromised' | 'Under Attack';
  last_mitigation?: {
    ip_address: string;
    reason?: string | null;
    timestamp: string;
  } | null;
}

export interface RealtimeAlert extends Alert {
  is_new: boolean; 
}

export interface WebSocketMessage {
  type: 'alert' | 'notification' | 'stats_update';
  data: any;
  timestamp: string;
}

export interface Modal {
  isOpen: boolean;
  title: string;
  content: React.ReactNode | null;
  onClose?: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
