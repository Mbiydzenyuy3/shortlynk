import { Link2, BarChart2, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroInput from '../components/HeroInput';

const isAuthenticated = !!localStorage.getItem('token');

const FEATURES = [
  {
    icon: <Link2 size={24} color="var(--color-yellow)" />,
    title: 'Custom Short Links',
    desc: 'Create branded, memorable short URLs that represent you.',
  },
  {
    icon: <BarChart2 size={24} color="var(--color-yellow)" />,
    title: 'Click Analytics',
    desc: 'Track clicks, countries, devices, and referrers in real time.',
  },
  {
    icon: <ShieldCheck size={24} color="var(--color-yellow)" />,
    title: 'Secure & Reliable',
    desc: 'Every link is spam-filtered and served over HTTPS.',
  },
];

const STATS = [
  { number: '10M+', label: 'Links Created' },
  { number: '99.9%', label: 'Uptime' },
  { number: '< 50ms', label: 'Redirect Speed' },
];

const STEPS = [
  { n: 1, title: 'Paste your URL', desc: 'Drop any long URL into the input field above.' },
  { n: 2, title: 'Click Shorten', desc: 'We generate a clean, compact link instantly.' },
  { n: 3, title: 'Share & Track', desc: "Copy it anywhere. Sign up to see who's clicking." },
];

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar variant="dark" isAuthenticated={isAuthenticated} />

      {/* ── Hero ── */}
      <section
        style={{
          backgroundColor: 'var(--color-dark)',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 32px 64px',
          textAlign: 'center',
          gap: '32px',
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <h1
            style={{
              color: 'var(--color-text-on-dark)',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '16px',
            }}
          >
            Shorten. Share. Track.
          </h1>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '18px', lineHeight: 1.6, marginBottom: '40px' }}>
            Turn long, ugly URLs into powerful short links you can manage and measure.
          </p>
          <HeroInput />
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '13px', marginTop: '12px' }}>
            No account needed to try it
          </p>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            width: '100%',
            maxWidth: '640px',
          }}
        >
          {STATS.map(({ number, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--color-text-on-dark)', fontSize: '28px', fontWeight: 700 }}>{number}</div>
              <div style={{ color: 'var(--color-text-muted-dark)', fontSize: '13px', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ backgroundColor: 'var(--color-white)', padding: '96px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '56px' }}>
            Everything you need to share smarter
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '32px',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'box-shadow 200ms ease, transform 200ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: 'var(--color-yellow-tint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  {icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ backgroundColor: 'var(--color-surface)', padding: '96px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 700, marginBottom: '56px' }}>
            Up and running in seconds
          </h2>
          <div style={{ display: 'flex', gap: '0', position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
            {STEPS.map(({ n, title, desc }, i) => (
              <div
                key={n}
                style={{
                  flex: '1 1 220px',
                  maxWidth: '280px',
                  textAlign: 'center',
                  padding: '0 24px',
                  borderRight: i < STEPS.length - 1 ? '2px dashed var(--color-border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    backgroundColor: 'var(--color-yellow)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 700,
                    margin: '0 auto 20px',
                  }}
                >
                  {n}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        style={{
          backgroundColor: 'var(--color-dark)',
          padding: '96px 32px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: 'var(--color-text-on-dark)', fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>
          Start shortening for free
        </h2>
        <p style={{ color: 'var(--color-text-muted-dark)', marginBottom: '32px', fontSize: '16px' }}>
          No credit card required. No account needed to try.
        </p>
        <a href="/register">
          <button
            className="btn btn--primary"
            style={{ height: '56px', padding: '0 40px', fontSize: '16px', fontWeight: 600 }}
          >
            Get Started Free
          </button>
        </a>
      </section>

      <Footer />
    </div>
  );
}
