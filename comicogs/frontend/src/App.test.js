import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Comicogs heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Comicogs/i);
  expect(headingElement).toBeInTheDocument();
});
