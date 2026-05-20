import React, { useState, useEffect } from 'react';
import { adminAuth } from './adminFirebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import AdminDashboard from './AdminDashboard';

// Only the email is stored here to identify the admin account.
// Password is managed entirely by Firebase — change it anytime in
// Firebase Console > Authentication > Users without touching any code.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string;

const AdminRoot: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [authReady, setAuthReady] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(adminAuth, user => {
      // Accept session only if it belongs to the admin email
      setAuthReady(!!(user && user.email === ADMIN_EMAIL));
    });
    return unsub;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(adminAuth, email.trim(), password);
      // Extra guard — reject if somehow a different account signed in
      if (cred.user.email !== ADMIN_EMAIL) {
        await signOut(adminAuth);
        setError('Access denied.');
      }
      // onAuthStateChanged fires → sets authReady = true
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(adminAuth);
    setEmail('');
    setPassword('');
  };

  // Checking Firebase session
  if (authReady === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (authReady) return <AdminDashboard onExit={handleSignOut} />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '40px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, margin: '0 auto 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🛡️</div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366F1', margin: '0 0 4px' }}>JeevaLife</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com"
              style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#F8FAFC' }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, color: '#0F172A', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#F8FAFC' }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')} onBlur={e => (e.target.style.borderColor = '#E2E8F0')} />
          </div>
          {error && (
            <p style={{ fontSize: 13, color: '#DC2626', textAlign: 'center', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '9px 14px', margin: 0 }}>{error}</p>
          )}
          <button type="submit" disabled={loading} style={{ marginTop: 6, padding: '11px', borderRadius: 8, background: loading ? '#C7D2FE' : '#6366F1', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#CBD5E1', marginTop: 20 }}>JeevaLife Admin · Restricted Access</p>
      </div>
    </div>
  );
};

export default AdminRoot;
