import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const SUGGESTED = [10, 25, 50, 100, 250, 500];
const MOCK_CHARITIES = [
  { _id:'1', name:'Red Cross', category:'humanitarian' },
  { _id:'2', name:'World Wildlife Fund', category:'environment' },
  { _id:'3', name:'UNICEF', category:'humanitarian' },
  { _id:'4', name:'Doctors Without Borders', category:'health' },
  { _id:'5', name:'The Nature Conservancy', category:'environment' },
  { _id:'6', name:'Save the Children', category:'education' },
];

export default function DonationForm() {
  const { charityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [charity, setCharity] = useState(null);
  const [charities, setCharities] = useState([]);
  const [selectedId, setSelectedId] = useState(charityId || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => {
  let name = '', email = '';
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    name  = u.name  || '';
    email = u.email || '';
  } catch {}
  return { amount: '', name, email, anonymous: false, message: '', payment: 'card' };
});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location?.state?.charity) {
      const c = location.state.charity;
      setCharity(c); setCharities([c]); setSelectedId(c._id || '');
      setLoading(false); return;
    }
    api.get('/charities')
      .then(r => {
        const data = r.data?.length ? r.data : MOCK_CHARITIES;
        setCharities(data);
        const found = data.find(c => c._id === charityId) || data[0];
        setCharity(found); setSelectedId(found?._id || '');
      })
      .catch(() => {
        setCharities(MOCK_CHARITIES);
        const found = MOCK_CHARITIES.find(c => c._id === charityId) || MOCK_CHARITIES[0];
        setCharity(found); setSelectedId(found?._id || '');
      })
      .finally(() => setLoading(false));
  }, [charityId, location]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.amount || parseFloat(form.amount) < 1) e.amount = 'Minimum donation is $1';
    if (!form.anonymous) {
      if (!form.name.trim()) e.name = 'Name is required';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    }
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const payMap = { card: 'stripe', paypal: 'paypal', bank: 'bank_transfer' };
    try {
      const res = await api.post('/donations', {
        charityId: charity?._id || charityId,
        amount: parseFloat(form.amount),
        donor: { name: form.name, email: form.email, anonymous: form.anonymous },
        paymentMethod: payMap[form.payment],
        message: form.message,
      });
      const saved = res.data?.donation || res.data;
      navigate(`/receipt/${saved._id}`, { state: { donation: saved } });
    } catch (err) {
      alert(`Error: ${err?.response?.data?.error || err.message}`);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="page-shell"><div className="gh-spinner" /></div>;

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="section-eyebrow">Secure donation</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--ink)', margin: '0 0 0.5rem' }}>
            Donate to {charity?.name || 'a charity'}
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>100% of your donation goes to the cause — no fees.</p>
        </div>

        <div className="gh-card" style={{ padding: '2.5rem' }}>
          {/* Charity selector */}
          {charities.length > 1 && (
            <div style={{ marginBottom: '2rem' }}>
              <label className="gh-label">Choose Charity</label>
              <select className="gh-select" value={selectedId} onChange={e => {
                setSelectedId(e.target.value);
                const sel = charities.find(c => c._id === e.target.value);
                if (sel) setCharity(sel);
              }}>
                {charities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Amount */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="gh-label">Donation Amount</label>
            <div className="amount-grid">
              {SUGGESTED.map(a => (
                <button key={a} type="button" className={`amount-chip ${form.amount === String(a) ? 'selected' : ''}`}
                  onClick={() => set('amount', String(a))}>${a}</button>
              ))}
            </div>
            <input className={`gh-input ${errors.amount ? 'border-red-500' : ''}`} type="number" min="1" step="0.01"
              placeholder="Custom amount (USD)" value={form.amount}
              onChange={e => set('amount', e.target.value)} />
            {errors.amount && <p style={{ color: 'var(--coral)', fontSize: '0.82rem', marginTop: '0.4rem' }}>{errors.amount}</p>}
          </div>

          <div className="divider" />

          {/* Donor info */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="gh-label" style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>Your Information</label>

            {!form.anonymous && (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="gh-label">Full Name</label>
                  <input className="gh-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} />
                  {errors.name && <p style={{ color: 'var(--coral)', fontSize: '0.82rem', marginTop: '0.4rem' }}>{errors.name}</p>}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="gh-label">Email Address</label>
                  <input className="gh-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <p style={{ color: 'var(--coral)', fontSize: '0.82rem', marginTop: '0.4rem' }}>{errors.email}</p>}
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.4rem' }}>Your receipt will be sent here.</p>
                </div>
              </>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--ink-mid)', fontWeight: 500 }}>
              <input type="checkbox" checked={form.anonymous} onChange={e => set('anonymous', e.target.checked)} style={{ width: 16, height: 16 }} />
              Donate anonymously
            </label>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="gh-label">Message (optional)</label>
            <textarea className="gh-input" rows={3} placeholder="Add a personal message for the charity…" value={form.message} onChange={e => set('message', e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div className="divider" />

          {/* Payment */}
          <div style={{ marginBottom: '2rem' }}>
            <label className="gh-label" style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>Payment Method</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[{ id: 'card', icon: '💳', label: 'Credit / Debit Card' }, { id: 'paypal', icon: '💰', label: 'PayPal' }, { id: 'bank', icon: '🏦', label: 'Bank Transfer' }].map(p => (
                <div key={p.id} className={`pay-option ${form.payment === p.id ? 'selected' : ''}`} onClick={() => set('payment', p.id)}>
                  <span>{p.icon}</span>
                  <span style={{ fontWeight: 600 }}>{p.label}</span>
                  {form.payment === p.id && <span style={{ marginLeft: 'auto', color: 'var(--amber-dark)', fontSize: '0.85rem', fontWeight: 700 }}>✓ Selected</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="summary-box">
            <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,.5)', marginBottom: '0.75rem' }}>Donation Summary</p>
            <div className="summary-row"><span>Charity</span><span style={{ color: 'white', fontWeight: 600 }}>{charity?.name || '—'}</span></div>
            <div className="summary-row"><span>Amount</span><span style={{ color: 'white', fontWeight: 600 }}>{form.amount ? `$${form.amount}` : '—'}</span></div>
            <div className="summary-row"><span>Platform Fee</span><span style={{ color: 'var(--teal-pale)', fontWeight: 600 }}>Free</span></div>
            <div className="summary-row total"><span>Total</span><span>${form.amount || '0.00'}</span></div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary-gh"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem', fontSize: '1rem', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Processing…' : `Donate $${form.amount || '0'} to ${charity?.name || 'Charity'}`}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem', marginTop: '1rem' }}>
            🔒 Secure & encrypted · Tax-deductible receipt issued immediately
          </p>
        </div>
      </div>
    </div>
  );
}
