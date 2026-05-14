import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Intelligence } from './Intelligence';
import { alertsApi } from '../../api/endpoints/alerts';
import { renderWithProviders } from '../../test/render';
import type { IntelligenceStats } from '../../types';

vi.mock('../../api/endpoints/alerts', () => ({
  alertsApi: {
    getAnalysisStats: vi.fn(),
  },
}));

const emptyStats: IntelligenceStats = {
  period: 'week',
  period_days: 7,
  top_attackers: [],
  severity_distribution: {},
  protocol_distribution: {},
  protocol_share: {},
  attack_type_distribution: [],
  unique_attackers: 0,
  trend_period: { current: 0, previous: 0, delta: 0 },
  trend_24h: { current: 0, previous: 0, delta: 0 },
  daily_trend: [],
  top_rule: null,
  critical_ratio: 0,
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
};

describe('Intelligence', () => {
  it('renders empty chart states cleanly', async () => {
    vi.mocked(alertsApi.getAnalysisStats).mockResolvedValue(emptyStats);

    renderWithProviders(<Intelligence />, { route: '/intelligence' });

    expect(await screen.findByText('No trend data for this period.')).toBeInTheDocument();
    expect(screen.getByText('No attack type data available.')).toBeInTheDocument();
    expect(screen.getByText('No protocol data available.')).toBeInTheDocument();
    expect(screen.getByText('No severity data available.')).toBeInTheDocument();
  });
});
