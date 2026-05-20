import React, { useState, useEffect } from 'react';
import { adminDb as db } from './adminFirebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, writeBatch } from 'firebase/firestore';

const C = { bg: '#F8FAFC', white: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', accent: '#6366F1', accentBg: '#EEF2FF', accentBdr: '#C7D2FE' };

interface QuestionOption { e: string; t: string; }
interface CheckinQuestion { id: string; q: string; opts: QuestionOption[]; order: number; active: boolean; }
const EMPTY_OPTS: QuestionOption[] = [{ e:'',t:'' },{ e:'',t:'' },{ e:'',t:'' },{ e:'',t:'' }];

const AdminQuestionsView: React.FC = () => {
  const [questions, setQuestions] = useState<CheckinQuestion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState<string|'new'|null>(null);
  const [formQ, setFormQ]         = useState('');
  const [formOpts, setFormOpts]   = useState<QuestionOption[]>(EMPTY_OPTS);
  const [formActive, setFormActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const s = await getDocs(query(collection(db, 'checkin_questions'), orderBy('order','asc'))); setQuestions(s.docs.map(d => ({ id: d.id, ...d.data() } as CheckinQuestion))); } catch { /* silent */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setFormQ(''); setFormOpts(EMPTY_OPTS.map(o=>({...o}))); setFormActive(true); setEditingId('new'); };
  const openEdit = (q: CheckinQuestion) => { setFormQ(q.q); setFormOpts(q.opts.length===4 ? q.opts.map(o=>({...o})) : [...q.opts,...EMPTY_OPTS].slice(0,4)); setFormActive(q.active); setEditingId(q.id); };
  const cancel   = () => { setEditingId(null); setFormQ(''); setFormOpts(EMPTY_OPTS.map(o=>({...o}))); };

  const handleSave = async () => {
    if (!formQ.trim()) return;
    const opts = formOpts.filter(o => o.t.trim());
    if (opts.length < 2) { alert('Add at least 2 options.'); return; }
    setSaving(true);
    try {
      if (editingId === 'new') {
        const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order)) : 0;
        await addDoc(collection(db, 'checkin_questions'), { q: formQ.trim(), opts, order: maxOrder+1, active: formActive });
      } else if (editingId) {
        await updateDoc(doc(db, 'checkin_questions', editingId), { q: formQ.trim(), opts, active: formActive });
      }
      await load(); cancel();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    setSaving(true);
    try { await deleteDoc(doc(db, 'checkin_questions', id)); await load(); if (editingId===id) cancel(); } catch { /* silent */ }
    setSaving(false);
  };

  const toggleActive = async (q: CheckinQuestion) => {
    try { await updateDoc(doc(db, 'checkin_questions', q.id), { active: !q.active }); setQuestions(p => p.map(i => i.id===q.id ? {...i,active:!i.active} : i)); } catch { /* silent */ }
  };

  const moveUp = async (idx: number) => {
    if (idx===0) return;
    const u = [...questions]; [u[idx-1],u[idx]] = [u[idx],u[idx-1]];
    const b = writeBatch(db); u.forEach((q,i) => b.update(doc(db,'checkin_questions',q.id),{order:i+1})); await b.commit();
    setQuestions(u.map((q,i) => ({...q,order:i+1})));
  };
  const moveDown = async (idx: number) => {
    if (idx===questions.length-1) return;
    const u = [...questions]; [u[idx],u[idx+1]] = [u[idx+1],u[idx]];
    const b = writeBatch(db); u.forEach((q,i) => b.update(doc(db,'checkin_questions',q.id),{order:i+1})); await b.commit();
    setQuestions(u.map((q,i) => ({...q,order:i+1})));
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif', color: C.text }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>60s Check-in Questions</h1>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Question
        </button>
      </div>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 24px' }}>Manage questions shown during the 60-second check-in. Changes apply immediately.</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Question list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '48px 40px 1fr 120px 100px', padding: '10px 16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px 10px 0 0', borderBottom: 'none' }}>
              {['Order','#','Question','Status','Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '0 0 10px 10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {questions.length === 0 && (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No questions yet. Click "Add Question" to create the first one.</div>
              )}
              {questions.map((q, idx) => (
                <div key={q.id} style={{
                  display: 'grid', gridTemplateColumns: '48px 40px 1fr 120px 100px',
                  padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                  background: editingId===q.id ? C.accentBg : C.white,
                  opacity: q.active ? 1 : 0.55,
                  alignItems: 'center',
                }}>
                  {/* Move buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => moveUp(idx)} disabled={idx===0} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, width: 22, height: 22, cursor: idx===0?'not-allowed':'pointer', fontSize: 10, color: C.muted, opacity: idx===0?0.3:1 }}>▲</button>
                    <button onClick={() => moveDown(idx)} disabled={idx===questions.length-1} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, width: 22, height: 22, cursor: idx===questions.length-1?'not-allowed':'pointer', fontSize: 10, color: C.muted, opacity: idx===questions.length-1?0.3:1 }}>▼</button>
                  </div>
                  {/* Order number */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{idx+1}</span>
                  {/* Question + options */}
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 4px', color: C.text }}>{q.q}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {q.opts.map((o,i) => (
                        <span key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 7px', fontSize: 11, color: C.muted }}>{o.e} {o.t}</span>
                      ))}
                    </div>
                  </div>
                  {/* Active badge */}
                  <span>
                    <button onClick={() => toggleActive(q)} style={{
                      background: q.active ? '#DCFCE7' : C.bg,
                      color: q.active ? '#16A34A' : C.muted,
                      border: `1px solid ${q.active ? '#86EFAC' : C.border}`,
                      borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>{q.active ? 'Active' : 'Inactive'}</button>
                  </span>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(q)} style={{ background: C.accentBg, border: `1px solid ${C.accentBdr}`, borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: C.accent }}>✏️</button>
                    <button onClick={() => handleDelete(q.id)} style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#DC2626' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit / Add form */}
          {editingId !== null && (
            <div style={{ width: 340, minWidth: 340, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, alignSelf: 'flex-start', position: 'sticky', top: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{editingId==='new' ? 'New Question' : 'Edit Question'}</span>
                <button onClick={cancel} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: C.muted }}>✕</button>
              </div>
              {/* Question */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Question</label>
                <input value={formQ} onChange={e => setFormQ(e.target.value)} placeholder="How are you feeling right now?"
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
                  onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
              {/* Options */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Options (4 max)</label>
                {formOpts.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input value={opt.e} onChange={e => setFormOpts(p => p.map((o,j) => j===i ? {...o,e:e.target.value} : o))} placeholder="😊"
                      style={{ width: 44, padding: '8px 6px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 16, textAlign: 'center', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                    <input value={opt.t} onChange={e => setFormOpts(p => p.map((o,j) => j===i ? {...o,t:e.target.value} : o))} placeholder={`Option ${i+1}`}
                      style={{ flex: 1, padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.text, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                      onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
                  </div>
                ))}
              </div>
              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Active</span>
                <div onClick={() => setFormActive(p => !p)} style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  background: formActive ? '#16A34A' : '#CBD5E1',
                }}>
                  <div style={{ position: 'absolute', top: 2, left: formActive ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={cancel} style={{ flex: 1, padding: '9px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving || !formQ.trim()} style={{ flex: 1, padding: '9px', borderRadius: 8, background: saving||!formQ.trim() ? '#C7D2FE' : C.accent, border: 'none', fontSize: 13, fontWeight: 700, color: '#fff', cursor: saving||!formQ.trim()?'not-allowed':'pointer' }}>
                  {saving ? 'Saving...' : editingId==='new' ? 'Add' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminQuestionsView;
