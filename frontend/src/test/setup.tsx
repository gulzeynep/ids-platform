/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

type MockComponentProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

// Recharts depends on browser layout APIs that jsdom cannot calculate reliably.
const ChartShell = ({ children }: MockComponentProps) => (
  <div data-testid="chart">{children}</div>
);

const ChartLeaf = () => null;

vi.mock('recharts', () => ({
  Area: ChartLeaf,
  AreaChart: ChartShell,
  Bar: ChartShell,
  BarChart: ChartShell,
  CartesianGrid: ChartLeaf,
  Cell: ChartLeaf,
  Pie: ChartShell,
  PieChart: ChartShell,
  ResponsiveContainer: ChartShell,
  Tooltip: ChartLeaf,
  XAxis: ChartLeaf,
  YAxis: ChartLeaf,
}));
