import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const renderAuthLayout = (props = {}) =>
  render(
    <MemoryRouter>
      <AuthLayout
        title="Welcome Back"
        subtitle="Sign in to your account"
        toggleText="Don't have an account?"
        toggleHref="/register"
        {...props}
      >
        <div>form content</div>
      </AuthLayout>
    </MemoryRouter>
  );

describe('AuthLayout', () => {
  it('renders the Shortlynk brand in the left panel', () => {
    renderAuthLayout();
    // There are two "Shortlynk" text nodes (left panel + right panel)
    const instances = screen.getAllByText('Shortlynk');
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the title prop', () => {
    renderAuthLayout({ title: 'Create Account' });
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('renders the subtitle prop when provided', () => {
    renderAuthLayout({ subtitle: 'Start shortening today' });
    expect(screen.getByText('Start shortening today')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    renderAuthLayout({ subtitle: undefined });
    expect(screen.queryByText('Sign in to your account')).not.toBeInTheDocument();
  });

  it('renders the toggleText prop', () => {
    renderAuthLayout({ toggleText: "Already have an account?" });
    expect(screen.getByText(/Already have an account\?/)).toBeInTheDocument();
  });

  it('renders Register link when toggleHref is /register', () => {
    renderAuthLayout({ toggleHref: '/register' });
    expect(screen.getByText('Register →')).toBeInTheDocument();
  });

  it('renders Login link when toggleHref is /login', () => {
    renderAuthLayout({ toggleHref: '/login' });
    expect(screen.getByText('Login →')).toBeInTheDocument();
  });

  it('renders children inside the right panel', () => {
    renderAuthLayout();
    expect(screen.getByText('form content')).toBeInTheDocument();
  });

  it('renders the left panel with auth-panel-left class', () => {
    const { container } = renderAuthLayout();
    expect(container.querySelector('.auth-panel-left')).toBeInTheDocument();
  });

  it('renders stats: 10M+ Links Created and 99.9% Uptime', () => {
    renderAuthLayout();
    expect(screen.getByText('10M+')).toBeInTheDocument();
    expect(screen.getByText('Links Created')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
  });

  it('renders the tagline in the left panel', () => {
    renderAuthLayout();
    expect(screen.getByText('The smart way to share links')).toBeInTheDocument();
  });
});
