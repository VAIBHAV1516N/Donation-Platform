import React, { useState } from 'react';
import api from '../services/api';

const CATEGORIES = [
  { val: 'education', label: '📚 Education' },
  { val: 'health', label: '🏥 Health & Medical' },
  { val: 'environment', label: '🌿 Environment' },
  { val: 'animal_welfare', label: '🐾 Animal Welfare' },
  { val: 'humanitarian', label: '❤️ Humanitarian Aid' },
  { val: 'other', label: '⭐ Other' },
];

export default function ContactUs() {
  const [form, setForm] = useState({ charityName: '', description: '', category: 'education', website: '', contactEmail: '', contactName: '', reason: 'add_charity' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/charities/request', form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-shell">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem', alignItems: 'start', maxWidth: 960, margin: '0 auto' }}>
        {/* Left */}
        <div>
          <span className="section-eyebrow">Partner with us</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--ink)', margin: '0 0 1rem', lineHeight: 1.15 }}>
            List your charity on GiveHub
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '1rem', marginBottom: '2.5rem' }}>
            Is your organisation not listed? Submit your details below and our team will review within 2–3 business days. We verify all charities to ensure full transparency.
          </p>

          {submitted && (
            <div className="gh-alert success" style={{ marginBottom: '2rem' }}>
              <span>✓</span>
              <div>
                <strong>Submission received!</strong><br />
                <span>We'll review your request and contact you within 2–3 business days.</span>
              </div>
            </div>
          )}

          {error && <div className="gh-alert error" style={{ marginBottom: '1.5rem' }}>⚠ {error}</div>}

          <div className="gh-card" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '1.25rem', borderBottom: '2px solid var(--amber)', paddingBottom: '0.6rem' }}>Your Information</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="gh-label">Contact Name *</label>
                  <input className="gh-input" placeholder="Full name" value={form.contactName} onChange={e => set('contactName', e.target.value)} required />
                </div>
                <div>
                  <label className="gh-label">Email Address *</label>
                  <input className="gh-input" type="email" placeholder="you@example.com" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} required />
                </div>
              </div>

              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', margin: '1.5rem 0 1.25rem', borderBottom: '2px solid var(--teal)', paddingBottom: '0.6rem' }}>Charity Information</p>

              <div style={{ marginBottom: '1rem' }}>
                <label className="gh-label">Charity Name *</label>
                <input className="gh-input" placeholder="Official name" value={form.charityName} onChange={e => set('charityName', e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="gh-label">Category *</label>
                  <select className="gh-select" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="gh-label">Website (optional)</label>
                  <input className="gh-input" type="url" placeholder="https://…" value={form.website} onChange={e => set('website', e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label className="gh-label">Description * <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(min. 50 characters)</span></label>
                <textarea className="gh-input" rows={4} placeholder="Tell us about your mission, impact, and why you should be listed…" value={form.description} onChange={e => set('description', e.target.value)} required style={{ resize: 'vertical' }} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary-gh" style={{ width: '100%', justifyContent: 'center', padding: '1rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting…' : 'Submit Charity →'}
              </button>
            </form>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ position: 'sticky', top: 100 }}>
          <div className="gh-card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', fontSize: '1.1rem', marginBottom: '1.25rem' }}>What we verify</h4>
            {['Official registration & legal status', 'Mission alignment with our platform values', 'Transparency in financial reporting', 'Contact info & operational legitimacy'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.85rem', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--teal)', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--ink)', borderRadius: 'var(--radius-md)', padding: '1.75rem', color: 'white' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', marginBottom: '0.75rem' }}>Review Timeline</h4>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              Submissions are reviewed within <strong style={{ color: 'var(--amber)' }}>2–3 business days</strong>. You'll receive an email update at the address provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
