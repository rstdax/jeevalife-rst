import React, { useState } from 'react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

interface OnboardingDetailsViewProps {
  onComplete: () => void;
  initialName?: string;
}

const GOALS = ['Stay Hydrated', 'Calm Mind', 'Improve Sleep', 'Boost Energy', 'Weight Management', 'Reduce Stress'];

// Height helpers
const feetInchesToCm = (ft: number, inch: number) => (ft * 30.48) + (inch * 2.54);
const cmToFeetInches = (cm: number) => {
  const totalInches = cm / 2.54;
  return { ft: Math.floor(totalInches / 12), inch: Math.round(totalInches % 12) };
};

// Weight helpers
const lbsToKg = (lbs: number) => lbs * 0.453592;
const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

const OnboardingDetailsView: React.FC<OnboardingDetailsViewProps> = ({ onComplete, initialName = '' }) => {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState('');

  // Height state
  const [heightUnit, setHeightUnit] = useState<'ft' | 'cm'>('ft');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Weight state
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [weightKg, setWeightKg] = useState('');
  const [weightLbs, setWeightLbs] = useState('');

  const [goals, setGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Convert height to cm for storage
  const getHeightCm = (): number => {
    if (heightUnit === 'ft') {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      return feetInchesToCm(ft, inch);
    }
    return parseFloat(heightCm) || 0;
  };

  // Convert weight to kg for storage
  const getWeightKg = (): number => {
    if (weightUnit === 'kg') return parseFloat(weightKg) || 0;
    return lbsToKg(parseFloat(weightLbs) || 0);
  };

  const handleHeightUnitSwitch = (unit: 'ft' | 'cm') => {
    if (unit === heightUnit) return;
    if (unit === 'cm' && (heightFt || heightIn)) {
      const cm = feetInchesToCm(parseFloat(heightFt) || 0, parseFloat(heightIn) || 0);
      setHeightCm(cm > 0 ? Math.round(cm).toString() : '');
    } else if (unit === 'ft' && heightCm) {
      const { ft, inch } = cmToFeetInches(parseFloat(heightCm) || 0);
      setHeightFt(ft > 0 ? ft.toString() : '');
      setHeightIn(inch > 0 ? inch.toString() : '');
    }
    setHeightUnit(unit);
  };

  const handleWeightUnitSwitch = (unit: 'kg' | 'lbs') => {
    if (unit === weightUnit) return;
    if (unit === 'lbs' && weightKg) {
      setWeightLbs(kgToLbs(parseFloat(weightKg) || 0).toString());
    } else if (unit === 'kg' && weightLbs) {
      setWeightKg((lbsToKg(parseFloat(weightLbs) || 0)).toFixed(1));
    }
    setWeightUnit(unit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const heightVal = getHeightCm();
    const weightVal = getWeightKg();

    if (heightVal <= 0 || weightVal <= 0) {
      setError('Please enter valid height and weight.');
      setIsSaving(false);
      return;
    }

    const { error: err } = await updateProfile({
      name,
      age: parseInt(age),
      height: heightVal,
      weight: weightVal,
      goals: goals.length > 0 ? goals : ['Calm Mind'],
      bio: 'Wellness Explorer',
    });

    setIsSaving(false);
    if (err) { setError('Failed to save. Try again.'); return; }
    sounds.success();
    onComplete();
  };

  return (
    <section className="flex flex-col flex-1 h-full pt-10 overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards', paddingLeft: 'clamp(16px, 4vw, 24px)', paddingRight: 'clamp(16px, 4vw, 24px)', paddingBottom: 'calc(clamp(85px, 14vw, 100px) + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex-1 flex flex-col max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-bold mb-2">Almost there!</h1>
        <p className="text-muted text-sm mb-10">Tell us a bit about yourself to personalize your experience.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Display Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent"
              placeholder="Confirm your name" />
          </div>

          {/* Age */}
          <div className="glass-card flex flex-col gap-2 p-4">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Age</label>
            <div className="flex items-baseline gap-2">
              <input type="number" required min="1" max="120" step="1" value={age} onChange={e => setAge(e.target.value)}
                className="bg-transparent text-2xl font-bold text-white outline-none border-b border-white/20 w-24 text-center focus:border-[var(--color-gold)] transition-colors py-1"
                placeholder="--" />
              <span className="text-sm text-muted">years</span>
            </div>
          </div>

          {/* Height */}
          <div className="glass-card flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Height</label>
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                {(['ft', 'cm'] as const).map(u => (
                  <button key={u} type="button" onClick={() => handleHeightUnitSwitch(u)}
                    className="px-3 py-1 text-xs font-bold transition-all"
                    style={{
                      background: heightUnit === u ? 'var(--color-teal-light)' : 'transparent',
                      color: heightUnit === u ? 'white' : 'var(--color-muted)',
                    }}>{u}</button>
                ))}
              </div>
            </div>
            {heightUnit === 'ft' ? (
              <div className="flex items-baseline gap-4">
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={heightFt}
                    onChange={e => {
                      const val = e.target.value;
                      // If user types something like "5.8", auto-split into ft + inches
                      if (val.includes('.')) {
                        const [ftPart, inPart] = val.split('.');
                        setHeightFt(ftPart);
                        // "8" → 8 inches, "10" → 10 inches (cap at 11)
                        const inches = Math.min(parseInt(inPart || '0'), 11);
                        setHeightIn(isNaN(inches) ? '' : inches.toString());
                      } else {
                        setHeightFt(val);
                      }
                    }}
                    className="bg-transparent text-2xl font-bold text-white outline-none border-b border-white/20 w-16 text-center focus:border-[var(--color-gold)] transition-colors py-1"
                    placeholder="--"
                  />
                  <span className="text-xs text-muted">ft</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={heightIn}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      const n = parseInt(v);
                      setHeightIn(isNaN(n) ? '' : Math.min(n, 11).toString());
                    }}
                    className="bg-transparent text-2xl font-bold text-white outline-none border-b border-white/20 w-16 text-center focus:border-[var(--color-gold)] transition-colors py-1"
                    placeholder="--"
                  />
                  <span className="text-xs text-muted">in</span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <input type="number" min="50" max="300" step="1" value={heightCm} onChange={e => setHeightCm(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-white outline-none border-b border-white/20 w-24 text-center focus:border-[var(--color-gold)] transition-colors py-1"
                  placeholder="--" />
                <span className="text-sm text-muted">cm</span>
              </div>
            )}
          </div>

          {/* Weight */}
          <div className="glass-card flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Weight</label>
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                {(['kg', 'lbs'] as const).map(u => (
                  <button key={u} type="button" onClick={() => handleWeightUnitSwitch(u)}
                    className="px-3 py-1 text-xs font-bold transition-all"
                    style={{
                      background: weightUnit === u ? 'var(--color-teal-light)' : 'transparent',
                      color: weightUnit === u ? 'white' : 'var(--color-muted)',
                    }}>{u}</button>
                ))}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              {weightUnit === 'kg' ? (
                <>
                  <input type="number" min="1" max="500" step="0.1" value={weightKg} onChange={e => setWeightKg(e.target.value)}
                    className="bg-transparent text-2xl font-bold text-white outline-none border-b border-white/20 w-24 text-center focus:border-[var(--color-gold)] transition-colors py-1"
                    placeholder="--" />
                  <span className="text-sm text-muted">kg</span>
                </>
              ) : (
                <>
                  <input type="number" min="1" max="1100" step="0.1" value={weightLbs} onChange={e => setWeightLbs(e.target.value)}
                    className="bg-transparent text-2xl font-bold text-white outline-none border-b border-white/20 w-24 text-center focus:border-[var(--color-gold)] transition-colors py-1"
                    placeholder="--" />
                  <span className="text-sm text-muted">lbs</span>
                </>
              )}
            </div>
          </div>

          {/* Goals */}
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
