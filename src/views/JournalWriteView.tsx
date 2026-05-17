import { useState } from 'react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const GUIDED_PROMPTS = [
  'Was I kind to myself today?',
  'Did I smile today? What made me smile?',
  'Did I help make someone\'s day better?',
  'What am I grateful for today?',
  'How did I deal with unexpected circumstances today?',
  'What drained my energy today?',
  'What made me feel proud today?',
];

interface JournalWriteViewProps {
  onBack: () => void;
  onSaved?: () => void;
}

const JournalWriteView: React.FC<JournalWriteViewProps> = ({ onBack, onSaved }) => {
  const { user } = useAuth();
  const [pageMode, setPageMode] = useState<'Normal' | 'Guided'>('Normal');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const now = new Date();

  const handleSave = async () => {
    if (!user || !text.trim()) return;
    setIsSaving(true);
    sounds.click();
    const finalText = selectedPrompt
      ? `Q: ${selectedPrompt}\n\nAns: ${text.trim()}`
      : text.trim();
    const { error } = await (async () => {
      try {
        await addDoc(collection(db, 'journal_entries'), {
          user_id: user.uid,
          text: finalText,
          created_at: new Date().toISOString(),
        });
        return { error: null };
      } catch (e: unknown) {
        return { error: (e as Error).message };
      }
    })();
    setIsSaving(false);
    if (!error) {
      sounds.success();
      onSaved?.();
      onBack();
    }
  };

  return (
    <section className="flex flex-col flex-1 h-full overflow-y-auto"
      style={{ 
        background: 'radial-gradient(circle at top right, #1e1b4b 0%, #020617 100%)', // Original deep dark blue base
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
            onClick={() => { setPageMode(mode); setSelectedPrompt(null); setText(''); }}
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
              value={text}
              onChange={e => setText(e.target.value)}
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
                onClick={() => { setSelectedPrompt(q); setText(''); }}
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
              className="flex items-center gap-1 text-sm mb-4 font-medium"
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
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom button - Glassy */}
      <div className="px-5 pb-[100px] pt-4 shrink-0"
        style={{ 
          background: 'rgba(2, 6, 23, 0.5)', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)' 
        }}>
        <button onClick={handleSave}
          disabled={isSaving || !text.trim()}
          className="w-full py-4 rounded-full font-bold text-white disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
          style={{ 
            background: '#059669', // Forest deep green button
            boxShadow: (!isSaving && text.trim()) ? '0 4px 20px rgba(5, 150, 105, 0.4)' : 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
          {isSaving
            ? <i className="fa-solid fa-circle-notch fa-spin" />
            : <><i className="fa-solid fa-floppy-disk text-sm" /> Save Entry</>}
        </button>
      </div>
    </section>
  );
};

export default JournalWriteView;