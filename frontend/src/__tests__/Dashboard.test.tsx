import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock api module
vi.mock('../api', () => ({
  apiFetch: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { apiFetch } from '../api';
import Dashboard from '../pages/dashboard';

const mockedApiFetch = vi.mocked(apiFetch);

const sampleLinks = [
  {
    short_code: 'abc123',
    short_url: 'https://shortlynk-production.up.railway.app/abc123',
    long_url: 'https://example.com/some/very/long/path',
    click_count: 5,
    expire_at: null,
    created_at: new Date().toISOString(),
  },
  {
    short_code: 'def456',
    short_url: 'https://shortlynk-production.up.railway.app/def456',
    long_url: 'https://another.com/page',
    click_count: 10,
    expire_at: '2026-12-31T00:00:00.000Z',
    created_at: new Date().toISOString(),
  },
];

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to /login if no token in localStorage', () => {
    mockedApiFetch.mockResolvedValue({ urls: [] });
    renderDashboard();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('does not redirect when token exists', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: [] });
    renderDashboard();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows skeleton cards while loading', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the Navbar with light variant', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/shortlynk/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no links exist', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/no links yet/i)).toBeInTheDocument();
    });
  });

  it('renders link cards after fetching links', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: sampleLinks });
    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/abc123')
      ).toBeInTheDocument();
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/def456')
      ).toBeInTheDocument();
    });
  });

  it('shows all links regardless of count (no artificial clearing)', async () => {
    localStorage.setItem('token', 'test-token');
    const manyLinks = Array.from({ length: 5 }, (_, i) => ({
      short_code: `code${i}`,
      short_url: `https://shortlynk-production.up.railway.app/code${i}`,
      long_url: `https://example.com/${i}`,
      click_count: i,
      expire_at: null,
      created_at: new Date().toISOString(),
    }));
    mockedApiFetch.mockResolvedValue({ urls: manyLinks });
    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/code0')
      ).toBeInTheDocument();
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/code4')
      ).toBeInTheDocument();
    });
  });

  it('displays All links section header with count', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: sampleLinks });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/all links/i)).toBeInTheDocument();
    });
  });

  it('renders the ShortenBar component', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: [] });
    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/paste url here/i)
      ).toBeInTheDocument();
    });
  });

  it('prepends new link when handleNewLink is called via ShortenBar', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch
      .mockResolvedValueOnce({ urls: sampleLinks })
      .mockResolvedValueOnce({
        shortened_URL: 'https://shortlynk-production.up.railway.app/newcode',
        short_code: 'newcode',
        long_url: 'https://newsite.com',
        click_count: 0,
        expire_at: null,
      });

    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/abc123')
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/paste url here/i), {
      target: { value: 'https://newsite.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/newcode')
      ).toBeInTheDocument();
    });
  });

  it('removes a link from the list when handleDelete is called', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch
      .mockResolvedValueOnce({ urls: sampleLinks })
      .mockResolvedValueOnce({});

    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/abc123')
      ).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/delete/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(
        screen.queryByText(
          'https://shortlynk-production.up.railway.app/abc123'
        )
      ).not.toBeInTheDocument();
    });
  });

  it('shows search input to filter links', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: sampleLinks });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search or filter/i)).toBeInTheDocument();
    });
  });

  it('filters links based on search input', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: sampleLinks });
    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/abc123')
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/search or filter/i), {
      target: { value: 'another' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText(
          'https://shortlynk-production.up.railway.app/abc123'
        )
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          'https://shortlynk-production.up.railway.app/def456'
        )
      ).toBeInTheDocument();
    });
  });

  it('calls apiFetch to GET /api/shorten/my-urls on mount', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch.mockResolvedValue({ urls: [] });
    renderDashboard();
    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/api/shorten/my-urls');
    });
  });

  it('calls apiFetch DELETE when deleting a link', async () => {
    localStorage.setItem('token', 'test-token');
    mockedApiFetch
      .mockResolvedValueOnce({ urls: sampleLinks })
      .mockResolvedValueOnce({});

    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByText('https://shortlynk-production.up.railway.app/abc123')
      ).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/delete/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith('/api/shorten/abc123', {
        method: 'DELETE',
      });
    });
  });
});
