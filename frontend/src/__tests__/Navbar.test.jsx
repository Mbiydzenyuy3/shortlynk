import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('hides Login and shows the account menu when authenticated', () => {
    renderNav({ variant: 'light', isAuthenticated: true });
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Account/ })).toBeInTheDocument();
  });

  it('shows Logout once the account menu is opened', async () => {
    const user = userEvent.setup();
    renderNav({ variant: 'light', isAuthenticated: true });

    // Logout lives inside the dropdown, which is closed until clicked.
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Account/ }));
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('applies dark class when variant is dark', () => {
    const { container } = renderNav({ variant: 'dark' });
    expect(container.querySelector('nav')).toHaveClass('navbar--dark');
  });
});
