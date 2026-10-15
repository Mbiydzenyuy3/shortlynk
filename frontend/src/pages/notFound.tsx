import { Link } from 'react-router-dom';
import { LinkIcon } from 'lucide-react';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found — Shortlynk" description="The page you're looking for doesn't exist." noindex />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <LinkIcon size={48} color="var(--color-yellow)" style={{ marginBottom: '24px' }} />
        <h1 style={{ fontSize: '96px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '16px', marginBottom: '8px' }}>
          Page not found
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px', marginBottom: '32px', maxWidth: '400px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="btn btn--primary"
          style={{ textDecoration: 'none', padding: '12px 24px', fontSize: '15px' }}
        >
          Back to home
        </Link>
      </div>
    </>
  );
}
