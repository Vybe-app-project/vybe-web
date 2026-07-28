import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_BASE_PATH, AdminRouter } from '../../../routing';

const { get, patch } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));
vi.mock('../../../config/axios', () => ({
  default: { get, patch },
}));

import SupportInbox from './support';

describe('admin support inbox', () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    window.localStorage.clear();
    window.history.replaceState({}, '', `${ADMIN_BASE_PATH}/support`);
  });

  it('loads open requests and resolves one without exposing it in the open queue', async () => {
    const supportMessage = {
      _id: 'support-1',
      fullName: 'Vybe Member',
      email: 'member@example.test',
      message: 'Please delete my account.',
      status: 'open',
      createdAt: '2026-07-28T07:00:00.000Z',
    };
    get.mockResolvedValue({ data: { messages: [supportMessage] } });
    patch.mockResolvedValue({
      data: { supportMessage: { ...supportMessage, status: 'resolved' } },
    });

    render(
      <AdminRouter>
        <SupportInbox />
      </AdminRouter>,
    );

    expect(await screen.findByText('Please delete my account.')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('/admin/support', expect.objectContaining({
      params: { status: 'open', page: 1, limit: 100 },
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith('/admin/support/support-1', { status: 'resolved' });
    });
    expect(await screen.findByText('No open support requests')).toBeInTheDocument();
  });

  it('reloads the inbox when the status filter changes', async () => {
    get
      .mockResolvedValueOnce({ data: { messages: [] } })
      .mockResolvedValueOnce({
        data: {
          messages: [{
            _id: 'support-2',
            fullName: 'Resolved Member',
            email: 'resolved@example.test',
            message: 'This request is complete.',
            status: 'resolved',
          }],
        },
      });

    render(
      <AdminRouter>
        <SupportInbox />
      </AdminRouter>,
    );

    expect(await screen.findByText('No open support requests')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'resolved' }));
    expect(await screen.findByText('This request is complete.')).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith('/admin/support', expect.objectContaining({
      params: { status: 'resolved', page: 1, limit: 100 },
    }));
  });

  it('keeps older private requests reachable through server pagination', async () => {
    get
      .mockResolvedValueOnce({
        data: {
          messages: [{
            _id: 'support-1',
            fullName: 'Newest Visitor',
            message: 'Newest support request.',
            status: 'open',
          }],
          pagination: { page: 1, pages: 2, total: 101 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          messages: [{
            _id: 'support-101',
            fullName: 'Older Visitor',
            message: 'Older support request.',
            status: 'open',
          }],
          pagination: { page: 2, pages: 2, total: 101 },
        },
      });

    render(
      <AdminRouter>
        <SupportInbox />
      </AdminRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Older support request.')).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith('/admin/support', expect.objectContaining({
      params: { status: 'open', page: 2, limit: 100 },
    }));
  });
});
