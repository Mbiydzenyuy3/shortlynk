import { Link2, BarChart2, ShieldCheck, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroInput from '../components/HeroInput';
import Seo from '../components/Seo';
import { marketingRoutes } from '../seo/routes';

// Guarded: this module is also imported by the prerenderer, where there is
// no localStorage. Prerendered output is always the logged-out view, which
// the client corrects on hydration.
const isAuthenticated =
  typeof localStorage !== 'undefined' && !!localStorage.getItem('token');

const HOME = marketingRoutes.find(r => r.path === '/');

const LANDING_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Shortlynk',
    applicationCategory: 'WebApplication',
    operatingSystem: 'Any',
    url: 'https://shortlynk.store',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Shortlynk',
    url: 'https://shortlynk.store',
  },
];

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

const TRUST = [
  'No account needed to try',
  'Free — no credit card',
  'Spam-filtered links',
];

const STEPS = [
  { n: 1, title: 'Paste your URL', desc: 'Drop any long URL into the input field above.' },
  { n: 2, title: 'Click Shorten', desc: 'We generate a clean, compact link instantly.' },
  { n: 3, title: 'Share & Track', desc: "Copy it anywhere. Sign up to see who's clicking." },
];

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Seo
        title={HOME.title}
        description={HOME.description}
        canonical="/"
        jsonLd={LANDING_JSONLD}
      />
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
          textAlign: 'center',
          gap: '32px',
        }}
        className="responsive-section-pad"
      >
        <div style={{ maxWidth: '680px' }}>
          <h1
            style={{
              color: 'var(--color-text-on-dark)',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '20px',
            }}
          >
            Short links that tell you who clicked
          </h1>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '18px', lineHeight: 1.6, marginBottom: '36px' }}>
            Paste a long URL, get a short one instantly — then see every click by
            country, device and referrer. Free, and no account needed to start.
          </p>
          <HeroInput />
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '13px', marginTop: '12px' }}>
            No account needed to try it
          </p>
        </div>

        {/* Trust row */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '40px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            width: '100%',
            maxWidth: '640px',
          }}
        >
          {TRUST.map(label => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-text-muted-dark)',
                fontSize: '14px',
              }}
            >
              <Check size={16} color="var(--color-yellow)" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="responsive-section-pad" style={{ backgroundColor: 'var(--color-white)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 className="section-heading">Everything you need to share smarter</h2>
          <p className="section-subheading">
            Every link comes with analytics built in. No setup, no tracking code, no extra tools.
          </p>
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
      <section className="responsive-section-pad" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 className="section-heading">Up and running in seconds</h2>
          <p className="section-subheading">
            Three steps from a long URL to a short link you can measure.
          </p>
          <div style={{ display: 'flex', gap: '0', position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
            {STEPS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="step-card"
                style={{
                  flex: '1 1 220px',
                  maxWidth: '280px',
                  textAlign: 'center',
                  padding: '0 24px',
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
          textAlign: 'center',
        }}
        className="responsive-section-pad"
      >
        <h2
          style={{
            color: 'var(--color-text-on-dark)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '16px',
          }}
        >
          Start shortening for free
        </h2>
        <p
          style={{
            color: 'var(--color-text-muted-dark)',
            fontSize: '17px',
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: '0 auto 36px',
          }}
        >
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
