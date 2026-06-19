import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Support Hub navbar brand', () => {
  render(<App />);
  const titleElement = screen.getByText((content, element) => {
    return element.textContent.replace(/\s+/g, '') === 'SupportHub';
  });
  expect(titleElement).toBeInTheDocument();
});
