import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/users/register', { name, email, password });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          window.dispatchEvent(new CustomEvent('userChanged', { detail: res.data.user }));
        }
      }
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const perks = ['Save full donation history', 'Get automatic tax receipts', 'Personalised donor dashboard'];

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ width: 48, height: 48, background: 'var(--teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1rem' }}>✦</div>
          <h2>Create an account</h2>
          <p>Join 10,000+ donors on GiveHub</p>
        </div>
        <div className="auth-body">
          {error && <div className="gh-alert error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="gh-label">Full Name</label>
              <input className="gh-input" type="text" placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="gh-label">Email Address</label>
              <input className="gh-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="gh-label">Password</label>
              <input className="gh-input" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-teal-gh" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
          <div style={{ background: 'var(--teal-pale)', border: '1px solid #99F6E4', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal-dark)', marginBottom: '0.5rem' }}>Benefits of signing up</p>
            {perks.map(p => (
              <p key={p} style={{ fontSize: '0.82rem', color: 'var(--teal-dark)', margin: '0.2rem 0', display: 'flex', gap: 6 }}>
                <span>✓</span>{p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
