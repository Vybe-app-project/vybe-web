import { render, screen } from '@testing-library/react';
import App from './App';
import { ADMIN_BASE_PATH } from './routing';

test('renders the admin sign-in experience', async () => {
  window.history.pushState({}, '', `${ADMIN_BASE_PATH}/`);
  render(<App />);
  expect(await screen.findByRole('heading', { name: /admin login/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
