import { render, screen } from '@testing-library/react';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import system from './components/system';

test('renders the admin sign-in experience', async () => {
  window.history.pushState({}, '', '/admin/');
  render(
    <ChakraProvider value={system}>
      <App />
    </ChakraProvider>,
  );
  expect(await screen.findByRole('heading', { name: /admin login/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
