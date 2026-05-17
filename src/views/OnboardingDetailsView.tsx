import React, { useState } from 'react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

interface OnboardingDetailsViewProps {
  onComplete: () => void;
  initialName?: string;
}

const GOALS = ['Stay Hydrated', 'Calm Mind', 'Improve Sleep', 'Boost Energy', 'Weight Management', 'Reduce Stress'];

const OnboardingDetailsView: React.FC<OnboardingDetailsViewProps> = ({ onComplete, initialName = '' }) => {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const { error: err } = await updateProfile({
      name,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      goals: goals.length > 0 ? goals : ['Calm Mind'],
      bio: 'Wellness Explorer',
    });

    setIsSaving(false);
    if (err) { setError('Failed to save. Try again.'); return; }
    sounds.success();
    onComplete();
  };

  return (
    <section className="flex flex-col flex-1 h-full px-6 pt-10 pb-[100px] overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <div className="flex-1 flex flex-col max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-bold mb-2">Almost there!</h1>
        <p className="text-muted text-sm mb-10">Tell us a bit about yourself to personalize your experience.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Display Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent"
              placeholder="Confirm your name" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Age', value: age, set: setAge, suffix: 'yrs', step: '1' },
              { label: 'Height', value: height, set: setHeight, suffix: 'ft', step: '0.1' },
              { label: 'Weight', value: weight, set: setWeight, suffix: 'kg', step: '0.1' },
            ].map(m => (
              <div key={m.label} className="glass-card flex flex-col gap-2 p-3 text-center">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{m.label}</label>
                <div className="flex flex-col items-center gap-1">
                  <input type="number" required min="1" step={m.step} value={m.value} onChange={e => m.set(e.target.value)}
                    className="bg-transparent text-xl font-bold text-white outline-none border-b border-white/20 w-full text-center focus:border-[var(--color-gold)] transition-colors py-1"
                    placeholder="--" />
                  <span className="text-[10px] text-muted">{m.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Daily Goals (Select multiple)</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button type="button" key={g}
                  onClick={() => { sounds.click(); setGoals(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]); }}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 border ${
                    goals.includes(g)
                      ? 'bg-[var(--color-gold,#D4AF37)] border-[var(--color-gold,#D4AF37)] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                      : 'glass-panel border-white/5 text-muted hover:text-white'
                  }`}>{g}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-center" style={{ color: '#EF4444' }}>{error}</p>}

          <button type="submit" disabled={isSaving}
            className="w-full mt-8 py-4 rounded-xl font-bold text-black transition-transform duration-300 transform hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'white', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
            {isSaving ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default OnboardingDetailsView;
