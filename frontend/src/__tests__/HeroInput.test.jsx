import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import HeroInput from '../components/HeroInput';
import * as api from '../api';

describe('HeroInput', () => {
  it('renders the URL input and Shorten button', () => {
    render(<HeroInput />);
    expect(screen.getByPlaceholderText(/paste your long url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
  });

  it('shows result card after successful shorten', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({ shortened_URL: 'https://short.ly/abc' });
    render(<HeroInput />);

    fireEvent.change(screen.getByPlaceholderText(/paste your long url/i), {
      target: { value: 'https://example.com/long-path' },
    });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByText('https://short.ly/abc')).toBeInTheDocument();
    });
  });

  it('shows error message on invalid URL submission', async () => {
    render(<HeroInput />);
    fireEvent.change(screen.getByPlaceholderText(/paste your long url/i), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid url/i)).toBeInTheDocument();
    });
  });
});
