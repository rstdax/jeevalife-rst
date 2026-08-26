import React, { useState, useEffect } from 'react';
import { adminDb as db } from './adminFirebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const C = {
  bg: '#F8FAFC', white: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B',
  accent: '#6366F1', accentBg: '#EEF2FF', accentBdr: '#C7D2FE',
  green: '#16A34A', greenBg: '#DCFCE7', greenBdr: '#86EFAC',
  red: '#DC2626', redBg: '#FEE2E2', redBdr: '#FCA5A5',
  amber: '#D97706', amberBg: '#FEF3C7', amberBdr: '#FCD34D',
};

interface Program {
  id: string; title: string; organizer: string;
  date_start: string; date_end: string; venue: string;
  description: string; status: 'active' | 'expired'; created_at: string;
}

interface Participant {
  id: string; user_id: string; program_id: string; program_title: string;
  participating: boolean; joined_at: string;
  attendance?: 'present' | 'absent' | null;
  user_name?: string; user_role?: string; user_dept?: string;
}

const EMPTY_FORM: { title: string; organizer: string; date_start: string; date_end: string; venue: string; description: string; status: 'active' | 'expired' } = { title: '', organizer: '', date_start: '', date_end: '', venue: '', description: '', status: 'active' };
const fmt = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const AdminProgramsView: React.FC = () => {
  const [programs, setPrograms]     = useState<Program[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState<string | 'new' | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [selected, setSelected]     = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [partLoading, setPartLoading]  = useState(false);
  const [savingAtt, setSavingAtt]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'programs'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Program));
      list.sort((a, b) => a.status === b.status ? b.date_start.localeCompare(a.date_start) : a.status === 'active' ? -1 : 1);
      setPrograms(list);
    } catch { /* silent */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openEdit = (p: Program) => { setForm({ title: p.title, organizer: p.organizer, date_start: p.date_start.slice(0,10), date_end: p.date_end.slice(0,10), venue: p.venue, description: p.description, status: p.status }); setEditingId(p.id); };
  const openNew  = () => { setForm(EMPTY_FORM); setEditingId('new'); };
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date_start || !form.date_end) return;
    setSaving(true);
    try {
      const data = { ...form, title: form.title.trim(), organizer: form.organizer.trim(), venue: form.venue.trim(), description: form.description.trim() };
      if (editingId === 'new') await addDoc(collection(db, 'programs'), { ...data, created_at: new Date().toISOString() });
      else if (editingId) await updateDoc(doc(db, 'programs', editingId), data);
      await load(); cancelEdit();
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this program?')) return;
    setSaving(true);
    try { await deleteDoc(doc(db, 'programs', id)); await load(); if (editingId === id) cancelEdit(); if (selected?.id === id) setSelected(null); } catch { /* silent */ }
    setSaving(false);
  };

  const loadParticipants = async (p: Program) => {
    setSelected(p); setPartLoading(true);
    try {
      // No orderBy to avoid requiring a composite index
      const snap = await getDocs(query(collection(db, 'program_participants'), where('program_id', '==', p.id)));
      const parts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      const profileSnap = await getDocs(collection(db, 'profiles'));
      const profileMap: Record<string, { name: string; role: string; dept: string }> = {};
      profileSnap.docs.forEach(d => {
        profileMap[d.id] = { name: d.data().name ?? 'Unknown', role: d.data().role ?? '—', dept: d.data().department ?? '—' };
      });
      parts.forEach(pt => {
        const pr = profileMap[pt.user_id];
        pt.user_name = pr?.name ?? pt.user_id;
        pt.user_role = pr?.role ?? '—';
        pt.user_dept = pr?.dept ?? '—';
      });
      // Sort by joined_at in JS instead
      const filtered = parts.filter(pt => pt.participating);
      filtered.sort((a, b) => (b.joined_at ?? '').localeCompare(a.joined_at ?? ''));
      setParticipants(filtered);
    } catch(e) { console.error('loadParticipants error:', e); }
    setPartLoading(false);
  };

  const updateAttendance = async (pt: Participant, att: 'present' | 'absent' | null) => {
    setSavingAtt(pt.id);
    try {
      await updateDoc(doc(db, 'program_participants', pt.id), { attendance: att });
      setParticipants(prev => prev.map(p => p.id === pt.id ? { ...p, attendance: att } : p));
    } catch { /* silent */ }
    setSavingAtt(null);
  };

  const downloadExcel = () => {
    if (!selected || participants.length === 0) return;
    const rows = [
      ['Name', 'Role', 'Department', 'Registered', 'Attendance', 'Joined At'],
      ...participants.map(pt => [
        pt.user_name ?? '',
        pt.user_role ?? '',
        pt.user_dept ?? '',
        pt.participating ? 'Yes' : 'No',
        pt.attendance ?? 'Not marked',
        pt.joined_at ? new Date(pt.joined_at).toLocaleDateString('en-IN') : '',
      ]),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Column widths
    ws['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `${selected.title.replace(/\s+/g, '_')}_attendance.xlsx`);
  };

  const downloadPDF = () => {
    if (!selected || participants.length === 0) return;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
    pdf.text('Program Attendance Report', 15, y); y += 9;
    pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
    pdf.text(`Program: ${selected.title}`, 15, y); y += 6;
    pdf.text(`Organizer: ${selected.organizer}`, 15, y); y += 6;
    pdf.text(`Venue: ${selected.venue}`, 15, y); y += 6;
    const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    pdf.text(`Dates: ${fmtDate(selected.date_start)} – ${fmtDate(selected.date_end)}`, 15, y); y += 6;
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 15, y); y += 8;
    // Summary
    const present = participants.filter(p => p.attendance === 'present').length;
    const absent = participants.filter(p => p.attendance === 'absent').length;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total Registered: ${participants.length}   Present: ${present}   Absent: ${absent}   Not Marked: ${participants.length - present - absent}`, 15, y); y += 8;
    // Divider
    pdf.setDrawColor(200, 200, 200); pdf.line(15, y, 195, y); y += 5;
    // Table header
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    const cols = [15, 65, 100, 135, 162];
    const headers = ['Name', 'Role', 'Department', 'Registered', 'Attendance'];
    headers.forEach((h, i) => pdf.text(h, cols[i], y));
    y += 5; pdf.setDrawColor(200, 200, 200); pdf.line(15, y, 195, y); y += 4;
    pdf.setFont('helvetica', 'normal');
    participants.forEach(pt => {
      if (y > 275) { pdf.addPage(); y = 20; }
      const attLabel = pt.attendance === 'present' ? 'Present' : pt.attendance === 'absent' ? 'Absent' : '—';
      const row = [
        (pt.user_name ?? '').slice(0, 20),
        (pt.user_role ?? '').slice(0, 14),
        (pt.user_dept ?? '').slice(0, 18),
        pt.participating ? 'Yes' : 'No',
        attLabel,
      ];
      row.forEach((v, i) => pdf.text(v, cols[i], y));
      y += 7;
    });
    pdf.save(`${selected.title.replace(/\s+/g, '_')}_attendance.pdf`);
  };

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif', color: C.text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Programs</h1>
        <button onClick={openNew} style={{ padding: '8px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Program</button>
      </div>
      <p style={{ fontSize: 13, color: C.muted, margin: '0 0 24px' }}>Manage programs, view and mark participant attendance.</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Programs table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 90px 110px', padding: '10px 16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px 10px 0 0', borderBottom: 'none' }}>
              {['Program', 'Dates', 'Venue', 'Status', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: '0 0 10px 10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {programs.length === 0 && <div style={{ padding: '40px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No programs yet.</div>}
              {programs.map((p, idx) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 90px 110px', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: selected?.id === p.id ? C.accentBg : idx % 2 === 0 ? C.white : C.bg, alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{p.organizer}</p>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted }}>{fmt(p.date_start)} – {fmt(p.date_end)}</span>
                  <span style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.venue}</span>
                  <span><span style={{ background: p.status === 'active' ? C.greenBg : C.bg, color: p.status === 'active' ? C.green : C.muted, border: `1px solid ${p.status === 'active' ? C.greenBdr : C.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{p.status === 'active' ? 'Active' : 'Expired'}</span></span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => loadParticipants(p)} style={{ background: C.accentBg, border: `1px solid ${C.accentBdr}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 12, color: C.accent }} title="Attendance">👥</button>
                    <button onClick={() => openEdit(p)} style={{ background: C.amberBg, border: `1px solid ${C.amberBdr}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 12, color: C.amber }} title="Edit">✏️</button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: C.redBg, border: `1px solid ${C.redBdr}`, borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 12, color: C.red }} title="Delete">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participants + Attendance — centered modal */}
          {selected && editingId === null && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.5)', padding: 24 }}
              onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
              <div style={{ width: '100%', maxWidth: 620, background: '#fff', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Modal header bar */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', flexShrink: 0 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{selected.title}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{selected.organizer} · {fmt(selected.date_start)} – {fmt(selected.date_end)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {participants.length > 0 && (
                      <>
                        <button onClick={downloadExcel} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 12, fontWeight: 600, color: '#15803D', cursor: 'pointer' }}>
                          <span>↓</span> Excel
                        </button>
                        <button onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, background: '#FFF1F2', border: '1px solid #FECDD3', fontSize: 12, fontWeight: 600, color: '#BE123C', cursor: 'pointer' }}>
                          <span>↓</span> PDF
                        </button>
                      </>
                    )}
                    <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#64748B', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                </div>

                {/* Stats row */}
                {participants.length > 0 && (
                  <div style={{ padding: '10px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 24, flexShrink: 0, background: '#fff' }}>
                    {[
                      { label: 'Registered', value: participants.length, color: '#3B82F6' },
                      { label: 'Present', value: participants.filter(p => p.attendance === 'present').length, color: '#16A34A' },
                      { label: 'Absent', value: participants.filter(p => p.attendance === 'absent').length, color: '#DC2626' },
                      { label: 'Not Marked', value: participants.filter(p => !p.attendance).length, color: '#94A3B8' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {partLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite' }} />
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                  ) : participants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8', fontSize: 13 }}>
                      No registrations yet for this program.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '9px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '35%' }}>Participant</th>
                          <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '20%' }}>Role / Dept</th>
                          <th style={{ padding: '9px 14px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '20%' }}>Status</th>
                          <th style={{ padding: '9px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '25%' }}>Mark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((pt, idx) => (
                          <tr key={pt.id} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                            <td style={{ padding: '11px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {(pt.user_name ?? 'U').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600, color: '#0F172A' }}>{pt.user_name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '11px 14px', color: '#64748B', fontSize: 12 }}>
                              {pt.user_role}<br />
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>{pt.user_dept}</span>
                            </td>
                            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                              {pt.attendance === 'present' && <span style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 5, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✓ Present</span>}
                              {pt.attendance === 'absent'  && <span style={{ background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3', borderRadius: 5, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✗ Absent</span>}
                              {!pt.attendance && <span style={{ color: '#CBD5E1', fontSize: 11 }}>—</span>}
                            </td>
                            <td style={{ padding: '11px 14px' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                {(['present', 'absent', null] as const).map(att => (
                                  <button key={String(att)} onClick={() => updateAttendance(pt, att)} disabled={savingAtt === pt.id}
                                    style={{
                                      padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                                      background: pt.attendance === att
                                        ? (att === 'present' ? '#F0FDF4' : att === 'absent' ? '#FFF1F2' : '#F1F5F9')
                                        : '#fff',
                                      color: pt.attendance === att
                                        ? (att === 'present' ? '#15803D' : att === 'absent' ? '#BE123C' : '#64748B')
                                        : '#94A3B8',
                                      borderColor: pt.attendance === att
                                        ? (att === 'present' ? '#BBF7D0' : att === 'absent' ? '#FECDD3' : '#CBD5E1')
                                        : '#E2E8F0',
                                    }}>
                                    {att === null ? 'Clear' : att === 'present' ? '✓' : '✗'}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit modal */}
      {editingId !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) cancelEdit(); }}>
          <div style={{ width: '100%', maxWidth: 520, background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{editingId === 'new' ? 'New Program' : 'Edit Program'}</span>
              <button onClick={cancelEdit} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted }}>✕</button>
            </div>
            {[{ label: 'Title *', key: 'title', ph: 'Program name' }, { label: 'Organizer', key: 'organizer', ph: 'University / Institution' }, { label: 'Venue', key: 'venue', ph: 'Auditorium / Location' }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: C.text }}
                  onFocus={e => (e.target.style.borderColor = C.accent)} onBlur={e => (e.target.style.borderColor = C.border)} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[{ label: 'Start Date *', key: 'date_start' }, { label: 'End Date *', key: 'date_end' }].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <input type="date" value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: C.text }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Brief description..."
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: C.text }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Status</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['active', 'expired'] as const).map(s => (
                  <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))} style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', background: form.status === s ? (s === 'active' ? C.greenBg : C.bg) : C.bg, color: form.status === s ? (s === 'active' ? C.green : C.muted) : C.muted, border: `1px solid ${form.status === s ? (s === 'active' ? C.greenBdr : C.border) : C.border}` }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={cancelEdit} style={{ flex: 1, padding: '11px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.muted, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ flex: 1, padding: '11px', borderRadius: 8, background: saving || !form.title.trim() ? '#C7D2FE' : C.accent, border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving...' : editingId === 'new' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProgramsView;
