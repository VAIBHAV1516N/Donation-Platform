/**
 * Dashboard.js — My Donations Dashboard
 * BUG FIXES:
 * 1. Passes Authorization header to all API calls
 * 2. Shows all donations (not just "completed")
 * 3. Handles empty state gracefully with clear message
 * 4. Error messages now show actual API error
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import api from '../services/api';

const T = {
  bg:'#0B0F1A', surface:'#111827', card:'#161D2F', border:'#1F2B47',
  text:'#E2E8F0', muted:'#6B7FA3',
  lime:'#A3E635', limeDim:'#4D7C0F',
  amb:'#F59E0B', coral:'#F87171', teal:'#2DD4BF', vio:'#A78BFA', sky:'#38BDF8',
};

const CAT_COLORS = {
  humanitarian: T.coral,
  health:       T.sky,
  education:    T.vio,
  environment:  T.teal,
  animal_welfare: T.amb,
  other:        T.muted,
};

const CAT_LABELS = {
  humanitarian: 'Humanitarian', health: 'Health', education: 'Education',
  environment: 'Environment', animal_welfare: 'Animal Welfare', other: 'Other',
};

const fmt      = n => typeof n === 'number' ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$—';
const fmtShort = n => typeof n === 'number' ? (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`) : '$—';
const fmtMonth = m => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(+y, +mo - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
      padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: 6,
      borderTop: `3px solid ${accent || T.lime}`,
    }}>
      <span style={{ fontSize: 10, fontFamily: 'var(--db-mono)', letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'var(--db-display)', fontSize: '2rem', fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: T.muted, fontFamily: 'var(--db-mono)' }}>{sub}</span>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, style }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', ...style }}>
      <div>
        <h3 style={{ margin: 0, fontFamily: 'var(--db-display)', fontSize: '1.05rem', color: T.text, fontWeight: 600 }}>{title}</h3>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted, fontFamily: 'var(--db-mono)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '0.75rem 1rem' }}>
      {label && <p style={{ fontFamily: 'var(--db-mono)', fontSize: 10, color: T.muted, margin: '0 0 6px', textTransform: 'uppercase' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', fontFamily: 'var(--db-display)', fontSize: '1rem', fontWeight: 700, color: p.color || T.lime }}>
          {p.name === 'totalAmount' ? fmt(p.value) : p.value}
          {p.name === 'count' ? ' donations' : ''}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '0.75rem 1rem' }}>
      <p style={{ margin: '0 0 4px', fontFamily: 'var(--db-mono)', fontSize: 10, color: T.muted, textTransform: 'uppercase' }}>{CAT_LABELS[d.name] || d.name}</p>
      <p style={{ margin: 0, fontFamily: 'var(--db-display)', fontSize: '1rem', fontWeight: 700, color: d.payload.color }}>{fmt(d.value)}</p>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: T.muted, fontFamily: 'var(--db-mono)' }}>{d.payload.count} donation{d.payload.count !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary,    setSummary]    = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byCharity,  setByCharity]  = useState([]);
  const [timeline,   setTimeline]   = useState([]);
  const [recent,     setRecent]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [timeRange,  setTimeRange]  = useState(12);
  const [user,       setUser]       = useState(null);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('user') || '{}')); } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    setLoading(true); setError('');
    try {
      // BUG FIX: Always pass Authorization header
      const headers = { Authorization: `Bearer ${token}` };

      const [s, bc, bch, tl, rec] = await Promise.all([
        api.get('/dashboard/summary',     { headers }),
        api.get('/dashboard/by-category', { headers }),
        api.get('/dashboard/by-charity',  { headers }),
        api.get(`/dashboard/timeline?months=${timeRange}`, { headers }),
        api.get('/dashboard/recent?limit=6', { headers }),
      ]);

      setSummary(s.data);
      setByCategory(bc.data);
      setByCharity(bch.data);
      setTimeline(tl.data);
      setRecent(rec.data);
    } catch (e) {
      if (e.response?.status === 401) { navigate('/login'); return; }
      setError(e?.response?.data?.error || e.message || 'Failed to load dashboard. Make sure you are logged in.');
    } finally { setLoading(false); }
  }, [navigate, timeRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pieData = byCategory.map(d => ({
    name: d.category, value: d.totalAmount, count: d.count,
    color: CAT_COLORS[d.category] || T.muted,
  }));

  const hasTimeline = timeline.some(t => t.totalAmount > 0);
  const hasData     = summary?.donationCount > 0;

  if (loading) return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div>
        <div style={{ width: 40, height: 40, border: `3px solid ${T.border}`, borderTopColor: T.lime, borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: T.muted, fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.1em', textAlign: 'center' }}>LOADING DATA…</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        :root { --db-display:'Bebas Neue',sans-serif; --db-body:'Syne',sans-serif; --db-mono:'JetBrains Mono',monospace; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .db-f { animation: fadeUp .4s ease both; }
        .recharts-cartesian-axis-tick-value { fill: #6B7FA3 !important; font-family: 'JetBrains Mono' !important; font-size: 10px !important; }
        .time-btn { background:none; border:1px solid ${T.border}; color:${T.muted}; border-radius:8px; padding:5px 12px; cursor:pointer; font-family:'JetBrains Mono'; font-size:10px; letter-spacing:.08em; transition:all .18s; }
        .time-btn:hover { border-color:${T.lime}; color:${T.lime}; }
        .time-btn.active { background:${T.limeDim}; border-color:${T.lime}; color:${T.lime}; font-weight:600; }
        .rec-row:hover { background: ${T.border} !important; }
      `}</style>

      {/* Header */}
      <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '1.1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, background: T.lime, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>♥</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--db-display)', fontSize: '1.5rem', color: T.text, letterSpacing: '.02em', lineHeight: 1 }}>DONATION DASHBOARD</h1>
            <p style={{ margin: 0, fontSize: 10, color: T.muted, fontFamily: 'var(--db-mono)', letterSpacing: '.1em' }}>
              {user?.name || 'YOUR IMPACT'} · {user?.email || ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchAll} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'var(--db-mono)', fontSize: 10, letterSpacing: '.08em', transition: 'all .18s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.lime; e.currentTarget.style.color = T.lime; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
            ↺ REFRESH
          </button>
          <button onClick={() => navigate('/charities')} style={{ background: T.lime, border: 'none', color: T.bg, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontFamily: 'var(--db-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '.08em' }}>
            + DONATE
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>

        {/* Error */}
        {error && (
          <div style={{ background: '#2D0A0A', border: '1px solid #7F1D1D', borderRadius: 12, padding: '1rem 1.25rem', color: T.coral, fontFamily: 'var(--db-mono)', fontSize: 12, marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* Empty state — no donations at all */}
        {!error && !loading && !hasData && (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
            <h2 style={{ fontFamily: 'var(--db-display)', color: T.text, fontSize: '1.8rem', marginBottom: '0.75rem' }}>NO DONATIONS YET</h2>
            <p style={{ color: T.muted, fontFamily: 'var(--db-mono)', fontSize: 12, marginBottom: '1.5rem', letterSpacing: '.05em' }}>
              Make your first donation to see your impact here
            </p>
            <button onClick={() => navigate('/charities')} style={{ background: T.lime, border: 'none', color: T.bg, borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontFamily: 'var(--db-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '.08em' }}>
              BROWSE CHARITIES →
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="db-f" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total Donated"       value={fmt(summary?.totalAmount)}     sub={`${summary?.donationCount || 0} donations`}        accent={T.lime}  />
          <StatCard label="Largest Gift"         value={fmt(summary?.largestDonation)} sub="single donation"                                   accent={T.amb}   />
          <StatCard label="Avg. Donation"        value={fmt(summary?.avgDonation)}     sub="per transaction"                                   accent={T.sky}   />
          <StatCard label="Charities Supported"  value={summary?.uniqueCharities || 0} sub="unique organisations"                              accent={T.teal}  />
          <StatCard label="Since"                value={summary?.firstDonation ? new Date(summary.firstDonation).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'} sub="first donation" accent={T.vio} />
        </div>

        {hasData && (
          <>
            {/* Pie + Bar */}
            <div className="db-f" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem', marginBottom: '1rem' }}>

              {/* Pie */}
              <ChartCard title="BY CATEGORY" subtitle="Share of total donated">
                {pieData.length === 0
                  ? <div style={{ textAlign: 'center', padding: '3rem 0', color: T.muted, fontFamily: 'var(--db-mono)', fontSize: 11 }}>No data</div>
                  : (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none">
                            {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend formatter={val => CAT_LABELS[val] || val} iconType="circle" iconSize={8}
                            wrapperStyle={{ fontFamily: 'var(--db-mono)', fontSize: 10, color: T.muted }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {pieData.map(d => (
                          <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.muted, fontFamily: 'var(--db-mono)' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                            {fmtShort(d.value)}
                          </span>
                        ))}
                      </div>
                    </>
                  )
                }
              </ChartCard>

              {/* Bar */}
              <ChartCard title="BY CHARITY" subtitle="Top 10 charities by total donated">
                {byCharity.length === 0
                  ? <div style={{ textAlign: 'center', padding: '3rem 0', color: T.muted, fontFamily: 'var(--db-mono)', fontSize: 11 }}>No data</div>
                  : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={byCharity} layout="vertical" margin={{ left: 0, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                        <XAxis type="number" tickFormatter={v => fmtShort(v)} tick={{ fill: T.muted, fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="charityName" width={130}
                          tick={{ fill: T.muted, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          tickFormatter={v => v.length > 17 ? v.slice(0, 16) + '…' : v}
                          axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
                        <Bar dataKey="totalAmount" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {byCharity.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.category] || T.lime} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )
                }
              </ChartCard>
            </div>

            {/* Timeline */}
            <div className="db-f" style={{ marginBottom: '1rem' }}>
              <ChartCard title="DONATION TIMELINE" subtitle="Monthly giving history" style={{ gap: '1rem' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[6, 12, 24].map(m => (
                    <button key={m} className={`time-btn ${timeRange === m ? 'active' : ''}`} onClick={() => setTimeRange(m)}>{m}M</button>
                  ))}
                </div>
                {!hasTimeline
                  ? <div style={{ textAlign: 'center', padding: '3rem 0', color: T.muted, fontFamily: 'var(--db-mono)', fontSize: 11 }}>No donations in this period</div>
                  : (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 8 }}>
                          <defs>
                            <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={T.lime} stopOpacity={0.22} />
                              <stop offset="95%" stopColor={T.lime} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                          <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fill: T.muted, fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => fmtShort(v)} tick={{ fill: T.muted, fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={52} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: T.border, strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="totalAmount" stroke={T.lime} strokeWidth={2.5} fill="url(#limeGrad)" dot={false}
                            activeDot={{ r: 5, fill: T.lime, stroke: T.bg, strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: 4 }}>
                        {timeline.filter(t => t.totalAmount > 0).slice(-6).map(t => (
                          <div key={t.month} style={{ flexShrink: 0, background: T.border, borderRadius: 8, padding: '0.45rem 0.8rem', minWidth: 76, textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--db-mono)', fontSize: 9, color: T.muted, marginBottom: 2 }}>{fmtMonth(t.month)}</div>
                            <div style={{ fontFamily: 'var(--db-display)', fontSize: '0.95rem', color: T.lime }}>{fmtShort(t.totalAmount)}</div>
                            <div style={{ fontFamily: 'var(--db-mono)', fontSize: 8, color: T.muted }}>{t.count} gift{t.count !== 1 ? 's' : ''}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                }
              </ChartCard>
            </div>

            {/* Category table + Recent */}
            <div className="db-f" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem' }}>

              {/* Category breakdown */}
              <ChartCard title="CATEGORY BREAKDOWN" subtitle="Full breakdown by cause">
                {byCategory.length === 0
                  ? <div style={{ color: T.muted, fontFamily: 'var(--db-mono)', fontSize: 11, padding: '2rem 0', textAlign: 'center' }}>No data</div>
                  : byCategory.map(d => {
                    const pct = summary?.totalAmount ? ((d.totalAmount / summary.totalAmount) * 100).toFixed(1) : 0;
                    const col = CAT_COLORS[d.category] || T.muted;
                    return (
                      <div key={d.category} style={{ padding: '0.8rem 0', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text, fontWeight: 500 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0 }} />
                            {CAT_LABELS[d.category] || d.category}
                          </span>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontFamily: 'var(--db-display)', fontSize: '0.95rem', color: col }}>{fmt(d.totalAmount)}</span>
                            <span style={{ fontFamily: 'var(--db-mono)', fontSize: 9, color: T.muted, display: 'block' }}>{d.count} donation{d.count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div style={{ height: 3, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontFamily: 'var(--db-mono)', fontSize: 9, color: T.muted, textAlign: 'right', marginTop: 2 }}>{pct}%</div>
                      </div>
                    );
                  })
                }
              </ChartCard>

              {/* Recent donations */}
              <ChartCard title="RECENT DONATIONS" subtitle="Your last 6 donations">
                {recent.length === 0
                  ? <div style={{ color: T.muted, fontFamily: 'var(--db-mono)', fontSize: 11, padding: '2rem 0', textAlign: 'center' }}>No recent donations</div>
                  : recent.map(d => {
                    const catColor = CAT_COLORS[d.charity?.category] || T.muted;
                    const emoji = d.charity?.category === 'health' ? '🏥' : d.charity?.category === 'education' ? '📚' : d.charity?.category === 'environment' ? '🌿' : d.charity?.category === 'animal_welfare' ? '🐾' : '❤️';
                    return (
                      <div key={d._id} className="rec-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '0.85rem 0.5rem', borderRadius: 10, cursor: 'default', transition: 'background .15s', borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${catColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{emoji}</div>
                          <div>
                            <div style={{ fontFamily: 'var(--db-body)', fontSize: 12, fontWeight: 600, color: T.text }}>
                              {d.charity?.name || 'Unknown Charity'}
                            </div>
                            <div style={{ fontFamily: 'var(--db-mono)', fontSize: 9, color: T.muted, marginTop: 2 }}>
                              {new Date(d.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' · '}<span style={{ color: catColor }}>{CAT_LABELS[d.charity?.category] || 'Other'}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--db-display)', fontSize: '1.15rem', color: T.lime }}>{fmt(d.amount)}</div>
                          <div style={{ fontFamily: 'var(--db-mono)', fontSize: 8, color: T.muted }}>
                            <span className={`gh-badge ${d.status}`} style={{ fontSize: 8, padding: '1px 5px' }}>{d.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
                <button onClick={() => navigate('/profile')} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: 10, width: '100%', cursor: 'pointer', fontFamily: 'var(--db-mono)', fontSize: 10, letterSpacing: '.08em', marginTop: '0.5rem', transition: 'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.lime; e.currentTarget.style.color = T.lime; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
                  VIEW FULL HISTORY →
                </button>
              </ChartCard>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', paddingTop: '1.5rem', marginTop: '1rem', borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontFamily: 'var(--db-mono)', fontSize: 10, color: T.muted, letterSpacing: '.08em', margin: 0 }}>
            GIVEHUB DONATION DASHBOARD · {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  );
}
