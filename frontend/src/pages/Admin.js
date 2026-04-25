import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('charities');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const LIMIT = 10;

  const fetchCharities = useCallback((pg = 1, query = '', st = '') => {
    if (!token) return;
    const params = { page: pg, limit: LIMIT };
    if (query) params.q = query;
    if (st) params.status = st;
    api.get('/admin/charities', { headers, params })
      .then(r => { setCharities(r.data.data || []); setTotal(r.data.total || 0); setPage(r.data.page || pg); })
      .catch(e => setError(e?.response?.data?.error || e.message));
  }, [token]);

  useEffect(() => {
    if (!token) { setError('Not authenticated'); return; }
    api.get('/admin/summary', { headers }).then(r => setSummary(r.data)).catch(e => setError(e?.response?.data?.error || e.message));
    api.get('/admin/users', { headers }).then(r => setUsers(r.data)).catch(e => setError(e?.response?.data?.error || e.message));
    fetchCharities(1, q, status);
  }, []);

  const deleteUser = async (id) => {
    try { await api.delete(`/admin/users/${id}`, { headers }); setUsers(u => u.filter(x => x._id !== id)); }
    catch (e) { setError(e?.response?.data?.error || e.message); }
  };

  const verify = async (id, st) => {
    try {
      const r = await api.put(`/admin/charities/${id}/verify`, { status: st }, { headers });
      setCharities(list => list.map(c => c._id === id ? r.data : c));
    } catch (e) { setError(e?.response?.data?.error || e.message); }
  };

  if (error) return <div className="page-shell"><div className="gh-alert error">⚠ {error}</div></div>;

  const tabs = ['charities', 'users'];

  return (
    <div className="page-shell">
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="section-eyebrow">Administration</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--ink)', margin: 0 }}>Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Users', val: summary?.usersCount ?? '—', color: 'amber' },
          { label: 'Charities', val: summary?.charitiesCount ?? '—', color: 'teal' },
          { label: 'Donations', val: summary?.donationsCount ?? '—', color: 'ink' },
          { label: 'Total Donated', val: summary ? `$${summary.totalDonated?.toFixed(2)}` : '—', color: 'coral' },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div className="accent-bar" style={{ background: s.color === 'amber' ? 'var(--amber)' : s.color === 'teal' ? 'var(--teal)' : s.color === 'coral' ? 'var(--coral)' : 'var(--ink)' }} />
            <span className={`stat-val ${s.color}`} style={{ fontSize: '2rem' }}>{s.val}</span>
            <span className="stat-label" style={{ marginTop: '0.3rem', display: 'block' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.92rem', color: activeTab === t ? 'var(--amber-dark)' : 'var(--muted)', borderBottom: activeTab === t ? '3px solid var(--amber)' : '3px solid transparent', marginBottom: -2, textTransform: 'capitalize', transition: 'color .15s' }}>
            {t === 'charities' ? `Charities (${total})` : `Users (${users.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'charities' && (
        <div>
          {/* Search */}
          <div className="filter-bar">
            <div style={{ flex: 2, minWidth: 240 }}>
              <label className="gh-label">Search</label>
              <input className="gh-input" placeholder="Name, description, submitter…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="gh-label">Status</label>
              <select className="gh-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={() => fetchCharities(1, q, status)} className="btn-primary-gh" style={{ padding: '0.7rem 1.25rem', fontSize: '0.88rem' }}>Search</button>
            </div>
          </div>

          <div className="gh-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="gh-table">
                <thead>
                  <tr><th>Name</th><th>Category</th><th>Submitted By</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {charities.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{c.category?.replace('_', ' ')}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{c.submittedBy?.name || c.submittedBy?.email || '—'}</td>
                      <td><span className={`gh-badge ${c.verificationStatus}`}>{c.verificationStatus}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button onClick={() => verify(c._id, 'verified')} style={btnStyle('#D1FAE5', '#065F46')}>Verify</button>
                          <button onClick={() => verify(c._id, 'pending')} style={btnStyle('#FEF3C7', '#92400E')}>Pending</button>
                          <button onClick={() => verify(c._id, 'rejected')} style={btnStyle('#FEE2E2', '#991B1B')}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Page {page} · {total} results</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => fetchCharities(page - 1, q, status)} disabled={page <= 1} style={pgBtn}>← Previous</button>
              <button onClick={() => fetchCharities(page + 1, q, status)} disabled={page * LIMIT >= total} style={pgBtn}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="gh-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="gh-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Admin</th><th>Joined</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{u.email}</td>
                    <td>{u.isAdmin ? <span className="gh-badge verified">Admin</span> : <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>—</span>}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {!u.isAdmin && (
                        <button onClick={() => deleteUser(u._id)} style={btnStyle('#FEE2E2', '#991B1B')}>Delete</button>
                      )}
                    </td>
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

const btnStyle = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 6, padding: '0.35rem 0.7rem',
  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
});

const pgBtn = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--ink-mid)',
  fontFamily: 'var(--font-body)', fontWeight: 500,
};
