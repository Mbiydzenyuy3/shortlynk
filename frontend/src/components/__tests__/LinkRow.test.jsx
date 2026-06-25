import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LinkRow from '../LinkRow';

const MOCK_URL = {
  short_code: 'abc123',
  short_url: 'https://shrt.ly/abc123',
  long_url: 'https://example.com/very/long/path',
  click_count: 5,
  created_at: '2026-06-25T10:40:00Z',
  expire_at: null,
};

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

function wrap(ui) {
  return render(<table><tbody>{ui}</tbody></table>);
}

test('renders short_url, long_url, and click_count', () => {
  wrap(<LinkRow url={MOCK_URL} onDelete={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByText('https://shrt.ly/abc123')).toBeInTheDocument();
  expect(screen.getByText('https://example.com/very/long/path')).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});

test('copy button calls clipboard.writeText with short_url', () => {
  wrap(<LinkRow url={MOCK_URL} onDelete={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByTitle('Copy short link'));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://shrt.ly/abc123');
});

test('delete button calls onDelete with shortCode', () => {
  const onDelete = vi.fn();
  wrap(<LinkRow url={MOCK_URL} onDelete={onDelete} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByTitle('Delete'));
  expect(onDelete).toHaveBeenCalledWith('abc123');
});

test('pencil button switches to edit mode showing Save and Cancel', () => {
  wrap(<LinkRow url={MOCK_URL} onDelete={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByTitle('Edit expiry'));
  expect(screen.getByText('Save')).toBeInTheDocument();
  expect(screen.getByText('Cancel')).toBeInTheDocument();
});

test('save button calls onEdit with shortCode and date, then exits edit mode', async () => {
  const onEdit = vi.fn().mockResolvedValue(undefined);
  wrap(<LinkRow url={MOCK_URL} onDelete={vi.fn()} onEdit={onEdit} />);
  fireEvent.click(screen.getByTitle('Edit expiry'));
  const dateInput = screen.getByDisplayValue('');
  fireEvent.change(dateInput, { target: { value: '2026-08-01' } });
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(onEdit).toHaveBeenCalledWith('abc123', '2026-08-01'));
  await waitFor(() => expect(screen.queryByText('Save')).not.toBeInTheDocument());
});

test('save with empty date calls onEdit with null (clear expiry)', async () => {
  const onEdit = vi.fn().mockResolvedValue(undefined);
  wrap(<LinkRow url={MOCK_URL} onDelete={vi.fn()} onEdit={onEdit} />);
  fireEvent.click(screen.getByTitle('Edit expiry'));
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(onEdit).toHaveBeenCalledWith('abc123', null));
});

test('cancel button exits edit mode without calling onEdit', () => {
  const onEdit = vi.fn();
  wrap(<LinkRow url={MOCK_URL} onDelete={vi.fn()} onEdit={onEdit} />);
  fireEvent.click(screen.getByTitle('Edit expiry'));
  fireEvent.click(screen.getByText('Cancel'));
  expect(onEdit).not.toHaveBeenCalled();
  expect(screen.queryByText('Save')).not.toBeInTheDocument();
});

test('shows error message when onEdit throws', async () => {
  const onEdit = vi.fn().mockRejectedValue(new Error('URL not found.'));
  wrap(<LinkRow url={MOCK_URL} onDelete={vi.fn()} onEdit={onEdit} />);
  fireEvent.click(screen.getByTitle('Edit expiry'));
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(screen.getByText('URL not found.')).toBeInTheDocument());
  expect(screen.getByText('Save')).toBeInTheDocument(); // stays in edit mode
});
