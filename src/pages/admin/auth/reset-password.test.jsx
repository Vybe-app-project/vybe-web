import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRouter } from '../../../routing';

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
      '/admin/reset-password?audience=user',
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
  });
});
