import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CATEGORY_META = {
  humanitarian: { icon: '❤️', label: 'Humanitarian', tagClass: 'tag-humanitarian', iconBg: 'cat-humanitarian' },
  health:        { icon: '🏥', label: 'Health',        tagClass: 'tag-health',       iconBg: 'cat-health' },
  education:     { icon: '📚', label: 'Education',     tagClass: 'tag-education',    iconBg: 'cat-education' },
  environment:   { icon: '🌿', label: 'Environment',   tagClass: 'tag-environment',  iconBg: 'cat-environment' },
  animal_welfare:{ icon: '🐾', label: 'Animal Welfare',tagClass: 'tag-animal_welfare',iconBg: 'cat-animal' },
  other:         { icon: '⭐', label: 'Other',          tagClass: 'tag-other',        iconBg: 'cat-other' },
};

const MOCK = [
  { _id:'1', name:'Red Cross', description:'Providing emergency assistance, disaster relief, and education internationally.', category:'humanitarian', totalDonations:50000, donationCount:250 },
  { _id:'2', name:'World Wildlife Fund', description:'Conserving nature and reducing the most pressing threats to biodiversity.', category:'environment', totalDonations:75000, donationCount:300 },
  { _id:'3', name:'UNICEF', description:'Working for the rights of every child, every day, across the globe.', category:'humanitarian', totalDonations:100000, donationCount:500 },
  { _id:'4', name:'Doctors Without Borders', description:"Providing medical aid where it's needed most, independent of governments.", category:'health', totalDonations:60000, donationCount:200 },
  { _id:'5', name:'The Nature Conservancy', description:'Conserving the lands and waters on which all life depends.', category:'environment', totalDonations:45000, donationCount:180 },
  { _id:'6', name:'Save the Children', description:'Giving children a healthy start, education, and protection from harm.', category:'education', totalDonations:55000, donationCount:220 },
];

export default function CharityList() {
  const [all, setAll] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    axios.get('/api/charities')
      .then(r => { const data = r.data?.length ? r.data : MOCK; setAll(data); setFiltered(data); })
      .catch(() => { setAll(MOCK); setFiltered(MOCK); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let f = all;
    if (search) f = f.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'all') f = f.filter(c => c.category === category);
    setFiltered(f);
  }, [search, category, all]);

  if (loading) return <div className="page-shell"><div className="gh-spinner" /></div>;

  return (
    <div className="page-shell">
      {/* Heading */}
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="section-eyebrow">Make an impact</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--ink)', margin: '0 0 0.6rem' }}>
          Support a verified charity
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', margin: 0 }}>
          All organisations are vetted by our team. 100% of your donation goes to the cause.
        </p>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div style={{ flex: 2, minWidth: 220 }}>
          <label className="gh-label">Search</label>
          <input className="gh-input" placeholder="Charity name or keyword…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label className="gh-label">Category</label>
          <select className="gh-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--ink)' }}>{filtered.length}</strong> of {all.length} charities
          </span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h4>No charities found</h4>
          <p>Try a different search term or category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(c => {
            const meta = CATEGORY_META[c.category] || CATEGORY_META.other;
            return (
              <div key={c._id} className="charity-card-gh">
                <div className="charity-card-top" />
                <div className="charity-card-body">
                  <div className={`charity-icon-wrap ${meta.iconBg}`}>{meta.icon}</div>
                  <span className={`charity-tag ${meta.tagClass}`}>{meta.label}</span>
                  <h3 className="charity-name">{c.name}</h3>
                  <p className="charity-desc">
                    {c.description.length > 120 ? c.description.slice(0, 120) + '…' : c.description}
                  </p>
                  <div className="charity-stats">
                    <div className="charity-stat">
                      <span className="charity-stat-val">${(c.totalDonations || 0).toLocaleString()}</span>
                      <span className="charity-stat-key">Total Raised</span>
                    </div>
                    <div className="charity-stat">
                      <span className="charity-stat-val">{c.donationCount || 0}</span>
                      <span className="charity-stat-key">Donors</span>
                    </div>
                  </div>
                  <Link to={`/donate/${c._id}`} state={{ charity: c }} className="btn-teal-gh" style={{ width: '100%', justifyContent: 'center' }}>
                    Donate Now →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="cta-banner" style={{ marginTop: '3rem' }}>
        <h2>Is your charity not listed?</h2>
        <p>Submit your details and our team will review within 2–3 business days.</p>
        <Link to="/contact-us" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: 'var(--teal-dark)', padding: '0.9rem 2rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, textDecoration: 'none' }}>
          Submit a Charity →
        </Link>
      </div>
    </div>
  );
}
