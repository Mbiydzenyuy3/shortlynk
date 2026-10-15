import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '../../api';
import Dashboard from '../dashboard';

const MOCK_URL = {
  short_code: 'abc',
  short_url: 'https://shrt.ly/abc',
  long_url: 'https://example.com',
  click_count: 1,
  created_at: new Date().toISOString(),
  expire_at: null,
};

beforeEach(() => {
  vi.mocked(apiFetch).mockReset();
  localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InRlc3QifQ.sig');
});

afterEach(() => localStorage.clear());

test('fetches urls on mount and renders LinkTable', async () => {
  vi.mocked(apiFetch).mockResolvedValueOnce({ urls: [MOCK_URL] });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() =>
    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/shorten/my-urls')
  );
});

test('handleDelete calls DELETE endpoint and removes url from state', async () => {
  vi.mocked(apiFetch)
    .mockResolvedValueOnce({ urls: [MOCK_URL] })
    .mockResolvedValueOnce({ success: true, message: 'URL deleted.' });

  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => screen.getByText('https://shrt.ly/abc'));

  // Click the Delete button rendered inside LinkRow
  const deleteBtn = screen.getByTitle('Delete');
  fireEvent.click(deleteBtn);

  await waitFor(() =>
    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/shorten/abc', { method: 'DELETE' })
  );
  // URL should be removed from the table
  await waitFor(() =>
    expect(screen.queryByText('https://shrt.ly/abc')).toBeNull()
  );
});

test('handleEdit calls PATCH endpoint with shortCode and expireAt', async () => {
  const updated = { ...MOCK_URL, expire_at: '2026-08-01T00:00:00Z' };
  vi.mocked(apiFetch)
    .mockResolvedValueOnce({ urls: [MOCK_URL] })
    .mockResolvedValueOnce({ success: true, data: updated });

  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => screen.getByText('https://shrt.ly/abc'));

  // Open the edit row
  const editBtn = screen.getByTitle('Edit expiry');
  fireEvent.click(editBtn);

  // Set a date in the date input (select by type to avoid ambiguity with other empty inputs)
  const dateInput = document.querySelector('input[type="date"]');
  fireEvent.change(dateInput, { target: { value: '2026-08-01' } });

  // Click Save
  const saveBtn = screen.getByText('Save');
  fireEvent.click(saveBtn);

  await waitFor(() =>
    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/shorten/abc', {
      method: 'PATCH',
      body: JSON.stringify({ expireAt: '2026-08-01' }),
    })
  );
});

test('redirects to /login when no token', async () => {
  localStorage.clear();
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  // Dashboard navigates away; no fetch should be called
  expect(vi.mocked(apiFetch)).not.toHaveBeenCalled();
});
