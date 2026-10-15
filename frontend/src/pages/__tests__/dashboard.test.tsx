import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../api';
import Dashboard from '../dashboard';

const mockedApiFetch = vi.mocked(apiFetch);

const MOCK_URL = {
  short_code: 'abc',
  short_url: 'https://shrt.ly/abc',
  long_url: 'https://example.com',
  click_count: 1,
  created_at: new Date().toISOString(),
  expire_at: null,
};

beforeEach(() => {
  mockedApiFetch.mockReset();
  localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InRlc3QifQ.sig');
});

afterEach(() => localStorage.clear());

test('fetches urls on mount and renders LinkTable', async () => {
  mockedApiFetch.mockResolvedValueOnce({ urls: [MOCK_URL] });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() =>
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/shorten/my-urls')
  );
});

test('handleDelete calls DELETE endpoint and removes url from state', async () => {
  mockedApiFetch
    .mockResolvedValueOnce({ urls: [MOCK_URL] })
    .mockResolvedValueOnce({ success: true, message: 'URL deleted.' });

  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => screen.getByText('https://shrt.ly/abc'));

  const deleteBtn = screen.getByTitle('Delete');
  fireEvent.click(deleteBtn);

  await waitFor(() =>
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/shorten/abc', { method: 'DELETE' })
  );
  await waitFor(() =>
    expect(screen.queryByText('https://shrt.ly/abc')).toBeNull()
  );
});

test('handleEdit calls PATCH endpoint with shortCode and expireAt', async () => {
  const updated = { ...MOCK_URL, expire_at: '2026-08-01T00:00:00Z' };
  mockedApiFetch
    .mockResolvedValueOnce({ urls: [MOCK_URL] })
    .mockResolvedValueOnce({ success: true, data: updated });

  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => screen.getByText('https://shrt.ly/abc'));

  const editBtn = screen.getByTitle('Edit expiry');
  fireEvent.click(editBtn);

  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: '2026-08-01' } });

  const saveBtn = screen.getByText('Save');
  fireEvent.click(saveBtn);

  await waitFor(() =>
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/shorten/abc', {
      method: 'PATCH',
      body: JSON.stringify({ expireAt: '2026-08-01' }),
    })
  );
});

test('redirects to /login when no token', async () => {
  localStorage.clear();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(mockedApiFetch).not.toHaveBeenCalled();
});
