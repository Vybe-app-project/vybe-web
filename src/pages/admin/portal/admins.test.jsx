import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '../../../context/admin-session';
import { ADMIN_BASE_PATH, AdminRouter } from '../../../routing';

const {
  deleteRequest,
  get,
  post,
  put,
} = vi.hoisted(() => ({
  deleteRequest: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));
vi.mock('../../../config/axios', () => ({
  default: {
    delete: deleteRequest,
    get,
    post,
    put,
  },
}));

import Admins from './admins';

const rootAdmin = {
  _id: 'root-admin',
  fullName: 'Root Admin',
  email: 'root@example.test',
  role: 'SUPER_ADMIN',
  createdAt: '2026-07-28T07:00:00.000Z',
};
const staffAdmin = {
  _id: 'staff-admin',
  fullName: 'Staff Admin',
  email: 'staff@example.test',
  role: 'ADMIN',
  createdAt: '2026-07-28T08:00:00.000Z',
};

const renderPage = () => render(
  <AdminRouter>
    <AdminSessionProvider>
      <Admins />
    </AdminSessionProvider>
  </AdminRouter>,
);

describe('secure admin management', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    deleteRequest.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.sessionStorage.setItem('access_token', 'test-admin-token');
    window.history.replaceState({}, '', `${ADMIN_BASE_PATH}/admins`);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('loads role controls only after validating a live super-admin session', async () => {
    get.mockImplementation((url) => {
      if (url === '/admins/me') {
        return Promise.resolve({ data: { data: { admin: rootAdmin } } });
      }
      if (url === '/admins') {
        return Promise.resolve({
          data: { data: { admins: [rootAdmin, staffAdmin] } },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    put.mockResolvedValue({
      data: {
        data: {
          admin: { ...staffAdmin, role: 'SUPER_ADMIN' },
        },
      },
    });

    renderPage();

    expect(await screen.findByRole('button', { name: /add admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audit log/i })).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/admins/me');
    expect(get).toHaveBeenCalledWith('/admins');
    fireEvent.change(
      await screen.findByRole('combobox', { name: 'Role for Staff Admin' }),
      { target: { value: 'SUPER_ADMIN' } },
    );
    await waitFor(() => {
      expect(put).toHaveBeenCalledWith('/admins/staff-admin', {
        role: 'SUPER_ADMIN',
      });
    });
    expect(window.confirm).toHaveBeenCalled();
  });

  it('never trusts a cached super-admin profile for an ordinary live session', async () => {
    window.localStorage.setItem('admin_profile', JSON.stringify(rootAdmin));
    get.mockResolvedValue({
      data: {
        data: {
          admin: { ...staffAdmin, role: 'ADMIN' },
        },
      },
    });

    renderPage();

    expect(await screen.findByText(/super administrator privileges are required/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /audit log/i })).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/admins/me');
  });

  it('clears and redirects a malformed live administrator session', async () => {
    get.mockResolvedValue({
      data: {
        data: {
          admin: {
            _id: 'malformed-admin',
            fullName: 'Malformed Admin',
            role: 'OWNER',
          },
        },
      },
    });

    renderPage();

    await waitFor(() => {
      expect(window.location.pathname).toBe(ADMIN_BASE_PATH);
    });
    expect(window.sessionStorage.getItem('access_token')).toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
  });
});
