import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../api/client';
import { renderWithProviders } from '../../test/render';
import { Defense } from './Defense';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../../api/client', () => ({
  default: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

describe('Defense', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('explains gateway source IP blocking and submits blocklist entries', async () => {
    const user = userEvent.setup();
    mockedApiClient.get.mockResolvedValue({ data: [] });
    mockedApiClient.post.mockResolvedValue({ data: { id: 1 } });

    renderWithProviders(<Defense />, { route: '/defense' });

    expect(await screen.findByText(/Blocks apply at the gateway/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/172\.18\.0\.1/i), '172.18.0.1');
    await user.type(screen.getByPlaceholderText(/Brute force attempt/i), 'Gateway source test');
    await user.click(screen.getByRole('button', { name: /add to blocklist/i }));

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith('/defense/blacklist', {
        ip_address: '172.18.0.1',
        reason: 'Gateway source test',
      });
    });
  });
});
