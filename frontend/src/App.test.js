import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FAQ App navbar title', () => {
  render(<App />);
  const titleElement = screen.getByText(/FAQ App/i);
  expect(titleElement).toBeInTheDocument();
});
