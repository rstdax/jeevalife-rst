import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface OnboardingDetailsViewProps {
  onComplete: () => void;
  initialName?: string;
}

const OnboardingDetailsView: React.FC<OnboardingDetailsViewProps> = ({ onComplete, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  const availableGoals = [
    'Stay Hydrated', 
    'Calm Mind', 
    'Improve Sleep', 
    'Boost Energy', 
    'Weight Management', 
    'Reduce Stress'
  ];

  const toggleGoal = (goal: string) => {
    sounds.click();
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.success();
    onComplete();
  };

  return (
    <section className="flex flex-col flex-1 h-full px-6 pt-10 pb-[100px] overflow-y-auto" style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <div className="flex-1 flex flex-col max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-bold mb-2">Almost there!</h1>
        <p className="text-muted text-sm mb-10">Tell us a bit about yourself to personalize your experience.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Display Name</label>
            <input 
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent"
              placeholder="Confirm your name"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Age', value: age, set: setAge, suffix: 'yrs' },
              { label: 'Height', value: height, set: setHeight, suffix: 'cm' },
              { label: 'Weight', value: weight, set: setWeight, suffix: 'kg' },
            ].map((metric) => (
              <div key={metric.label} className="glass-card flex flex-col gap-2 p-3 text-center transition-all duration-300 focus-within:border-white/40 focus-within:bg-white/5 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{metric.label}</label>
                <div className="flex flex-col items-center gap-1">
                  <input 
                    type="number"
                    required
                    min="1"
                    value={metric.value} 
                    onChange={(e) => metric.set(e.target.value)}
                    className="bg-transparent text-xl font-bold text-white outline-none border-b border-white/20 w-full text-center focus:border-[var(--color-gold)] transition-colors py-1"
                    placeholder="--"
                  />
                  <span className="text-[10px] text-muted">{metric.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Daily Goals (Select multiple)</label>
            <div className="flex flex-wrap gap-2">
              {availableGoals.map((g) => {
                const isActive = goals.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGoal(g)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 border ${
                      isActive 
                      ? 'bg-[var(--color-gold, #D4AF37)] border-[var(--color-gold, #D4AF37)] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                      : 'glass-panel border-white/5 text-muted hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-8 py-4 rounded-xl font-bold text-black transition-transform duration-300 transform hover:scale-[1.02]"
            style={{ background: 'white', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}
          >
            Complete Profile
          </button>
        </form>
      </div>
    </section>
  );
};

export default OnboardingDetailsView;
