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

        {/* Google OAuth — temporarily disabled until OAuth is fully configured
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
          Continue with Google
        </button>
        */}
      </form>
    </AuthLayout>
  );
}
