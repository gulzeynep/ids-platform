import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Register } from './Register';
import { renderWithProviders } from '../../test/render';

describe('Register', () => {
  it('uses the backend password complexity rules before submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { route: '/register' });

    const passwordFields = screen.getAllByPlaceholderText('••••••••');
    await user.type(screen.getByPlaceholderText('analyst@domain.com'), 'analyst@example.com');
    await user.type(passwordFields[0], 'lowercase1!');
    await user.type(passwordFields[1], 'lowercase1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/uppercase letter/i)).toBeInTheDocument();
  });
});
