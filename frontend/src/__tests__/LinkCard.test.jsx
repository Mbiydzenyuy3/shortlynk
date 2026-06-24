import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LinkCard from '../components/LinkCard';

const defaultProps = {
  short_url: 'https://short.ly/abc',
  long_url: 'https://example.com/very/long/path',
  click_count: 42,
  expire_at: null,
  short_code: 'abc',
  onDelete: vi.fn(),
};

describe('LinkCard', () => {
  it('renders the short URL', () => {
    render(<LinkCard {...defaultProps} />);
    expect(screen.getByText('https://short.ly/abc')).toBeInTheDocument();
  });

  it('renders the click count', () => {
    render(<LinkCard {...defaultProps} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('shows "Never" when expire_at is null', () => {
    render(<LinkCard {...defaultProps} />);
    expect(screen.getByText(/never/i)).toBeInTheDocument();
  });

  it('calls onDelete when Delete button is clicked', () => {
    render(<LinkCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle(/delete/i));
    expect(defaultProps.onDelete).toHaveBeenCalledWith('abc');
  });

  it('shows copy success feedback after clicking copy', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
    render(<LinkCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle(/copy/i));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://short.ly/abc');
    });
  });
});
