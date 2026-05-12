'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Invalid username or password.');
    } else {
      router.push('/admin/scanner');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Card */}
        <div style={{
          background: 'var(--white)',
          border: '0.5px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        }}>
          {/* Top accent bar */}
          <div style={{ height: 3, background: 'linear-gradient(to right, #ed1c24, #b50e14)' }} />

          {/* Header */}
          <div style={{
            background: 'var(--ink)',
            padding: '28px 32px 22px',
            textAlign: 'center',
            borderBottom: '2px solid var(--red)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              <div className="heart-rate" style={{ width: 60, height: 28 }}>
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="28px" viewBox="0 0 150 73" xmlSpace="preserve">
                  <polyline fill="none" stroke="#ed1c24" strokeWidth="3" strokeMiterlimit="10" points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486" />
                </svg>
                <div className="fade-in"></div>
                <div className="fade-out"></div>
              </div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '0.06em', color: '#fff' }}>
                CNT <span style={{ color: '#ed1c24' }}>PULSE</span>
              </span>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Admin Access · Scanner &amp; Dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22, fontFamily: "'DM Mono', monospace", lineHeight: 1.65 }}>
              Sign in to access the QR scanner and attendance dashboard.
            </p>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username" type="text" className="form-input"
                placeholder="admin" value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username" required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 22 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="form-input"
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password" required
              />
            </div>

            {error && (
              <div className="lookup-error" style={{ display: 'block', marginBottom: 16 }}>
                // {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-full"
              disabled={loading}
              style={{ opacity: loading ? 0.75 : 1 }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>
          CNT Pulse · Corporate Communications
        </p>
      </div>
    </div>
  );
}
