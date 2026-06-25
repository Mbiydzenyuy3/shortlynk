import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../api';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const GOOGLE_OAUTH_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/oauth/google`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/oauth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      localStorage.setItem('token', res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account"
      toggleText="Don't have an account?"
      toggleHref="/register"
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-secondary)', fontSize: '13px',
          padding: '0 0 12px 0', fontWeight: 500,
        }}
      >
        <ArrowLeft size={15} /> Back to home
      </button>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Email</label>
          <input
            className={`input-field${error ? ' input-field--error' : ''}`}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Password</label>
          <input
            className={`input-field${error ? ' input-field--error' : ''}`}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ paddingRight: '40px' }}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p style={{ color: 'var(--color-error)', fontSize: '13px', margin: 0 }}>{error}</p>}

        <button
          className="btn btn--primary"
          type="submit"
          disabled={loading}
          style={{ width: '100%', height: '48px', fontSize: '15px', justifyContent: 'center', marginTop: '4px' }}
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

        <button
          type="button"
          className="btn btn--ghost-light"
          style={{ width: '100%', height: '48px', justifyContent: 'center', fontSize: '14px' }}
          onClick={() => { window.location.href = GOOGLE_OAUTH_URL; }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '8px' }}>
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.2 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.2 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.8-11.3-7H6.3C9.7 35.6 16.3 40 24 40v4z" transform="translate(0 4)"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>
      </form>
    </AuthLayout>
  );
}
