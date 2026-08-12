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
import Register from '../pages/register';

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders inside AuthLayout with correct title', () => {
    renderRegister();
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('renders username, email, and password inputs', () => {
    renderRegister();
    expect(screen.getByPlaceholderText(/yourname/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  it('renders a Create Account submit button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows inline error when submitting with empty fields', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
    });
  });

  it('does not call apiFetch when fields are empty', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(apiFetch).not.toHaveBeenCalled();
    });
  });

  it('does not use alert()', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    apiFetch.mockRejectedValueOnce(new Error('Server error'));
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText(/yourname/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'u@e.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(alertSpy).not.toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('calls apiFetch with correct args on valid submit', async () => {
    apiFetch.mockResolvedValueOnce({});
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText(/yourname/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/oauth/register', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'password123' }),
      }));
    });
  });

  it('stores the token and goes to the dashboard on successful registration', async () => {
    apiFetch.mockResolvedValueOnce({ token: 'fake-jwt' });
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText(/yourname/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    expect(localStorage.getItem('token')).toBe('fake-jwt');
  });

  it('shows inline error message on failed registration', async () => {
    apiFetch.mockRejectedValueOnce(new Error('Registration failed'));
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText(/yourname/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
  });

  it('shows password toggle button', () => {
    renderRegister();
    const toggleBtn = screen.getByRole('button', { name: /show password|hide password|toggle password/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    renderRegister();
    const passwordInput = screen.getByPlaceholderText(/••••••••/);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password|hide password|toggle password/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  it('renders a link to /login', () => {
    renderRegister();
    const loginLink = screen.getByText(/login/i, { selector: 'a' });
    expect(loginLink).toBeInTheDocument();
  });
});
