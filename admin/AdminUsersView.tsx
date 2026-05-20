import React, { useState, useEffect } from 'react';
import { adminDb as db } from './adminFirebase';
import { collection, getDocs, query, where, orderBy, limit, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';

const C = { bg: '#F8FAFC', white: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', rowHover: '#F1F5F9', accent: '#6366F1', accentBg: '#EEF2FF', accentBdr: '#C7D2FE' };

interface UserProfile { id: string; name: string|null; bio: string|null; age: number|null; height: number|null; weight: number|null; goals: string[]|null; avatar_url: string|null; emergency_contact_phone: string|null; emergency_contact_relation: string|null; created_at: string; updated_at: string; }
interface CheckinRecord { id: string; jeeva_score: number; mood: number; energy: number; stress: number; sleep: number; focus: number; created_at: string; }
interface JournalEntry { id: string; text: string; created_at: string; }

const LABELS = {
  mood:   ['Radiant','Content','Low','Disturbed'],
  energy: ['High','Blended','Sluggish','Exhausted'],
  stress: ['Relaxed','Manageable','Tensed','Overwhelmed'],
  sleep:  ['7-9h','6-7h','4-6h','<4h'],
  focus:  ['Laser Sharp','Focused','Distracted','Scattered'],
};

const AVATAR_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6'];
const PAGE_SIZE = 10;

const AdminUsersView: React.FC = () => {
  const [users, setUsers]           = useState<UserProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<UserProfile|null>(null);
  const [checkins, setCheckins]     = useState<CheckinRecord[]>([]);
  const [days, setDays]             = useState(7);
  const [ciLoading, setCiLoading]   = useState(false);
  const [userTab, setUserTab]       = useState<'profile'|'insights'|'reflections'>('profile');

  // Reflections state
  const [reflections, setReflections]       = useState<JournalEntry[]>([]);
  const [refLoading, setRefLoading]         = useState(false);
  const [refLastDoc, setRefLastDoc]         = useState<QueryDocumentSnapshot<DocumentData>|null>(null);
  const [refHasMore, setRefHasMore]         = useState(false);
  const [refLoadingMore, setRefLoadingMore] = useState(false);
  const [readingEntry, setReadingEntry]     = useState<JournalEntry|null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const s = await getDocs(collection(db, 'profiles')); setUsers(s.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile))); } catch { /* silent */ }
      setLoading(false);
    })();
  }, []);

  const loadCheckins = async (uid: string, d: number) => {
    setCiLoading(true);
    try {
      const since = new Date(Date.now() - d * 86400000).toISOString();
      const s = await getDocs(query(collection(db, 'checkins'), where('user_id','==',uid), where('created_at','>=',since), orderBy('created_at','desc'), limit(100)));
      setCheckins(s.docs.map(d => ({ id: d.id, ...d.data() } as CheckinRecord)));
    } catch { /* silent */ }
    setCiLoading(false);
  };

  const selectUser = (u: UserProfile) => {
    setSelected(u);
    setUserTab('profile');
    loadCheckins(u.id, days);
    // Reset reflections when switching user
    setReflections([]);
    setRefLastDoc(null);
    setRefHasMore(false);
    setReadingEntry(null);
  };

  const loadReflections = async (uid: string, after?: QueryDocumentSnapshot<DocumentData>) => {
    if (after) setRefLoadingMore(true); else setRefLoading(true);
    try {
      const q = after
        ? query(collection(db, 'journal_entries'), where('user_id','==',uid), orderBy('created_at','desc'), startAfter(after), limit(PAGE_SIZE))
        : query(collection(db, 'journal_entries'), where('user_id','==',uid), orderBy('created_at','desc'), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
      setReflections(prev => after ? [...prev, ...entries] : entries);
      setRefLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setRefHasMore(snap.docs.length === PAGE_SIZE);
    } catch { /* silent */ }
    if (after) setRefLoadingMore(false); else setRefLoading(false);
  };

  const changeDay  = (d: number) => { setDays(d); if (selected) loadCheckins(selected.id, d); };

  const filtered = users.filter(u => (u.name ?? '').toLowerCase().includes(search.toLowerCase()) || u.id.includes(search));
  const avgScore = checkins.length ? Math.round(checkins.reduce((s,c) => s + c.jeeva_score, 0) / checkins.length) : null;
  const cmToFt   = (cm: number) => { const i = cm/2.54; return `${Math.floor(i/12)}ft ${Math.round(i%12)}in`; };
  const avatarBg = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const scoreColor = (s: number) => s >= 85 ? '#16A34A' : s >= 70 ? '#2563EB' : s >= 50 ? '#D97706' : '#DC2626';

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'Inter, sans-serif', color: C.text }}>

      {/* User list */}
      <div style={{ width: 280, minWidth: 280, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.white }}>
        <div style={{ padding: '24px 16px 12px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Users</h1>
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>{users.length} total</p>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 12px' }}>
            <span style={{ color: C.muted, fontSize: 13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text, flex: 1 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.map(u => (
            <div key={u.id} onClick={() => selectUser(u)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
              background: selected?.id === u.id ? C.accentBg : C.white,
              borderLeft: selected?.id === u.id ? `3px solid ${C.accent}` : '3px solid transparent',
              transition: 'all 0.1s',
            }}
              onMouseEnter={e => { if (selected?.id !== u.id) e.currentTarget.style.background = C.rowHover; }}
              onMouseLeave={e => { if (selected?.id !== u.id) e.currentTarget.style.background = C.white; }}>
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarBg(u.name ?? 'U'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, overflow: 'hidden' }}>
                {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (u.name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name ?? 'Unknown'}</p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Joined {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 12 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      {selected ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {/* Back + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setSelected(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>←</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selected.name ?? 'Unknown'}</h2>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
            {(['profile','insights','reflections'] as const).map(t => (
              <button key={t} onClick={() => {
                setUserTab(t);
                if (t === 'reflections' && selected && reflections.length === 0) {
                  loadReflections(selected.id);
                }
              }} style={{
                padding: '6px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                background: userTab === t ? C.white : 'transparent',
                color: userTab === t ? C.accent : C.muted,
                border: userTab === t ? `1px solid ${C.border}` : '1px solid transparent',
                boxShadow: userTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>{t}</button>
            ))}
          </div>

          {userTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Profile card */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', marginBottom: 16 }}>Profile Information</p>
                {[
                  ['Full Name', selected.name ?? '—'],
                  ['Age', selected.age ? `${selected.age} yrs` : '—'],
                  ['Height', selected.height ? `${cmToFt(selected.height)} (${Math.round(selected.height)} cm)` : '—'],
                  ['Weight', selected.weight ? `${selected.weight.toFixed(1)} kg` : '—'],
                  ['Bio', selected.bio ?? '—'],
                  ['Joined', new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.muted }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Goals + emergency */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', marginBottom: 12 }}>Wellness Goals</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(selected.goals ?? []).map(g => (
                      <span key={g} style={{ background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBdr}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{g}</span>
                    ))}
                  </div>
                </div>
                {selected.emergency_contact_phone && (
                  <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 12, padding: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#DC2626', letterSpacing: '0.06em', marginBottom: 8 }}>Emergency Contact</p>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{selected.emergency_contact_phone}</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{selected.emergency_contact_relation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {userTab === 'insights' && (
            <div>
              {/* Day filter */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[7,14,30,90].map(d => (
                  <button key={d} onClick={() => changeDay(d)} style={{
                    padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: days === d ? C.accent : C.white,
                    color: days === d ? '#fff' : C.muted,
                    border: `1px solid ${days === d ? C.accent : C.border}`,
                  }}>{d} Days</button>
                ))}
              </div>
              {ciLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : checkins.length === 0 ? (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No check-ins in this period.</div>
              ) : (
                <>
                  {/* Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Total Check-ins', value: checkins.length },
                      { label: 'Avg Jeeva Score', value: avgScore ?? '—' },
                      { label: 'Best Score', value: Math.max(...checkins.map(c => c.jeeva_score)) },
                    ].map(s => (
                      <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <p style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: C.text }}>{s.value}</p>
                        <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Table */}
                  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: C.bg }}>
                          {['Date','Score','Mood','Energy','Stress','Sleep','Focus'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {checkins.map((c, i) => (
                          <tr key={c.id} style={{ background: i % 2 === 0 ? C.white : C.bg, borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '10px 14px', color: C.muted }}>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: scoreColor(c.jeeva_score) }}>{c.jeeva_score}</td>
                            <td style={{ padding: '10px 14px', color: C.text }}>{LABELS.mood[c.mood] ?? '—'}</td>
                            <td style={{ padding: '10px 14px', color: C.text }}>{LABELS.energy[c.energy] ?? '—'}</td>
                            <td style={{ padding: '10px 14px', color: C.text }}>{LABELS.stress[c.stress] ?? '—'}</td>
                            <td style={{ padding: '10px 14px', color: C.text }}>{LABELS.sleep[c.sleep] ?? '—'}</td>
                            <td style={{ padding: '10px 14px', color: C.text }}>{LABELS.focus[c.focus] ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Reflections Tab ── */}
          {userTab === 'reflections' && (
            <div>
              {/* Reading a single entry */}
              {readingEntry ? (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                    <button onClick={() => setReadingEntry(null)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: C.muted }}>←</button>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                        {new Date(readingEntry.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                        {new Date(readingEntry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: '20px 20px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: C.text }}>
                    {readingEntry.text.startsWith('Q:') ? (
                      readingEntry.text.split('\n\n').map((part, i) => (
                        <p key={i} style={{ margin: '0 0 12px', color: i === 0 ? '#059669' : C.text, fontWeight: i === 0 ? 600 : 400 }}>{part}</p>
                      ))
                    ) : (
                      readingEntry.text
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {refLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                  ) : reflections.length === 0 ? (
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                      No reflections found for this user.
                    </div>
                  ) : (
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: '10px 16px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                        {['Date', 'Reflection'].map(h => (
                          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                        ))}
                      </div>
                      {reflections.map((entry, i) => {
                        const isQ = entry.text.startsWith('Q:');
                        const parts = isQ ? entry.text.split('\n\n') : [];
                        return (
                          <div key={entry.id} onClick={() => setReadingEntry(entry)} style={{
                            display: 'grid', gridTemplateColumns: '160px 1fr',
                            padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                            background: i % 2 === 0 ? C.white : C.bg,
                            cursor: 'pointer', transition: 'background 0.1s',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = C.accentBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? C.white : C.bg)}>
                            <div>
                              <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 2px', color: C.text }}>
                                {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                                {new Date(entry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              {isQ ? (
                                <>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: '#059669', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parts[0]}</p>
                                  {parts[1] && <p style={{ fontSize: 12, color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parts[1]}</p>}
                                </>
                              ) : (
                                <p style={{ fontSize: 13, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.text}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Load more */}
                  {refHasMore && (
                    <button onClick={() => { if (selected && refLastDoc) loadReflections(selected.id, refLastDoc); }} style={{
                      marginTop: 12, width: '100%', padding: '10px', borderRadius: 8,
                      background: C.white, border: `1px solid ${C.border}`,
                      fontSize: 13, fontWeight: 600, color: C.accent, cursor: 'pointer',
                    }}>
                      {refLoadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 40, opacity: 0.3 }}>👤</span>
          <p style={{ fontSize: 13 }}>Select a user to view their details</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsersView;
