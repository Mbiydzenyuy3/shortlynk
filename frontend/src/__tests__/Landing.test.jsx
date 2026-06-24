import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LandingPage from '../pages/landing';

// Mock HeroInput to avoid API calls in tests
vi.mock('../components/HeroInput', () => ({
  default: () => <div data-testid="hero-input">HeroInput</div>,
}));

// Mock api to avoid fetch issues
vi.mock('../api', () => ({
  apiFetch: vi.fn(),
}));

const renderLanding = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

describe('LandingPage', () => {
  it('renders the Navbar with dark variant', () => {
    renderLanding();
    // Navbar dark class is applied
    const nav = document.querySelector('nav.navbar--dark');
    expect(nav).toBeInTheDocument();
  });

  it('renders the hero headline', () => {
    renderLanding();
    expect(screen.getByText('Shorten. Share. Track.')).toBeInTheDocument();
  });

  it('renders the hero sub-text', () => {
    renderLanding();
    expect(
      screen.getByText(/Turn long, ugly URLs into powerful short links/i)
    ).toBeInTheDocument();
  });

  it('renders the HeroInput component', () => {
    renderLanding();
    expect(screen.getByTestId('hero-input')).toBeInTheDocument();
  });

  it('renders the stats row with correct numbers', () => {
    renderLanding();
    expect(screen.getByText('10M+')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
    expect(screen.getByText('< 50ms')).toBeInTheDocument();
  });

  it('renders the Features section heading', () => {
    renderLanding();
    expect(
      screen.getByText('Everything you need to share smarter')
    ).toBeInTheDocument();
  });

  it('renders all three feature cards', () => {
    renderLanding();
    expect(screen.getByText('Custom Short Links')).toBeInTheDocument();
    expect(screen.getByText('Click Analytics')).toBeInTheDocument();
    expect(screen.getByText('Secure & Reliable')).toBeInTheDocument();
  });

  it('renders the How It Works section heading', () => {
    renderLanding();
    expect(screen.getByText('Up and running in seconds')).toBeInTheDocument();
  });

  it('renders all three how-it-works steps', () => {
    renderLanding();
    expect(screen.getByText('Paste your URL')).toBeInTheDocument();
    expect(screen.getByText('Click Shorten')).toBeInTheDocument();
    expect(screen.getByText('Share & Track')).toBeInTheDocument();
  });

  it('renders the CTA banner heading', () => {
    renderLanding();
    expect(screen.getByText('Start shortening for free')).toBeInTheDocument();
  });

  it('renders a Get Started Free button linking to /register', () => {
    renderLanding();
    const link = screen.getByRole('link', { name: /Get Started Free/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders the Footer', () => {
    renderLanding();
    // Footer has the copyright text with year
    expect(screen.getByText(/© \d{4} Shortlynk/i)).toBeInTheDocument();
  });

  it('does not import LandingHeader (deleted component)', () => {
    // If LandingHeader were imported and rendered, it would throw since it doesn't exist.
    // This test confirms rendering succeeds without errors.
    expect(() => renderLanding()).not.toThrow();
  });
});
