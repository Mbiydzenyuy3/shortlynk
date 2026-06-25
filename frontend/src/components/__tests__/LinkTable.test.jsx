import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LinkTable from '../LinkTable';

vi.mock('../LinkRow', () => ({
  default: ({ url, onDelete, onEdit }) => (
    <tr data-testid="link-row">
      <td>{url.short_code}</td>
      <td>{url.short_url}</td>
      <td>{url.long_url}</td>
      <td>{url.click_count ?? 0}</td>
      <td><button onClick={() => onDelete(url.short_code)}>Delete</button></td>
    </tr>
  ),
}));

const makeUrls = (n) =>
  Array.from({ length: n }, (_, i) => ({
    short_code: `code${i}`,
    short_url: `https://shrt.ly/code${i}`,
    long_url: `https://example.com/page/${i}`,
    click_count: i,
    created_at: new Date().toISOString(),
    expire_at: null,
  }));

const noop = () => {};

test('renders column headers', () => {
  render(<LinkTable urls={[]} loading={false} onDelete={noop} onEdit={noop} />);
  expect(screen.getByText(/Created/i)).toBeInTheDocument();
  expect(screen.getByText(/Short link/i)).toBeInTheDocument();
  expect(screen.getByText(/Original link/i)).toBeInTheDocument();
  expect(screen.getByText(/Clicks/i)).toBeInTheDocument();
});

test('shows empty state when urls is empty and not loading', () => {
  render(<LinkTable urls={[]} loading={false} onDelete={noop} onEdit={noop} />);
  expect(screen.getByText('No links yet')).toBeInTheDocument();
});

test('shows 3 skeleton rows when loading', () => {
  const { container } = render(
    <LinkTable urls={[]} loading={true} onDelete={noop} onEdit={noop} />
  );
  const tbodyRows = container.querySelectorAll('tbody tr');
  expect(tbodyRows).toHaveLength(3);
});

test('shows all-links count in header', () => {
  render(<LinkTable urls={makeUrls(5)} loading={false} onDelete={noop} onEdit={noop} />);
  expect(screen.getByText('(5)')).toBeInTheDocument();
});

test('filters urls by search term and updates count', () => {
  render(<LinkTable urls={makeUrls(5)} loading={false} onDelete={noop} onEdit={noop} />);
  const input = screen.getByPlaceholderText('Search or filter...');
  fireEvent.change(input, { target: { value: 'code0' } });
  expect(screen.getByText('(1)')).toBeInTheDocument();
});

test('shows "no links match" when search has no results', () => {
  render(<LinkTable urls={makeUrls(3)} loading={false} onDelete={noop} onEdit={noop} />);
  const input = screen.getByPlaceholderText('Search or filter...');
  fireEvent.change(input, { target: { value: 'xyzxyzxyz_nomatch' } });
  expect(screen.getByText('No links match your search.')).toBeInTheDocument();
});

test('shows pagination navigation when more than 20 urls', () => {
  render(<LinkTable urls={makeUrls(25)} loading={false} onDelete={noop} onEdit={noop} />);
  expect(screen.getByText('›')).toBeInTheDocument();
  expect(screen.getByText('‹')).toBeInTheDocument();
});

test('does not show pagination when 20 or fewer urls', () => {
  render(<LinkTable urls={makeUrls(20)} loading={false} onDelete={noop} onEdit={noop} />);
  expect(screen.queryByText('›')).not.toBeInTheDocument();
});
