import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  });

  useEffect(() => {
    const onStorage = () => {
      try { const raw = localStorage.getItem('user'); setUser(raw ? JSON.parse(raw) : null); }
      catch { setUser(null); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const features = [
    { icon: '🔒', bg: '#E0E7FF', label: 'Secure Payments', desc: 'End-to-end encrypted transactions with multiple trusted payment methods.' },
    { icon: '📄', bg: '#D1FAE5', label: 'Instant Receipts', desc: 'Tax-deductible receipts delivered to your inbox within seconds.' },
    { icon: '✅', bg: '#FEF3C7', label: 'Verified Charities', desc: 'Every organisation is thoroughly vetted before listing on our platform.' },
    { icon: '🌍', bg: '#FCE7F3', label: 'Global Reach', desc: 'Support causes across the world and track your collective impact.' },
  ];

  const steps = [
    { n: '1', title: 'Pick a cause', desc: 'Browse our curated list of verified charities across 6 categories.' },
    { n: '2', title: 'Choose an amount', desc: 'Select a preset amount or enter a custom value — every dollar matters.' },
    { n: '3', title: 'Pay securely', desc: 'Complete your donation using card, PayPal, or bank transfer.' },
    { n: '4', title: 'Get your receipt', desc: 'Download or print your tax-deductible receipt immediately.' },
  ];

  return (
    <div className="page-shell">

      {/* Hero */}
      <section className="hero-wrap">
        <div className="hero-label">
          <span>♥</span> Trusted by 10,000+ donors worldwide
        </div>

        {user && (
          <p style={{ color: 'var(--amber)', fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>
            Welcome back, {user.name?.split(' ')[0]}!
          </p>
        )}

        <h1>
          Give more.<br />
          <span className="accent">Change lives.</span>
        </h1>
        <p>
          Support verified charities with transparent, fee-free donations.
          Every contribution — big or small — creates real, lasting impact.
        </p>

        <div className="hero-actions">
          <Link to="/charities" className="btn-primary-gh">Browse Charities →</Link>
          {!user ? (
            <Link to="/register" className="btn-ghost-gh">Create Account</Link>
          ) : (
            <Link to="/profile" className="btn-ghost-gh">My Donations</Link>
          )}
        </div>

        <div className="hero-stat-row">
          {[
            { num: '$500K+', label: 'Total Donated' },
            { num: '50+', label: 'Charities' },
            { num: '10K+', label: 'Active Donors' },
            { num: '100%', label: 'Fee Free' },
          ].map(s => (
            <div key={s.label}>
              <span className="hero-stat-num">{s.num}</span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <div style={{ marginBottom: '1.75rem' }}>
          <span className="section-eyebrow">Why GiveHub</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--ink)', margin: 0 }}>
            Built for trust and transparency
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
          {features.map(f => (
            <div key={f.label} className="feature-block">
              <div className="feature-icon-box" style={{ background: f.bg }}>{f.icon}</div>
              <h5>{f.label}</h5>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section">
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="section-eyebrow" style={{ color: 'var(--amber)' }}>Simple process</span>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.9rem' }}>How to donate in 4 steps</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
          {steps.map(s => (
            <div key={s.n} className="step-block">
              <div className="step-pill">{s.n}</div>
              <h5>{s.title}</h5>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <h2>Your charity not listed?</h2>
        <p>Submit your organisation for review. We verify all charities to ensure full transparency and legitimacy.</p>
        <Link to="/contact-us" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: 'var(--teal-dark)', padding: '0.9rem 2rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem', transition: 'all .2s' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--teal-pale)'}
          onMouseOut={e => e.currentTarget.style.background = 'white'}>
          Submit a Charity →
        </Link>
      </section>
    </div>
  );
}

export default Home;
