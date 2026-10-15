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
import Login from '../pages/login';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders inside AuthLayout with correct title', () => {
    renderLogin();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  it('renders a Login submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows error when submitting with empty fields', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
    });
  });

  it('does not call apiFetch when fields are empty', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(apiFetch).not.toHaveBeenCalled();
    });
  });

  it('calls apiFetch with correct args on valid submit', async () => {
    apiFetch.mockResolvedValueOnce({ token: 'abc123' });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/oauth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'secret' }),
      }));
    });
  });

  it('saves token to localStorage and navigates to /dashboard on success', async () => {
    apiFetch.mockResolvedValueOnce({ token: 'abc123' });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('abc123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows inline error message on failed login', async () => {
    apiFetch.mockRejectedValueOnce(new Error('Invalid credentials'));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows password toggle button', () => {
    renderLogin();
    // Should have a button to toggle password visibility
    const toggleBtn = screen.getByRole('button', { name: /show password|hide password|toggle password/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText(/••••••••/);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password|hide password|toggle password/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  it('renders a link to /register', () => {
    renderLogin();
    const registerLink = screen.getByText(/register/i, { selector: 'a' });
    expect(registerLink).toBeInTheDocument();
  });
});
