import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

const member = (index, name = `Member ${index}`) => ({
  _id: `member-${index}`,
  fullName: name,
  username: `member-${index}`,
  email: `member-${index}@example.test`,
  createdAt: '2026-07-28T08:00:00.000Z',
});

const memberPage = ({
  users = [],
  page = 1,
  total = users.length,
  limit = 100,
} = {}) => {
  const pages = Math.ceil(total / limit);
  return {
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPreviousPage: page > 1,
      },
    },
  };
};

const emptyTrainerPage = {
  data: {
    applications: [],
    pagination: { page: 1, pages: 0, total: 0 },
  },
};

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
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
        return Promise.resolve(memberPage());
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

    const trainerPages = screen.getByRole('navigation', {
      name: 'Trainer application pages',
    });
    fireEvent.click(within(trainerPages).getByRole('button', { name: 'Next' }));
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

  it('makes members beyond the first 100 reachable with server paging and exact counts', async () => {
    const firstHundred = Array.from({ length: 100 }, (_, index) => member(index + 1));
    let initialRequest;
    get.mockImplementation((url, options) => {
      if (url === '/admin/trainer-applications') {
        return Promise.resolve(emptyTrainerPage);
      }
      if (url === '/admin/users' && options?.params?.page === 1) {
        initialRequest = options;
        return Promise.resolve(memberPage({
          users: firstHundred,
          page: 1,
          total: 101,
        }));
      }
      if (url === '/admin/users' && options?.params?.page === 2) {
        return Promise.resolve(memberPage({
          users: [member(101, 'Member Beyond One Hundred')],
          page: 2,
          total: 101,
        }));
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    renderPage();

    expect(await screen.findByText('Member 1')).toBeInTheDocument();
    expect(screen.getByText(/Showing 1–100 of 101 members · Page 1 of 2/)).toBeInTheDocument();
    const firstMemberPages = screen.getByRole('navigation', { name: 'Member pages' });
    expect(within(firstMemberPages).getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(within(firstMemberPages).getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Member Beyond One Hundred')).toBeInTheDocument();
    expect(screen.getByText(/Showing 101–101 of 101 members · Page 2 of 2/)).toBeInTheDocument();
    expect(initialRequest.signal.aborted).toBe(true);
    expect(get).toHaveBeenCalledWith(
      '/admin/users',
      expect.objectContaining({
        params: {
          page: 2,
          limit: 100,
        },
      }),
    );

    const secondMemberPages = screen.getByRole('navigation', { name: 'Member pages' });
    expect(within(secondMemberPages).getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(within(secondMemberPages).getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('debounces literal server search, resets to page one, and ignores stale responses', async () => {
    const staleSearch = deferred();
    let staleSearchRequest;
    get.mockImplementation((url, options) => {
      if (url === '/admin/trainer-applications') {
        return Promise.resolve(emptyTrainerPage);
      }
      if (url !== '/admin/users') {
        return Promise.reject(new Error(`Unexpected GET ${url}`));
      }
      const { page, search } = options.params;
      if (!search && page === 1) {
        return Promise.resolve(memberPage({
          users: [member(1, 'Unfiltered first page')],
          page: 1,
          total: 101,
        }));
      }
      if (!search && page === 2) {
        return Promise.resolve(memberPage({
          users: [member(101, 'Unfiltered second page')],
          page: 2,
          total: 101,
        }));
      }
      if (search === 'first.*[literal]') {
        staleSearchRequest = options;
        return staleSearch.promise;
      }
      if (search === 'second+$') {
        return Promise.resolve(memberPage({
          users: [member(202, 'Current Search Result')],
          page: 1,
          total: 1,
        }));
      }
      return Promise.reject(new Error(`Unexpected member search ${search}`));
    });

    renderPage();

    expect(await screen.findByText('Unfiltered first page')).toBeInTheDocument();
    fireEvent.click(within(
      screen.getByRole('navigation', { name: 'Member pages' }),
    ).getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Unfiltered second page')).toBeInTheDocument();

    const search = screen.getByRole('searchbox', { name: 'Search members' });
    fireEvent.change(search, { target: { value: 'first.*[literal]' } });
    await waitFor(() => {
      expect(staleSearchRequest).toBeDefined();
    }, { timeout: 1_500 });
    expect(staleSearchRequest.params).toEqual({
      page: 1,
      limit: 100,
      search: 'first.*[literal]',
    });

    fireEvent.change(search, { target: { value: 'second' } });
    fireEvent.change(search, { target: { value: 'second+$' } });
    expect(await screen.findByText('Current Search Result', {}, {
      timeout: 1_500,
    })).toBeInTheDocument();
    expect(staleSearchRequest.signal.aborted).toBe(true);
    expect(get).not.toHaveBeenCalledWith(
      '/admin/users',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'second' }),
      }),
    );
    expect(get).toHaveBeenCalledWith(
      '/admin/users',
      expect.objectContaining({
        params: {
          page: 1,
          limit: 100,
          search: 'second+$',
        },
      }),
    );

    await act(async () => {
      staleSearch.resolve(memberPage({
        users: [member(201, 'Stale Search Result')],
        page: 1,
        total: 1,
      }));
      await Promise.resolve();
    });
    expect(screen.queryByText('Stale Search Result')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 1–1 of 1 member matching “second\+\$”/)).toBeInTheDocument();
  });

  it('surfaces member-list failures and retries the same bounded query', async () => {
    let memberAttempts = 0;
    get.mockImplementation((url) => {
      if (url === '/admin/trainer-applications') {
        return Promise.resolve(emptyTrainerPage);
      }
      if (url === '/admin/users') {
        memberAttempts += 1;
        if (memberAttempts === 1) {
          return Promise.reject({
            response: {
              status: 503,
              data: { message: 'Member service temporarily unavailable.' },
            },
          });
        }
        return Promise.resolve(memberPage({
          users: [member(1, 'Recovered Member')],
          total: 1,
        }));
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    renderPage();

    expect(await screen.findByText('Member service temporarily unavailable.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Recovered Member')).toBeInTheDocument();
    expect(memberAttempts).toBe(2);
    expect(get).toHaveBeenLastCalledWith(
      '/admin/users',
      expect.objectContaining({
        params: {
          page: 1,
          limit: 100,
        },
      }),
    );
  });
});
