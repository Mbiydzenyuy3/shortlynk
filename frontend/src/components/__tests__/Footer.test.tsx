import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

function renderFooter() {
  return render(<MemoryRouter><Footer /></MemoryRouter>);
}

describe('Footer', () => {
  it('shows the brand name and current year', () => {
    renderFooter();
    expect(screen.getByText('Shortlynk')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('does not render the removed nav links', () => {
    renderFooter();
    for (const label of ['Features', 'Dashboard', 'Login', 'Register']) {
      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
  });

  it('is laid out as a single centered column', () => {
    const { container } = renderFooter();
    const footer = container.querySelector('footer');
    expect(footer.style.flexDirection).toBe('column');
    expect(footer.style.alignItems).toBe('center');
    expect(footer.style.textAlign).toBe('center');
  });
});
