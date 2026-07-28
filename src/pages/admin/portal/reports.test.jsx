import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_BASE_PATH, AdminRouter } from '../../../routing';

const { get, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));
vi.mock('../../../config/axios', () => ({
  default: { get, patch },
}));

import Reports from './reports';

const report = {
  _id: 'report-1',
  targetType: 'post',
  targetId: 'post-1',
  reason: 'harassment',
  detail: 'Repeated abusive messages',
  status: 'pending',
  reporter: { username: 'reporter' },
  targetOwner: {
    _id: 'owner-1',
    username: 'owner',
    suspended: false,
    available: true,
  },
  targetPreview: {
    id: 'post-1',
    exists: true,
    removed: false,
    title: 'Fitness post',
    body: 'The exact reported content appears here.',
    imageUrl: 'https://media.example.test/post.jpg',
  },
  createdAt: '2026-07-28T07:00:00.000Z',
};

describe('moderation enforcement console', () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    get.mockResolvedValue({
      data: {
        reports: [report],
        page: 1,
        total: 1,
        hasNextPage: false,
      },
    });
    window.history.replaceState({}, '', `${ADMIN_BASE_PATH}/reports`);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows the resolved target preview and requires a reason for content removal', async () => {
    patch.mockResolvedValue({
      data: {
        report: {
          ...report,
          status: 'actioned',
          moderationAction: 'remove_content',
          targetPreview: {
            ...report.targetPreview,
            exists: false,
            removed: true,
          },
        },
      },
    });
    render(
      <AdminRouter>
        <Reports />
      </AdminRouter>,
    );

    expect(await screen.findByText('Fitness post')).toBeInTheDocument();
    expect(screen.getByText('The exact reported content appears here.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove content/i }));
    expect(await screen.findByText(/add a short moderation reason/i)).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Moderation note'), {
      target: { value: 'Confirmed abusive content' },
    });
    fireEvent.click(screen.getByRole('button', { name: /remove content/i }));
    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith('/admin/reports/report-1', {
        action: 'remove_content',
        note: 'Confirmed abusive content',
      });
    });
    expect(window.confirm).toHaveBeenCalled();
    expect(await screen.findByText(/no reports match these filters/i)).toBeInTheDocument();
  });

  it('offers restoration for a moderation-suspended target owner', async () => {
    const suspendedReport = {
      ...report,
      status: 'actioned',
      moderationAction: 'suspend_user',
      targetOwner: {
        ...report.targetOwner,
        suspended: true,
        available: false,
      },
    };
    get.mockResolvedValue({ data: { reports: [suspendedReport] } });
    patch.mockResolvedValue({
      data: {
        report: {
          ...suspendedReport,
          moderationAction: 'restore_user',
          targetOwner: {
            ...suspendedReport.targetOwner,
            suspended: false,
            available: true,
          },
        },
      },
    });

    render(
      <AdminRouter>
        <Reports />
      </AdminRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /restore member/i }));
    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith('/admin/reports/report-1', {
        action: 'restore_user',
      });
    });
  });

  it('includes profile reports without offering the invalid content-removal action', async () => {
    const profileReport = {
      ...report,
      _id: 'profile-report',
      targetType: 'user',
      targetId: 'owner-1',
      targetPreview: {
        id: 'owner-1',
        exists: true,
        removed: false,
        title: '@owner',
        body: 'Reported member profile',
      },
    };
    get.mockResolvedValue({ data: { reports: [profileReport] } });

    render(
      <AdminRouter>
        <Reports />
      </AdminRouter>,
    );

    expect(await screen.findByText('@owner')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'profiles' })).toHaveValue('user');
    expect(screen.queryByRole('button', { name: /remove content/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suspend member/i })).toBeEnabled();
  });

  it('paginates a moderation queue without making later reports unreachable', async () => {
    get
      .mockResolvedValueOnce({
        data: {
          reports: [report],
          page: 1,
          total: 101,
          hasNextPage: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          reports: [{ ...report, _id: 'report-101', detail: 'Last queued report' }],
          page: 2,
          total: 101,
          hasNextPage: false,
        },
      });

    render(
      <AdminRouter>
        <Reports />
      </AdminRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Last queued report')).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith('/admin/reports', expect.objectContaining({
      params: expect.objectContaining({ page: 2, limit: 100 }),
    }));
  });
});
