import type { ReactNode } from 'react';

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
  period?: 'day';
  today_alerts?: number;
  previous_day_alerts?: number;
  daily_delta?: number;
  hourly_trend?: TrendPoint[];
  attack_type_distribution?: DistributionItem[];
  success_metrics?: SuccessMetrics;
  active_sensors?: number;
  status: 'Secure' | 'Compromised' | 'Under Attack';
  last_mitigation?: {
    ip_address: string;
    reason?: string | null;
    timestamp: string;
  } | null;
}

export interface TrendPoint {
  timestamp: string;
  count: number;
}

export interface DistributionItem {
  type: string;
  count: number;
  ratio: number;
}

export interface SuccessMetrics {
  total_alerts: number;
  triaged_alerts: number;
  reviewed_alerts: number;
  false_positive_alerts: number;
  active_alerts: number;
  blocked_alerts: number;
  flagged_alerts: number;
  critical_alerts: number;
  resolved_critical_alerts: number;
  resolution_rate: number;
  review_rate: number;
  false_positive_rate: number;
  backlog_rate: number;
  containment_rate: number;
  flag_rate: number;
  critical_resolution_rate: number;
  formulas: Record<string, string>;
}

export interface IntelligenceStats {
  period: 'week' | 'month';
  period_days: number;
  top_attackers: { ip: string; count: number }[];
  severity_distribution: Record<string, number>;
  protocol_distribution: Record<string, number>;
  protocol_share: Record<string, number>;
  attack_type_distribution: DistributionItem[];
  unique_attackers: number;
  trend_period: { current: number; previous: number; delta: number };
  trend_24h: { current: number; previous: number; delta: number };
  daily_trend: TrendPoint[];
  top_rule: { signature_msg: string; sid: number | null; count: number } | null;
  critical_ratio: number;
  success_metrics: SuccessMetrics;
}

export interface UserSettings {
  alert_email: string | null;
  enable_email_notifications: boolean;
  min_severity_level: AlertSeverity;
}

export interface RealtimeAlert extends Alert {
  is_new: boolean; 
}

export interface WebSocketMessage {
  type: 'alert' | 'notification' | 'stats_update';
  data: unknown;
  timestamp: string;
}

export interface Modal {
  isOpen: boolean;
  title: string;
  content: ReactNode | null;
  onClose?: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
