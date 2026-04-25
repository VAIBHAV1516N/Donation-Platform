// Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/users/login', { email, password });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.dispatchEvent(new CustomEvent('userChanged', { detail: res.data.user }));
      }
      navigate('/profile');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ width: 48, height: 48, background: 'var(--amber)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1rem' }}>♥</div>
          <h2>Welcome back</h2>
          <p>Sign in to your GiveHub account</p>
        </div>
        <div className="auth-body">
          {error && <div className="gh-alert error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="gh-label">Email Address</label>
              <input className="gh-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="gh-label">Password</label>
              <input className="gh-input" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary-gh" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            No account? <Link to="/register" className="auth-link">Create one free</Link>
          </p>
          <div className="gh-alert info" style={{ fontSize: '0.82rem' }}>
            <span>💡</span>
            <span><strong>Demo:</strong> seeduser@example.com / password123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
