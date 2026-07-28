import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN_BASE_PATH, AdminRouter, useAdminRouter } from './routing';

const RoutingProbe = () => {
  const { navigate, route } = useAdminRouter();
  return (
    <>
      <output aria-label="current route">{route}</output>
      <button type="button" onClick={() => navigate('/users')}>Open users</button>
    </>
  );
};

describe('admin routing base path', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', `${ADMIN_BASE_PATH}/reports`);
  });

  it('reads and writes routes beneath the configured Vite base path', () => {
    render(
      <AdminRouter>
        <RoutingProbe />
      </AdminRouter>,
    );

    expect(screen.getByLabelText('current route')).toHaveTextContent('/reports');
    fireEvent.click(screen.getByRole('button', { name: /open users/i }));
    expect(window.location.pathname).toBe(`${ADMIN_BASE_PATH}/users`);
    expect(screen.getByLabelText('current route')).toHaveTextContent('/users');
  });
});
