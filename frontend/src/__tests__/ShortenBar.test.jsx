import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ShortenBar from '../components/ShortenBar';
import * as api from '../api';

describe('ShortenBar', () => {
  it('renders the URL input and Shorten button', () => {
    render(<ShortenBar onShortened={() => {}} />);
    expect(screen.getByPlaceholderText(/paste your long url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
  });

  it('shows inline result after successful shorten and calls onShortened', async () => {
    const onShortened = vi.fn();
    vi.spyOn(api, 'apiFetch').mockResolvedValue({ shortened_URL: 'https://short.ly/xyz' });
    render(<ShortenBar onShortened={onShortened} />);

    fireEvent.change(screen.getByPlaceholderText(/paste your long url/i), {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByText('https://short.ly/xyz')).toBeInTheDocument();
      expect(onShortened).toHaveBeenCalled();
    });
  });
});
