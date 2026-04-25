// ─── Profile.js ──────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const [uRes, dRes] = await Promise.all([
        api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/donations'),
      ]);
      setUser(uRes.data);
      const userEmail = uRes.data.email;
      const mine = (dRes.data || []).filter(d => d.donor?.email?.toLowerCase() === userEmail.toLowerCase())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDonations(mine);
    } catch (e) {
      if (e.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
      setError(e?.response?.data?.error || 'Failed to load profile.');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('userChanged', { detail: null }));
    navigate('/');
  };

  if (loading) return <div className="page-shell"><div className="gh-spinner" /></div>;
  if (error) return <div className="page-shell"><div className="gh-alert error">{error}</div></div>;
  if (!user) return null;

  const total = donations.reduce((s, d) => s + (d.amount || 0), 0);
  const avg   = donations.length ? (total / donations.length).toFixed(2) : 0;
  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="page-shell">
      {/* Profile hero */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div style={{ position: 'relative' }}>
          <h2 style={{ color: 'white', fontFamily: 'var(--font-display)', margin: '0 0 0.3rem', fontSize: '1.6rem' }}>{user.name}</h2>
          <p style={{ color: 'rgba(255,255,255,.55)', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{user.email}</p>
          <span style={{ fontSize: '0.75rem', background: 'var(--teal)', color: 'white', padding: '0.25rem 0.65rem', borderRadius: 100, fontWeight: 700 }}>✓ Active Member</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem', position: 'relative' }}>
          <button onClick={load} className="btn-ghost-gh" style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}>↺ Refresh</button>
          <button onClick={logout} style={{ background: 'rgba(244,63,94,.15)', border: '1.5px solid rgba(244,63,94,.3)', color: '#F43F5E', borderRadius: 'var(--radius-sm)', padding: '0.6rem 1.1rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Log Out</button>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Donated', val: `$${total.toFixed(2)}`, color: 'teal' },
          { label: 'Donations Made', val: donations.length, color: 'amber' },
          { label: 'Avg. Donation', val: `$${avg}`, color: 'ink' },
          { label: 'Member Since', val: new Date(user.createdAt).getFullYear(), color: 'coral' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className={`stat-val ${s.color}`}>{s.val}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
        <button onClick={() => navigate('/charities')} className="btn-primary-gh">Donate Now →</button>
      </div>

      {/* History */}
      <div className="gh-card" style={{ overflow: 'hidden' }}>
        <div style={{ background: 'var(--ink)', padding: '1.25rem 1.75rem' }}>
          <h3 style={{ color: 'white', fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.15rem' }}>Donation History</h3>
        </div>
        {donations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💌</span>
            <h4>No donations yet</h4>
            <p>Make your first donation today and start making a difference.</p>
            <button onClick={() => navigate('/charities')} className="btn-teal-gh" style={{ marginTop: '1rem' }}>Browse Charities →</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="gh-table">
              <thead>
                <tr>
                  <th>Date</th><th>Charity</th><th>Amount</th><th>Method</th><th>Status</th><th>Receipt</th><th></th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d._id}>
                    <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{d.charity?.name || 'Unknown'}</td>
                    <td style={{ color: 'var(--teal)', fontWeight: 700 }}>${d.amount?.toFixed(2)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{d.paymentMethod === 'stripe' ? 'Card' : d.paymentMethod}</td>
                    <td><span className={`gh-badge ${d.status}`}>{d.status}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{d.receiptNumber?.slice(0, 16) || '—'}</td>
                    <td>
                      <button onClick={() => navigate(`/receipt/${d._id}`, { state: { donation: d } })}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--teal)', fontWeight: 600 }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
