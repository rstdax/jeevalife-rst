import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, getDocs, query, where, doc,
  setDoc, deleteDoc,
} from 'firebase/firestore';

interface Program {
  id: string;
  title: string;
  organizer: string;
  date_start: string;
  date_end: string;
  venue: string;
  description: string;
  status: 'active' | 'expired';
  created_at: string;
}

interface ProgramsViewProps {
  onBack: () => void;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const ProgramsView: React.FC<ProgramsViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | null>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Program | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [participation, setParticipation] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'programs'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Program));
        // Active first, then expired
        list.sort((a, b) => {
          if (a.status === b.status) return b.date_start.localeCompare(a.date_start);
          return a.status === 'active' ? -1 : 1;
        });
        setPrograms(list);

        // Load user's participations
        if (user) {
          const pSnap = await getDocs(query(collection(db, 'program_participants'), where('user_id', '==', user.uid)));
          const map: Record<string, boolean> = {};
          const attMap: Record<string, 'present' | 'absent' | null> = {};
          pSnap.docs.forEach(d => {
            const data = d.data();
            const programId = data.program_id as string;
            if (data.participating) map[programId] = true;
            attMap[programId] = (data.attendance as 'present' | 'absent' | null) ?? null;
          });
          setJoined(map);
          setAttendance(attMap);
        }
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [user]);

  const openProgram = async (p: Program) => {
    sounds.click();
    setSelected(p);
    setParticipation(joined[p.id] ?? null);
  };

  const saveParticipation = async () => {
    if (!user || !selected || participation === null) return;
    setJoining(selected.id);
    try {
      const docId = `${user.uid}_${selected.id}`;
      if (participation) {
        await setDoc(doc(db, 'program_participants', docId), {
          user_id: user.uid,
          program_id: selected.id,
          program_title: selected.title,
          participating: true,
          joined_at: new Date().toISOString(),
        });
      } else {
        await deleteDoc(doc(db, 'program_participants', docId));
      }
      setJoined(prev => ({ ...prev, [selected.id]: participation }));
      sounds.success();
      setSelected(null);
    } catch { /* silent */ }
    setJoining(null);
  };

  const active = programs.filter(p => p.status === 'active');
  const expired = programs.filter(p => p.status === 'expired');
  const attended = programs.filter(p => joined[p.id]);

  // ── Participation Modal ──
  if (selected) {
    return (
      <section className="flex flex-col flex-1 h-full overflow-y-auto px-6 pt-6 pb-[100px]"
        style={{ animation: 'fadeIn 0.3s var(--ease-smooth) forwards' }}>
        {/* Back */}
        <button onClick={() => { sounds.click(); setSelected(null); }}
          className="flex items-center gap-2 text-sm mb-6"
          style={{ color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <i className="fa-solid fa-arrow-left" /> Programme Participation
        </button>

        {/* Program card */}
        <div className="glass-card mb-6" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <i className="fa-regular fa-calendar-check" style={{ color: 'var(--color-green)' }} />
            </div>
            <div>
              <h2 className="text-base font-bold mb-1">{selected.title}</h2>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{selected.organizer}</p>
              <div className="flex flex-col gap-1 mt-3">
                <p className="text-xs flex items-center gap-2" style={{ color: 'var(--color-muted)' }}>
                  <i className="fa-regular fa-calendar w-3" /> {fmt(selected.date_start)} – {fmt(selected.date_end)}
                </p>
                <p className="text-xs flex items-center gap-2" style={{ color: 'var(--color-muted)' }}>
                  <i className="fa-solid fa-location-dot w-3" /> {selected.venue}
                </p>
              </div>
            </div>
          </div>
          {selected.description && (
            <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{selected.description}</p>
          )}
        </div>

        {/* Participation choice */}
        <p className="text-base font-semibold mb-4">Will you be participating?</p>
        <div className="flex flex-col gap-3 mb-6">
          {[{ label: "Yes, I'm joining", val: true }, { label: 'No, not this time', val: false }].map(opt => (
            <button key={String(opt.val)} onClick={() => { sounds.click(); setParticipation(opt.val); }}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-medium text-left transition-all"
              style={{
                background: participation === opt.val ? 'rgba(16,185,129,0.1)' : 'var(--color-glass-bg)',
                border: participation === opt.val ? '1.5px solid var(--color-green)' : '1px solid var(--color-glass-border)',
              }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ border: participation === opt.val ? '2px solid var(--color-green)' : '2px solid rgba(255,255,255,0.2)', background: participation === opt.val ? 'var(--color-green)' : 'transparent' }}>
                {participation === opt.val && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="glass-panel rounded-xl px-4 py-3 flex items-start gap-3 mb-8"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <i className="fa-solid fa-shield-halved mt-0.5 text-xs" style={{ color: 'var(--color-green)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Your response is private and used only for programme planning and reporting.
          </p>
        </div>

        <button onClick={saveParticipation} disabled={participation === null || !!joining}
          className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #e06a3a 0%, #c0522a 100%)', boxShadow: '0 4px 20px rgba(224,106,58,0.3)' }}>
          {joining ? 'Saving...' : 'Save participation'}
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col flex-1 h-full overflow-y-auto px-6 pt-6 pb-[100px]"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => { sounds.click(); onBack(); }}
          className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel"
          style={{ color: 'var(--color-muted)' }}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h2 className="text-2xl font-bold">Programs</h2>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-teal-light)', borderTopColor: 'transparent' }} />
        </div>
      ) : programs.length === 0 ? (
        <div className="glass-card text-center py-12">
          <i className="fa-regular fa-calendar text-4xl mb-3 block" style={{ color: 'var(--color-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No programs available yet.</p>
        </div>
      ) : (
        <>
          {/* Active */}
          {active.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>Active</p>
              <div className="flex flex-col gap-3">
                {active.map(p => <ProgramCard key={p.id} program={p} isJoined={!!joined[p.id]} attendance={attendance[p.id]} onClick={() => openProgram(p)} />)}
              </div>
            </div>
          )}

          {/* Attended */}
          {attended.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>Attended</p>
              <div className="flex flex-col gap-3">
                {attended.filter(p => p.status === 'expired').map(p => <ProgramCard key={p.id} program={p} isJoined={true} attendance={attendance[p.id]} onClick={() => openProgram(p)} />)}
              </div>
            </div>
          )}

          {/* Expired */}
          {expired.filter(p => !joined[p.id]).length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>Expired</p>
              <div className="flex flex-col gap-3">
                {expired.filter(p => !joined[p.id]).map(p => <ProgramCard key={p.id} program={p} isJoined={false} attendance={attendance[p.id]} onClick={() => openProgram(p)} />)}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

const ProgramCard: React.FC<{ program: Program; isJoined: boolean; attendance?: 'present' | 'absent' | null; onClick: () => void }> = ({ program, isJoined, attendance, onClick }) => (
  <button onClick={onClick}
    className="glass-card text-left w-full flex items-start gap-4 hover:scale-[1.01] transition-transform active:scale-[0.99]"
    style={{
      background: program.status === 'active' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
      borderColor: program.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
    }}>
    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
      style={{ background: program.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)' }}>
      <i className="fa-regular fa-calendar-check"
        style={{ color: program.status === 'active' ? 'var(--color-green)' : 'var(--color-muted)' }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-bold leading-snug">{program.title}</h3>
        <div className="flex gap-1.5 flex-wrap shrink-0">
          {isJoined && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-green)', border: '1px solid rgba(16,185,129,0.25)' }}>
              Registered
            </span>
          )}
          {attendance === 'present' && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#16A34A', border: '1px solid rgba(16,185,129,0.3)' }}>
              ✓ Present
            </span>
          )}
          {attendance === 'absent' && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.25)' }}>
              ✗ Absent
            </span>
          )}
        </div>
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{program.organizer}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
        {fmt(program.date_start)} – {fmt(program.date_end)} · {program.venue}
      </p>
    </div>
    <i className="fa-solid fa-chevron-right text-[10px] mt-1 shrink-0" style={{ color: 'var(--color-muted)' }} />
  </button>
);

export default ProgramsView;
