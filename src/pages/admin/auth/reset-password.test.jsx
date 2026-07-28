import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_BASE_PATH, PUBLIC_BASE_PATH, AdminRouter } from '../../../routing';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../../../config/axios', () => ({
  default: { post },
}));

import ResetPassword from './reset-password';

describe('password recovery audience', () => {
  beforeEach(() => {
    post.mockReset();
    window.history.replaceState(
      {},
      '',
      `${ADMIN_BASE_PATH}/reset-password?audience=user`,
    );
  });

  it('uses the user recovery contract when a user reset link is requested', async () => {
    post.mockResolvedValue({
      data: {
        message: 'If that email is registered, a reset link has been sent.',
      },
    });

    render(
      <AdminRouter>
        <ResetPassword />
      </AdminRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /reset vybe password/i }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'member@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/auth/request-reset', {
        email: 'member@example.test',
      });
    });
    expect(screen.getByText(/delivery requires vybe's email channel/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /private support page/i })).toHaveAttribute(
      'href',
      `${PUBLIC_BASE_PATH === '/' ? '' : PUBLIC_BASE_PATH}/support`,
    );
  });

  it('shows the same delivery caveat without changing the generic admin response', async () => {
    window.history.replaceState({}, '', `${ADMIN_BASE_PATH}/reset-password`);
    post.mockResolvedValue({
      data: {
        message: 'If that email is registered, a reset link has been sent.',
      },
    });

    render(
      <AdminRouter>
        <ResetPassword />
      </AdminRouter>,
    );
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'admin@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/admins/request-reset', {
        email: 'admin@example.test',
      });
    });
    expect(screen.getByText(/if that account exists/i)).toBeInTheDocument();
    expect(screen.getByText(/delivery requires vybe's email channel/i)).toBeInTheDocument();
  });

  it('does not expose an account-specific reset error', async () => {
    post.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'That account does not exist.' },
      },
    });

    render(
      <AdminRouter>
        <ResetPassword />
      </AdminRouter>,
    );
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'missing@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not request a reset. Try again or use private Support.',
    );
    expect(screen.queryByText(/account does not exist/i)).not.toBeInTheDocument();
  });
});
