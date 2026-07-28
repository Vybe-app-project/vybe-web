import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_BASE_PATH, AdminRouter } from '../../../routing';

const { deleteRequest, get, patch } = vi.hoisted(() => ({
  deleteRequest: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
}));
vi.mock('../../../config/axios', () => ({
  default: {
    delete: deleteRequest,
    get,
    patch,
  },
}));

import Users from './users';

const application = {
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Coach Candidate',
  username: 'coach',
  email: 'coach@example.test',
  application: {
    experienceSummary: 'Experienced running and strength coach.',
    fields: ['running'],
    credentialUrls: [
      'https://credentials.example.test/certificate',
      'javascript:alert(1)',
    ],
  },
};

const renderPage = () => render(
  <AdminRouter>
    <Users />
  </AdminRouter>,
);

describe('member and trainer management', () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    deleteRequest.mockReset();
    window.history.replaceState({}, '', `${ADMIN_BASE_PATH}/users`);
  });

  it('paginates trainer reviews and renders only secure credential links', async () => {
    get.mockImplementation((url, options) => {
      if (url === '/admin/users') {
        return Promise.resolve({ data: { users: [] } });
      }
      if (url === '/admin/trainer-applications' && options?.params?.page === 1) {
        return Promise.resolve({
          data: {
            applications: [application],
            pagination: { page: 1, pages: 2, total: 101 },
          },
        });
      }
      if (url === '/admin/trainer-applications' && options?.params?.page === 2) {
        return Promise.resolve({
          data: {
            applications: [{
              ...application,
              _id: '507f191e810c19729de860ea',
              fullName: 'Older Candidate',
              username: 'older-coach',
            }],
            pagination: { page: 2, pages: 2, total: 101 },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    renderPage();

    const safeLink = await screen.findByRole('link', {
      name: 'https://credentials.example.test/certificate',
    });
    expect(safeLink).toHaveAttribute('href', 'https://credentials.example.test/certificate');
    expect(screen.queryByRole('link', { name: /javascript:/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Older Candidate')).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith(
      '/admin/trainer-applications',
      expect.objectContaining({
        params: {
          status: 'pending',
          page: 2,
          limit: 100,
        },
      }),
    );
  });
});
