import { useMemo, useState, useEffect, useCallback } from 'react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, query, where, orderBy, limit, getDocs, deleteDoc, doc,
  startAfter, type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import JournalWriteView from './JournalWriteView';

const PAGE_SIZE = 5;

interface JournalEntry {
  id: string;
  text: string;
  created_at: string;
}

interface CheckinMood {
  mood: number;
  created_at: string;
}

const moodEmoji = ['✨', '😊', '😔', '😤'];
const moodClass = ['excellent', '', 'low', 'low'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PROMPTS = [
  'What are you grateful for today?',
  'What made you smile today?',
  'What challenged you today?',
  'How did you take care of yourself today?',
  'What do you want to remember about today?',
];

const JournalView: React.FC = () => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [checkinMoods, setCheckinMoods] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Popup states
  const [showWritePage, setShowWritePage] = useState(false);
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null);
  const [activePrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const fetchEntries = useCallback(async (after?: QueryDocumentSnapshot<DocumentData>) => {
    if (!user) return;
    const q = after
      ? query(collection(db, 'journal_entries'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), startAfter(after), limit(PAGE_SIZE))
      : query(collection(db, 'journal_entries'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(PAGE_SIZE));
    const snap = await getDocs(q);
    const newEntries = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
    setEntries(prev => after ? [...prev, ...newEntries] : newEntries);
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (!user) return;
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`;
    const q = query(
      collection(db, 'checkins'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
    );
    getDocs(q).then(snap => {
      const map: Record<string, number> = {};
      snap.docs.forEach(d => {
        const data = d.data() as CheckinMood;
        if (data.created_at >= from && data.created_at <= to) {
          const day = new Date(data.created_at).getDate().toString();
          map[day] = data.mood;
        }
      });
      setCheckinMoods(map);
    });
  }, [user, selectedDate]);

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; emoji: string; cls: string }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const isFuture = (year > currentYear) ||
        (year === currentYear && month > currentMonth) ||
        (year === currentYear && month === currentMonth && i > new Date().getDate());
      const moodIndex = checkinMoods[i.toString()];
      const emoji = isFuture ? '' : moodIndex !== undefined ? moodEmoji[moodIndex] : '';
      const cls = moodIndex !== undefined ? moodClass[moodIndex] : isFuture ? '' : 'empty';
      days.push({ day: i, emoji, cls });
    }
    return days;
  }, [selectedDate, currentMonth, currentYear, checkinMoods]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    setIsDeleting(id);
    sounds.click();
    await deleteDoc(doc(db, 'journal_entries', id));
    setEntries(prev => prev.filter(e => e.id !== id));
    setIsDeleting(null);
    if (readingEntry?.id === id) setReadingEntry(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getDate() - d.getDate();
    const sameMonth = now.getMonth() === d.getMonth() && now.getFullYear() === d.getFullYear();
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (sameMonth && diff === 0) return `Today, ${time}`;
    if (sameMonth && diff === 1) return `Yesterday, ${time}`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${time}`;
  };

  return (
    <>
      {showWritePage && (
        <JournalWriteView
          onBack={() => setShowWritePage(false)}
          onSaved={() => {
            setLastDoc(null);
            setHasMore(false);
            fetchEntries();
          }}
        />
      )}

      {/* ── Individual Reading View (Matches Screenshot Style) ── */}
      {readingEntry && (
        <section className="absolute inset-0 z-50 flex flex-col overflow-hidden"
          style={{ 
            background: 'radial-gradient(circle at top right, #1e1b4b 0%, #020617 100%)', // Deep dark blue base
            animation: 'fadeIn 0.3s ease forwards' 
          }}>
          
          {/* Header - Glassy */}
          <div className="flex items-center justify-between px-5 pt-8 pb-5 shrink-0"
            style={{ 
              background: 'rgba(2, 6, 23, 0.4)', 
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
            <div className="flex items-center gap-4">
              <button onClick={() => { sounds.click(); setReadingEntry(null); }}
                className="w-9 h-9 flex items-center justify-center rounded-full shrink-0"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                <i className="fa-solid fa-arrow-left text-sm" />
              </button>
              <div>
                <p className="text-2xl font-bold leading-none" style={{ color: '#f8fafc' }}>
                  {new Date(readingEntry.created_at).getDate().toString().padStart(2, '0')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  {new Date(readingEntry.created_at).toLocaleDateString('en-US', { weekday: 'long' })}, {new Date(readingEntry.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this reflection?")) {
                  handleDelete(readingEntry.id);
                }
              }} 
              disabled={isDeleting === readingEntry.id}
              className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 transition-colors"
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
              {isDeleting === readingEntry.id
                ? <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                : <i className="fa-solid fa-trash-can text-sm" />}
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 px-6 pt-8 pb-[120px] overflow-y-auto">
            {readingEntry.text.startsWith('Q:') ? (
              <div className="flex flex-col gap-5">
                {readingEntry.text.split('\n\n').map((part, i) => (
                  <p key={i} className="whitespace-pre-wrap leading-relaxed" style={{
                    color: i === 0 ? '#059669' : '#f8fafc', // Green for Q, White for A
                    fontWeight: i === 0 ? 600 : 400,
                    fontSize: i === 0 ? '1.1rem' : '1rem',
                  }}>{part}</p>
                ))}
              </div>
            ) : (
              <p className="text-[1.05rem] leading-[1.8] whitespace-pre-wrap" style={{ color: '#f8fafc' }}>
                {readingEntry.text}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Main Journal View ── */}
      <section id="journal-view" className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
        style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards', display: (showWritePage || readingEntry) ? 'none' : undefined }}>
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Your Journey</h2>
        </header>

        <main>
          {/* Mood Calendar */}
          <div className="glass-card mb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold">Mood Calendar</h3>
              <button onClick={() => { sounds.click(); setIsExpanded(p => !p); }}
                className="bg-transparent border-none font-semibold text-xs cursor-pointer px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: 'var(--color-gold)' }}>
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            <div className="flex items-center justify-between glass-panel p-2 rounded-xl mb-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <button onClick={() => { sounds.click(); setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }}
                className="w-8 h-8 flex justify-center items-center rounded-lg hover:bg-white/5 text-muted transition-colors">
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold tracking-tight">
                  {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </span>
                {(selectedDate.getMonth() !== currentMonth || selectedDate.getFullYear() !== currentYear) && (
                  <button onClick={() => { sounds.click(); setSelectedDate(new Date()); }}
                    className="text-[10px] uppercase tracking-widest font-bold mt-0.5"
                    style={{ color: 'var(--color-gold)' }}>Go to Today</button>
                )}
              </div>
              <button onClick={() => { sounds.click(); setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }}
                className="w-8 h-8 flex justify-center items-center rounded-lg hover:bg-white/5 text-muted transition-colors">
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {calendarDays.map((day, i) => {
                if (!isExpanded && i >= 14) return null;
                let bg = 'rgba(255,255,255,0.05)';
                let border = 'var(--color-glass-border)';
                let opacity = 1;
                if (day.cls === 'excellent') { bg = 'rgba(16,185,129,0.2)'; border = 'var(--color-green)'; }
                else if (day.cls === 'low') { bg = 'rgba(239,68,68,0.2)'; border = '#EF4444'; }
                else if (day.cls === 'empty') { opacity = 0.3; }
                return (
                  <div key={day.day} className="flex flex-col items-center gap-1">
                    {isExpanded && <span className="text-[0.65rem]" style={{ color: 'var(--color-muted)' }}>{day.day}</span>}
                    <div className="w-full aspect-square rounded-full flex justify-center items-center text-lg"
                      style={{ background: bg, border: `1px solid ${border}`, opacity }}>
                      {day.emoji}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-xs" style={{ color: 'var(--color-muted)' }}>
              <span className="flex items-center gap-1"><span>✨</span> Radiant</span>
              <span className="flex items-center gap-1"><span>😊</span> Content</span>
              <span className="flex items-center gap-1"><span>😔</span> Low</span>
              <span className="flex items-center gap-1"><span>😤</span> Disturbed</span>
            </div>
          </div>

          {/* Journaling Prompt card */}
          <div className="glass-card mb-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => { sounds.click(); setShowWritePage(true); }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(212,175,55,0.12)' }}>
                <i className="fa-solid fa-pen-to-square text-sm" style={{ color: 'var(--color-gold)' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Journaling Prompt</h3>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{activePrompt}</p>
              </div>
              <i className="fa-solid fa-chevron-right text-xs ml-auto" style={{ color: 'var(--color-muted)' }} />
            </div>
            <div className="w-full rounded-xl px-4 py-3"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--color-glass-border)',
                minHeight: 60,
                color: 'var(--color-muted)',
                fontSize: 14,
              }}>
              Write your thoughts here...
            </div>
          </div>

          {/* Reflections */}
          <h3 className="text-base font-semibold mb-4 mt-6">Reflections</h3>
          {entries.length === 0 ? (
            <div className="glass-card text-center py-8">
              <i className="fa-solid fa-book-open text-3xl mb-3 block" style={{ color: 'var(--color-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No reflections yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Tap Write or complete a check-in</p>
            </div>
          ) : (
            <div id="journal-list" className="flex flex-col gap-6 pl-5 pb-8"
              style={{ borderLeft: '2px solid var(--color-glass-border)' }}>
              {entries.map(entry => (
                <div key={entry.id} className="log-item relative">
                  {/* Timeline Dot Indicator */}
                  <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full" 
                       style={{ background: 'var(--color-teal)', boxShadow: '0 0 10px var(--color-teal)' }} />

                  {/* Date Header (Removed Delete Button) */}
                  <div className="mb-2 pl-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-gold)' }}>{formatDate(entry.created_at)}</span>
                  </div>

                  {/* Clickable Note Preview */}
                  <div 
                    onClick={() => { sounds.click(); setReadingEntry(entry); }}
                    className="p-4 rounded-xl text-sm leading-relaxed flex items-center justify-between cursor-pointer group transition-all duration-300"
                    style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)' }}>
                    
                    <div className="flex-1 overflow-hidden pr-4">
                      {entry.text.startsWith('Q:') ? (
                        <div className="flex flex-col gap-1">
                          {entry.text.split('\n\n').map((part, i) => (
                            <span key={i} className="line-clamp-1" style={{
                              color: i === 0 ? 'var(--color-teal-light)' : '#D1D5DB',
                              fontWeight: i === 0 ? 600 : 400,
                              display: 'block',
                            }}>{part}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="line-clamp-2 text-[#D1D5DB]">
                          {entry.text}
                        </div>
                      )}
                    </div>

                    <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
                      <i className="fa-solid fa-chevron-right text-[10px] text-white/40 group-hover:text-white/80 transition-colors" />
                    </div>

                  </div>
                </div>
              ))}

              {/* See More button */}
              {hasMore && (
                <button
                  onClick={async () => {
                    if (!lastDoc || loadingMore) return;
                    setLoadingMore(true);
                    await fetchEntries(lastDoc);
                    setLoadingMore(false);
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 mt-2"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--color-glass-border)',
                    color: 'var(--color-gold)',
                  }}>
                  {loadingMore
                    ? <><i className="fa-solid fa-circle-notch fa-spin text-xs" /> Loading...</>
                    : <><i className="fa-solid fa-chevron-down text-xs" /> See More</>}
                </button>
              )}
            </div>
          )}
        </main>
      </section>
    </>
  );
};

export default JournalView;