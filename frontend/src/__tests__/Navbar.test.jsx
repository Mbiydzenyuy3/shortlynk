import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const renderNav = (props) =>
  render(<MemoryRouter><Navbar {...props} /></MemoryRouter>);

describe('Navbar', () => {
  it('renders the Shortlynk logo text', () => {
    renderNav({ variant: 'dark' });
    expect(screen.getByText('Shortlynk')).toBeInTheDocument();
  });

  it('shows Login and Get Started when not authenticated', () => {
    renderNav({ variant: 'dark', isAuthenticated: false });
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('shows Logout when authenticated', () => {
    renderNav({ variant: 'light', isAuthenticated: true });
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('applies dark class when variant is dark', () => {
    const { container } = renderNav({ variant: 'dark' });
    expect(container.querySelector('nav')).toHaveClass('navbar--dark');
  });
});
