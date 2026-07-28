import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_BASE_PATH, AdminRouter } from '../../../routing';

const { post } = vi.hoisted(() => ({
  post: vi.fn(),
}));
vi.mock('../../../config/axios', () => ({
  default: { post },
}));

import LoginAdmin from './index';

const renderLogin = () => render(
  <AdminRouter>
    <LoginAdmin />
  </AdminRouter>,
);

const submitCredentials = () => {
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'ADMIN@EXAMPLE.TEST ' },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: 'StrongAdmin1!Pass' },
  });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

describe('admin sign in', () => {
  beforeEach(() => {
    post.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, '', ADMIN_BASE_PATH);
  });

  it('stores and navigates only after receiving a validated admin session', async () => {
    post.mockResolvedValue({
      data: {
        data: {
          token: 'verified-admin-token',
          admin: {
            _id: 'admin-1',
            fullName: 'Vybe Admin',
            role: 'SUPER_ADMIN',
          },
        },
      },
    });

    renderLogin();
    submitCredentials();

    await waitFor(() => {
      expect(window.location.pathname).toBe(`${ADMIN_BASE_PATH}/home`);
    });
    expect(post).toHaveBeenCalledWith('/admins/login', {
      email: 'admin@example.test',
      password: 'StrongAdmin1!Pass',
    });
    expect(window.sessionStorage.getItem('access_token')).toBe('verified-admin-token');
    expect(window.localStorage.length).toBe(0);
  });

  it('does not report success or navigate on a malformed login response', async () => {
    post.mockResolvedValue({ data: { data: { admin: { role: 'SUPER_ADMIN' } } } });

    renderLogin();
    submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vybe returned an invalid administrator session.',
    );
    expect(window.sessionStorage.getItem('access_token')).toBeNull();
    expect(window.location.pathname).toBe(ADMIN_BASE_PATH);
  });
});
