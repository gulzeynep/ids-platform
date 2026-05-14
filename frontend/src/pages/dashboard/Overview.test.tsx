import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Overview } from './Overview';
import { alertsApi } from '../../api/endpoints/alerts';
import { renderWithProviders } from '../../test/render';
import type { AlertStats } from '../../types';

vi.mock('../../api/endpoints/alerts', async () => {
  const actual = await vi.importActual<typeof import('../../api/endpoints/alerts')>('../../api/endpoints/alerts');
  return {
    ...actual,
    alertsApi: {
      getAlertStats: vi.fn(),
      getAlerts: vi.fn(),
    },
  };
});

const nominalStats: AlertStats = {
  active_alerts: 0,
  total_alerts: 0,
  critical_threats: 0,
  resolved_alerts: 0,
  false_positive_alerts: 0,
  protected_sites: 1,
  secured_segments: 1,
  blocked_ips: 0,
  recent_alerts_5m: 0,
  period: 'day',
  today_alerts: 0,
  previous_day_alerts: 0,
  daily_delta: 0,
  hourly_trend: [],
  attack_type_distribution: [],
  success_metrics: {
    total_alerts: 0,
    triaged_alerts: 0,
    reviewed_alerts: 0,
    false_positive_alerts: 0,
    active_alerts: 0,
    blocked_alerts: 0,
    flagged_alerts: 0,
    critical_alerts: 0,
    resolved_critical_alerts: 0,
    resolution_rate: 0,
    review_rate: 0,
    false_positive_rate: 0,
    backlog_rate: 0,
    containment_rate: 0,
    flag_rate: 0,
    critical_resolution_rate: 0,
    formulas: {},
  },
  active_sensors: 1,
  status: 'Secure',
  last_mitigation: null,
};

describe('Overview', () => {
  it('renders nominal empty telemetry states', async () => {
    vi.mocked(alertsApi.getAlertStats).mockResolvedValue(nominalStats);
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);

    renderWithProviders(<Overview />, { route: '/dashboard' });

    expect(await screen.findByText('System Nominal')).toBeInTheDocument();
    expect(screen.getByText('No alerts in the last 24 hours.')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for incoming sensor telemetry/i)).toBeInTheDocument();
  });
});
