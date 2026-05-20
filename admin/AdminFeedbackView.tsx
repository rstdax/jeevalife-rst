import React, { useState, useEffect } from 'react';
import { adminDb as db } from './adminFirebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const C = { bg: '#F8FAFC', white: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', rowHover: '#F1F5F9', accent: '#6366F1', accentBg: '#EEF2FF' };

type FeedbackCategory = 'bug' | 'feature' | 'complaint' | 'other';
interface FeedbackItem {
  id: string; user_id: string; type: FeedbackCategory; text: string; created_at: string;
  status?: 'new' | 'in_progress' | 'resolved';
  love?: string; hate?: string; suggestion?: string; rating?: number; milestone?: string;
}

const CATS = [
  { key: 'all',       label: 'All',       color: '#0F172A', bg: '#F1F5F9', border: '#CBD5E1' },
  { key: 'bug',       label: 'Bug',       color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' },
  { key: 'feature',   label: 'Feature',   color: '#2563EB', bg: '#DBEAFE', border: '#93C5FD' },
  { key: 'complaint', label: 'Complaint', color: '#D97706', bg: '#FEF3C7', border: '#FCD34D' },
  { key: 'other',     label: 'Other',     color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
] as const;

const STATUS = {
  new:         { label: 'New',         color: '#2563EB', bg: '#DBEAFE' },
  in_progress: { label: 'In Progress', color: '#D97706', bg: '#FEF3C7' },
  resolved:    { label: 'Resolved',    color: '#16A34A', bg: '#DCFCE7' },
};

const AdminFeedbackView: React.FC = () => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedbackCategory | 'all'>('all');
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const fbSnap = await getDocs(collection(db, 'feedback'));
        const fb = fbSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackItem));
        setItems(fb.sort((a, b) => b.created_at.localeCompare(a.created_at)));
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, []);

  const filtered = activeTab === 'all' ? items : items.filter(i => i.type === activeTab);
  const counts: Record<string, number> = { all: items.length, bug: 0, feature: 0, complaint: 0, other: 0 };
  items.forEach(i => { counts[i.type] = (counts[i.type] ?? 0) + 1; });

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { status });
      setItems(p => p.map(i => i.id === id ? { ...i, status: status as FeedbackItem['status'] } : i));
      setSelected(p => p?.id === id ? { ...p, status: status as FeedbackItem['status'] } : p);
    } catch { /* silent */ }
  };

  const cat = (type: string) => CATS.find(c => c.key === type) ?? CATS[4];

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif', color: C.text }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Feedback</h1>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 24px' }}>All user feedback, bug reports and suggestions</p>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c.key} onClick={() => setActiveTab(c.key as FeedbackCategory | 'all')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            background: activeTab === c.key ? c.bg : C.white,
            color: activeTab === c.key ? c.color : C.muted,
            border: `1px solid ${activeTab === c.key ? c.border : C.border}`,
          }}>
            {c.label}
            <span style={{ background: activeTab === c.key ? c.color : '#CBD5E1', color: activeTab === c.key ? '#fff' : C.muted, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
              {counts[c.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 110px 160px 100px', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                {['ID', 'Message', 'Category', 'Date', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>
              {filtered.length === 0 && (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No feedback in this category yet.</div>
              )}
              {filtered.map((item, idx) => {
                const c = cat(item.type);
                const text = item.text || item.love || item.hate || item.suggestion || '(no text)';
                const st = item.status ? STATUS[item.status] : null;
                return (
                  <div key={item.id} onClick={() => setSelected(item)} style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 110px 160px 100px',
                    padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                    background: selected?.id === item.id ? C.accentBg : idx % 2 === 0 ? C.white : C.bg,
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.background = C.rowHover; }}
                    onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.background = idx % 2 === 0 ? C.white : C.bg; }}>
                    <span style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>#{item.id.slice(-4).toUpperCase()}</span>
                    <span style={{ fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{text}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{c.label}</span>
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>
                      {st && <span style={{ background: st.bg, color: st.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{st.label}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: 300, minWidth: 300, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, alignSelf: 'flex-start', position: 'sticky', top: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Detail</span>
                <button onClick={() => setSelected(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: C.muted }}>✕</button>
              </div>
              {/* Category badge */}
              {(() => { const c = cat(selected.type); return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'inline-block', marginBottom: 12 }}>{c.label}</span>; })()}
              {selected.rating && <p style={{ fontSize: 18, marginBottom: 12 }}>{'⭐'.repeat(selected.rating)}</p>}
              {selected.love && <div style={{ marginBottom: 12 }}><p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#16A34A', marginBottom: 4 }}>💚 Loves</p><p style={{ fontSize: 13, color: C.muted }}>{selected.love}</p></div>}
              {selected.hate && <div style={{ marginBottom: 12 }}><p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#DC2626', marginBottom: 4 }}>❌ Hates</p><p style={{ fontSize: 13, color: C.muted }}>{selected.hate}</p></div>}
              {selected.suggestion && <div style={{ marginBottom: 12 }}><p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#D97706', marginBottom: 4 }}>💡 Suggestion</p><p style={{ fontSize: 13, color: C.muted }}>{selected.suggestion}</p></div>}
              {selected.text && <div style={{ marginBottom: 12 }}><p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Message</p><p style={{ fontSize: 13, color: C.muted }}>{selected.text}</p></div>}
              {/* Status */}
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Status</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['new', 'in_progress', 'resolved'] as const).map(s => {
                  const st = STATUS[s];
                  return (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} style={{
                      flex: 1, padding: '6px 4px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      background: selected.status === s ? st.bg : C.bg,
                      color: selected.status === s ? st.color : C.muted,
                      border: `1px solid ${selected.status === s ? st.color + '60' : C.border}`,
                    }}>{st.label}</button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 12 }}>{new Date(selected.created_at).toLocaleString('en-IN')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackView;
