import { useState, useCallback, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { questions as staticQuestions } from '../data';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, addDoc, doc, getDoc, updateDoc, setDoc,
  getDocs, query, orderBy, where,
} from 'firebase/firestore';
import { checkAndSendCriticalAlert } from '../utils/whatsapp';
import type { Question } from '../types';

interface CheckInViewProps {
  onBack: () => void;
  onComplete: (score: number, streak: number) => void;
}

const scoreWeights = [20, 15, 10, 5];

function calcScore(answers: number[]): number {
  return answers.reduce((sum, a) => sum + scoreWeights[a], 0);
}

async function updateStreak(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const snap = await getDoc(doc(db, 'streaks', userId));
  if (!snap.exists()) {
    await setDoc(doc(db, 'streaks', userId), {
      user_id: userId, current_streak: 1, longest_streak: 1,
      last_checkin_date: today,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    return 1;
  }
  const data = snap.data();
  if (data.last_checkin_date === today) return data.current_streak;
  const newStreak = data.last_checkin_date === yesterday ? data.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, data.longest_streak);
  await updateDoc(doc(db, 'streaks', userId), {
    current_streak: newStreak, longest_streak: newLongest,
    last_checkin_date: today, updated_at: new Date().toISOString(),
  });
  return newStreak;
}

// ── Notebook / Book component ──────────────────────────────────────────────
interface ReflectionBookProps {
  setOpened: (v: boolean) => void;
}

// ── Full page journal opened state ─────────────────────────────────────────
interface JournalPageProps {
  reflectionText: string;
  setReflectionText: (v: string) => void;
  onDone: (skip: boolean, prompt?: string) => void;
  onBack: () => void;
}

const JournalPage: React.FC<JournalPageProps> = ({ reflectionText, setReflectionText, onDone, onBack }) => {
  const [pageMode, setPageMode] = useState<'Normal' | 'Guided'>('Guided');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const now = new Date();

  return (
    <section className="flex flex-col flex-1 h-full overflow-y-auto absolute inset-0 z-50"
      style={{ 
        background: 'radial-gradient(circle at top right, #1e1b4b 0%, #020617 100%)', 
        animation: 'fadeIn 0.3s ease forwards' 
      }}>

      {/* Header - Glassy */}
      <div className="flex items-center gap-4 px-5 pt-8 pb-5 shrink-0"
        style={{ 
          background: 'rgba(2, 6, 23, 0.4)', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
        <button onClick={onBack}
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
            {now.getDate().toString().padStart(2, '0')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
            {now.toLocaleDateString('en-US', { weekday: 'long' })}, {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Mode toggle - Glass Pill */}
      <div className="mx-5 mt-5 mb-0 flex p-1 rounded-full shrink-0 relative"
        style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)' 
        }}>
        {(['Normal', 'Guided'] as const).map(mode => (
          <button key={mode}
            onClick={() => { setPageMode(mode); setSelectedPrompt(null); setReflectionText(''); }}
            className="flex-1 py-3 rounded-full text-sm font-semibold transition-all duration-300"
            style={{
              background: pageMode === mode ? '#059669' : 'transparent', // Forest deep green accent
              color: pageMode === mode ? '#ffffff' : '#94a3b8',
              boxShadow: pageMode === mode ? '0 2px 16px rgba(5, 150, 105, 0.4)' : 'none',
              textShadow: pageMode === mode ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
            }}>{mode}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-4 overflow-y-auto" style={{ marginTop: 16 }}>
        {pageMode === 'Normal' ? (
          <div>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Write down what's on your mind.</p>
            <textarea
              autoFocus
              className="w-full resize-none placeholder-white/30"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: 16,
                lineHeight: '2.2', minHeight: 300, color: '#f8fafc',
              }}
              placeholder="Today I felt…"
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
            />
          </div>
        ) : selectedPrompt === null ? (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#10b981', border: '1px solid rgba(5, 150, 105, 0.3)' }}>Q&A</div>
              <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>Select a question</span>
            </div>
            {GUIDED_PROMPTS.map((q, i) => (
              <button key={i}
                onClick={() => { setSelectedPrompt(q); setReflectionText(''); }}
                className="w-full text-left py-4 text-sm font-medium flex items-center justify-between transition-colors hover:bg-white/5 rounded-lg px-2 -mx-2"
                style={{
                  color: '#e2e8f0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'transparent', cursor: 'pointer',
                }}>
                <span>{q}</span>
                <i className="fa-solid fa-chevron-right text-xs shrink-0 ml-2" style={{ color: '#10b981', opacity: 0.8 }} />
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedPrompt(null)}
              className="flex items-center gap-1 text-sm mb-4 font-medium transition-colors hover:text-[#34d399]"
              style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>
              <i className="fa-solid fa-chevron-left text-xs" /> Back
            </button>
            <p className="text-base font-bold mb-5 leading-snug" style={{ color: '#f8fafc' }}>{selectedPrompt}</p>
            <div className="p-4 rounded-2xl" 
                 style={{ 
                   background: 'rgba(255, 255, 255, 0.02)', 
                   border: '1px solid rgba(255, 255, 255, 0.05)',
                   boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
                 }}>
              <textarea
                autoFocus
                className="w-full resize-none placeholder-white/30"
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-body)', fontSize: 16,
                  lineHeight: '2.2', minHeight: 250, color: '#f8fafc',
                }}
                placeholder="Write your answer…"
                value={reflectionText}
                onChange={e => setReflectionText(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons - Glassy */}
      <div className="flex gap-3 px-5 pb-[100px] pt-4 shrink-0"
        style={{ 
          background: 'rgba(2, 6, 23, 0.5)', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)' 
        }}>
        <button onClick={() => onDone(true)}
          className="flex-1 py-4 rounded-full font-semibold text-sm transition-colors hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
          Skip
        </button>
        <button onClick={() => {
          const finalText = selectedPrompt
            ? `Q: ${selectedPrompt}\n\nAns: ${reflectionText.trim()}`
            : reflectionText.trim();
          onDone(false, finalText);
        }}
          disabled={!reflectionText.trim()}
          className="flex-[2] py-4 rounded-full font-bold text-white disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
          style={{ 
            background: '#059669', 
            boxShadow: reflectionText.trim() ? '0 4px 20px rgba(5, 150, 105, 0.4)' : 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
          Complete <i className="fa-solid fa-circle-check text-sm" />
        </button>
      </div>
    </section>
  );
};

const GUIDED_PROMPTS = [
  'Was I kind to myself today?',
  'Did I smile today? What made me smile?',
  'Did I help make someone\'s day better?',
  'What am I grateful for today?',
  'How did I deal with unexpected circumstances today?',
  'What drained my energy today?',
  'What made me feel proud today?',
];

const ReflectionBook: React.FC<ReflectionBookProps> = ({ setOpened }) => {
  return (
    <div className="w-full flex flex-col items-center"
      style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
      <div className="relative w-full" style={{ maxWidth: 320 }}>
        <div className="rounded-2xl overflow-visible relative cursor-pointer"
          style={{
            marginLeft: 14,
            background: 'url(/notebook-cover.jpeg) center/cover no-repeat',
            border: '1px solid rgba(16, 185, 129, 0.3)', // Changed to green theme
            boxShadow: '6px 6px 30px rgba(0,0,0,0.4)',
            minHeight: 380,
            borderRadius: 20,
          }}
          onClick={() => { sounds.click(); setOpened(true); }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20, zIndex: 1,
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.2) 0%, rgba(2, 6, 23, 0.4) 60%, transparent 100%)', // Changed to dark/green gradient
            pointerEvents: 'none',
          }} />
          <div className="absolute top-4 right-4 px-3 py-1 rounded-lg text-sm font-bold"
            style={{ background: 'rgba(5, 150, 105, 0.85)', color: '#ffffff', zIndex: 2, backdropFilter: 'blur(4px)' }}>
            {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main CheckInView ───────────────────────────────────────────────────────
const CheckInView: React.FC<CheckInViewProps> = ({ onBack, onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [savedAnswers, setSavedAnswers] = useState<number[]>([]);
  const [reflectionOpened, setReflectionOpened] = useState(false);

  // Load questions from Firestore, fall back to static
  const [questions, setQuestions] = useState<Question[]>(staticQuestions);
  useEffect(() => {
    getDocs(query(
      collection(db, 'checkin_questions'),
      where('active', '==', true),
      orderBy('order', 'asc')
    )).then(snap => {
      if (!snap.empty) {
        setQuestions(snap.docs.map(d => {
          const data = d.data();
          return { q: data.q, opts: data.opts } as Question;
        }));
      }
    }).catch(() => { /* use static fallback */ });
  }, []);

  const saveCheckin = useCallback(async (newAnswers: number[], reflectionNote?: string) => {
    if (!user) { sounds.success(); setIsComplete(true); setIsSaving(false); setTimeout(() => onBack(), 2500); return; }
    const score = calcScore(newAnswers);
    setFinalScore(score);
    await addDoc(collection(db, 'checkins'), {
      user_id: user.uid,
      mood: newAnswers[0], energy: newAnswers[1],
      stress: newAnswers[2], sleep: newAnswers[3],
      focus: newAnswers[4] ?? 0,
      jeeva_score: score,
      created_at: new Date().toISOString(),
      alert_sent: false,
    });
    if (reflectionNote?.trim()) {
      await addDoc(collection(db, 'journal_entries'), {
        user_id: user.uid,
        text: reflectionNote.trim(),
        created_at: new Date().toISOString(),
      });
    }
    const streak = await updateStreak(user.uid);
    if (score <= 25) checkAndSendCriticalAlert(user.uid);
    sounds.success();
    setIsComplete(true);
    setIsSaving(false);
    setTimeout(() => { onComplete(score, streak); onBack(); }, 2500);
  }, [user, onBack, onComplete]);

  const handleOption = useCallback((index: number) => {
    sounds.click();
    setSelected(index);
    const newAnswers = [...answers, index];
    setTimeout(() => {
      if (step < questions.length - 1) {
        setAnswers(newAnswers);
        setStep(s => s + 1);
        setSelected(null);
        setAnimKey(k => k + 1);
      } else {
        setSavedAnswers(newAnswers);
        setSelected(null);
        setShowReflection(true);
      }
    }, 400);
  }, [step, answers]);

  const handleReflectionDone = useCallback(async (skip: boolean, formattedText?: string) => {
    setIsSaving(true);
    setShowReflection(false);
    await saveCheckin(savedAnswers, skip ? undefined : (formattedText ?? reflectionText));
  }, [savedAnswers, reflectionText, saveCheckin]);

  const progress = `${((step + 1) / questions.length) * 100}%`;
  const q = questions[step];

  return (
    <>
    {/* Journal page — full section when opened */}
    {showReflection && reflectionOpened && (
      <JournalPage
        reflectionText={reflectionText}
        setReflectionText={setReflectionText}
        onDone={handleReflectionDone}
        onBack={() => setReflectionOpened(false)}
      />
    )}
    <section id="check-in-view" className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards', display: showReflection && reflectionOpened ? 'none' : undefined }}>
      <header className="flex items-center mb-5">
        <button onClick={onBack} className="text-white text-xl p-2 bg-transparent border-none cursor-pointer">
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className="glass-panel flex-1 h-2 rounded ml-4 overflow-hidden">
          <div className="h-full rounded transition-all duration-400"
            style={{ width: showReflection || isComplete ? '100%' : progress, background: 'var(--color-gold)' }} />
        </div>
      </header>

      <main className="flex flex-col justify-center items-center flex-1">
        {isComplete ? (
          <div className="glass-card text-center py-10 px-6"
            style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
            <i className="fa-solid fa-check-circle text-6xl mb-5 block" style={{ color: 'var(--color-green)' }} />
            <h2 className="text-2xl font-bold mb-2">Check-in Complete</h2>
            <p style={{ color: 'var(--color-muted)' }}>
              Your Jeeva Score: <span className="font-bold text-white text-xl">{finalScore}</span>
            </p>
          </div>
        ) : isSaving ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--color-muted)' }}>Saving...</p>
          </div>
        ) : showReflection ? (
          <ReflectionBook
            setOpened={setReflectionOpened}
          />
        ) : q ? (
          <div key={animKey} className="glass-card w-full"
            style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
            <h2 className="text-2xl font-bold mb-8 text-center">{q.q}</h2>
            <div className="flex flex-col gap-3 w-full">
              {q.opts.map((opt, i) => (
                <div key={i} onClick={() => handleOption(i)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white text-base cursor-pointer"
                  style={{
                    background: selected === i ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                    border: selected === i ? '1px solid var(--color-green)' : '1px solid var(--color-glass-border)',
                    transition: 'all 0.2s var(--ease-spring)',
                  }}>
                  <div className="flex justify-center items-center rounded-full text-2xl"
                    style={{ width: 40, height: 40, background: 'rgba(0,0,0,0.2)' }}>{opt.e}</div>
                  <span>{opt.t}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </section>
    </>
  );
};

export default CheckInView;