import React, { useState, useEffect } from 'react';
import AdminFeedbackView from './AdminFeedbackView';
import AdminUsersView from './AdminUsersView';
import AdminQuestionsView from './AdminQuestionsView';
import { adminDb as db } from './adminFirebase';
import { collection, getCountFromServer } from 'firebase/firestore';

// ── Design tokens (light theme matching the screenshot) ──────────────────────
const C = {
  bg:        '#F8FAFC',
  sidebar:   '#FFFFFF',
  border:    '#E2E8F0',
  text:      '#0F172A',
  muted:     '#64748B',
  accent:    '#6366F1',   // indigo — active nav
  accentBg:  '#EEF2FF',
  accentBdr: '#C7D2FE',
  white:     '#FFFFFF',
  rowHover:  '#F1F5F9',
};

export { C };   // shared with child views

type AdminTab = 'dashboard' | 'feedback' | 'users' | 'questions';

interface AdminDashboardProps { onExit: () => void; }

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState({ users: 0, feedback: 0, checkins: 0, questions: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [u, f, c, q] = await Promise.all([
          getCountFromServer(collection(db, 'profiles')),
          getCountFromServer(collection(db, 'feedback')),
          getCountFromServer(collection(db, 'checkins')),
          getCountFromServer(collection(db, 'checkin_questions')),
        ]);
        setStats({ users: u.data().count, feedback: f.data().count, checkins: c.data().count, questions: q.data().count });
      } catch { /* silent */ }
    })();
  }, []);

  const NAV: { key: AdminTab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '⊞',  label: 'Dashboard' },
    { key: 'feedback',  icon: '💬', label: 'Feedback' },
    { key: 'users',     icon: '👥', label: 'Users' },
    { key: 'questions', icon: '❓', label: '60s Questions' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: C.bg, color: C.text, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, minWidth: 220, display: 'flex', flexDirection: 'column', background: C.sidebar, borderRight: `1px solid ${C.border}` }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌿</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>60s Check-in</p>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, fontSize: 13, fontWeight: tab === n.key ? 600 : 400,
              background: tab === n.key ? C.accentBg : 'transparent',
              color: tab === n.key ? C.accent : C.muted,
              border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Admin info + sign out */}
        <div style={{ padding: '12px 8px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={onExit} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 8, fontSize: 13, fontWeight: 500, width: '100%',
            background: 'transparent', color: '#EF4444', border: 'none', cursor: 'pointer',
          }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
        {tab === 'dashboard' && (
          <div style={{ padding: 32 }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: C.text }}>Dashboard</h1>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Overview of feedback, users and 60s check-in</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Users',      value: stats.users,     icon: '👤', color: '#6366F1', bg: '#EEF2FF' },
                { label: 'Total Feedback',   value: stats.feedback,  icon: '💬', color: '#0EA5E9', bg: '#E0F2FE' },
                { label: 'Total Check-ins',  value: stats.checkins,  icon: '💚', color: '#10B981', bg: '#D1FAE5' },
                { label: 'Active Questions', value: stats.questions, icon: '❓', color: '#F59E0B', bg: '#FEF3C7' },
              ].map(s => (
                <div key={s.label} style={{
                  background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
                  padding: '20px 20px', display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{s.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 600 }}>
              {[
                { label: 'View All Feedback', icon: '💬', tab: 'feedback' as AdminTab },
                { label: 'Manage Users',      icon: '👥', tab: 'users' as AdminTab },
                { label: 'Edit Questions',    icon: '❓', tab: 'questions' as AdminTab },
              ].map(q => (
                <button key={q.label} onClick={() => setTab(q.tab)} style={{
                  background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
                  padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600, color: C.text, cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}>
                  <span style={{ fontSize: 24 }}>{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'feedback'  && <AdminFeedbackView />}
        {tab === 'users'     && <AdminUsersView />}
        {tab === 'questions' && <AdminQuestionsView />}
      </main>
    </div>
  );
};

export default AdminDashboard;
