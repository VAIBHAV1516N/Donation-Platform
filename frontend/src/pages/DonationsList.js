import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function DonationsList() {
  const [donations, setDonations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/donations');
      const data = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDonations(data); setFiltered(data); setLastRefresh(new Date());
    } catch (e) { setError(e?.response?.data?.error || 'Failed to fetch donations.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); const t = setInterval(fetch, 15000); return () => clearInterval(t); }, [fetch]);

  useEffect(() => {
    const q = query.toLowerCase();
    if (!q) { setFiltered(donations); return; }
    setFiltered(donations.filter(d => d.donor?.email?.toLowerCase().includes(q) || d.donor?.name?.toLowerCase().includes(q)));
  }, [query, donations]);

  const total = donations.reduce((s, d) => s + (d.amount || 0), 0);
  const avg   = donations.length ? (total / donations.length).toFixed(2) : 0;
  const anon  = donations.filter(d => d.donor?.anonymous).length;

  if (loading) return <div className="page-shell"><div className="gh-spinner" /></div>;

  return (
    <div className="page-shell">
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="section-eyebrow">Live feed</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--ink)', margin: '0 0 0.5rem' }}>All Donations</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Showing community donations in real-time · Last updated {lastRefresh?.toLocaleTimeString() || '—'}
        </p>
      </div>

      {error && <div className="gh-alert error">{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Donations', val: donations.length, color: 'amber' },
          { label: 'Total Amount', val: `$${total.toFixed(2)}`, color: 'teal' },
          { label: 'Avg. Donation', val: `$${avg}`, color: 'ink' },
          { label: 'Anonymous', val: anon, color: 'coral' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className={`stat-val ${s.color}`}>{s.val}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div style={{ flex: 2, minWidth: 240 }}>
          <label className="gh-label">Search by name or email</label>
          <input className="gh-input" placeholder="Donor name or email…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '0.6rem' }}>
          {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.7rem 1rem', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.88rem' }}>Clear</button>}
          <button onClick={fetch} className="btn-primary-gh" style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem' }}>↺ Refresh</button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h4>{query ? 'No matching donations' : 'No donations yet'}</h4>
          <p>{query ? 'Try a different search term.' : 'Donations will appear here in real-time.'}</p>
        </div>
      ) : (
        <div className="gh-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="gh-table">
              <thead>
                <tr>
                  <th>Donor</th><th>Email</th><th>Amount</th><th>Charity</th><th>Method</th><th>Status</th><th>Receipt</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.donor?.anonymous ? <em style={{ color: 'var(--muted)' }}>🔒 Anonymous</em> : (d.donor?.name || 'Unknown')}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{d.donor?.anonymous ? '—' : (d.donor?.email || '—')}</td>
                    <td style={{ color: 'var(--teal)', fontWeight: 700 }}>${d.amount?.toFixed(2)}</td>
                    <td>{d.charity?.name || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{d.paymentMethod === 'stripe' ? 'Card' : d.paymentMethod}</td>
                    <td><span className={`gh-badge ${d.status}`}>{d.status}</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.receiptNumber || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
