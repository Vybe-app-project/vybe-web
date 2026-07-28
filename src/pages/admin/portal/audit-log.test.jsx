import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '../../../context/admin-session';
import { ADMIN_BASE_PATH, AdminRouter } from '../../../routing';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../../config/axios', () => ({
  default: { get },
}));

import AuditLog from './audit-log';

const rootAdmin = {
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Root Admin',
  email: 'root@example.test',
  role: 'SUPER_ADMIN',
};

const renderPage = () => render(
  <AdminRouter>
    <AdminSessionProvider>
      <AuditLog />
    </AdminSessionProvider>
  </AdminRouter>,
);

describe('admin audit log', () => {
  beforeEach(() => {
    get.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.sessionStorage.setItem('access_token', 'test-admin-token');
    window.history.replaceState({}, '', `${ADMIN_BASE_PATH}/audit-log`);
  });

  it('validates super-admin access and exposes every page of immutable events', async () => {
    get.mockImplementation((url, options) => {
      if (url === '/admins/me') {
        return Promise.resolve({ data: { data: { admin: rootAdmin } } });
      }
      if (url === '/admins/audit-log' && options?.params?.page === 1) {
        return Promise.resolve({
          data: {
            entries: [{
              _id: 'event-1',
              action: 'ADMIN_ROLE_CHANGED',
              targetType: 'admin',
              targetId: 'admin-2',
              actorSnapshot: rootAdmin,
              createdAt: '2026-07-28T07:00:00.000Z',
            }],
            pagination: { page: 1, pages: 2, total: 101 },
          },
        });
      }
      if (url === '/admins/audit-log' && options?.params?.page === 2) {
        return Promise.resolve({
          data: {
            entries: [{
              _id: 'event-101',
              action: 'REPORT_DISMISSED',
              targetType: 'report',
              targetId: 'report-101',
              actorSnapshot: rootAdmin,
              createdAt: '2026-07-27T07:00:00.000Z',
            }],
            pagination: { page: 2, pages: 2, total: 101 },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    renderPage();

    expect(await screen.findByText('ADMIN ROLE CHANGED')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('REPORT DISMISSED')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/admins/audit-log', expect.objectContaining({
      params: expect.objectContaining({ page: 2, limit: 100 }),
    }));
  });
});
