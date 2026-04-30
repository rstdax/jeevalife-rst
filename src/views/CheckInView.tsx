import { useState, useCallback } from 'react';
import { sounds } from '../utils/audio';
import { questions } from '../data';

interface CheckInViewProps {
  onBack: () => void;
}

const CheckInView: React.FC<CheckInViewProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const handleOptionClick = useCallback(
    (index: number) => {
      sounds.click();
      setSelectedIndex(index);

      setTimeout(() => {
        if (currentStep < questions.length - 1) {
          setCurrentStep((prev) => prev + 1);
          setSelectedIndex(null);
          setAnimKey((k) => k + 1);
        } else {
          sounds.success();
          setIsComplete(true);
          setTimeout(() => onBack(), 2000);
        }
      }, 400);
    },
    [currentStep, onBack]
  );

  const progressWidth = `${((currentStep + 1) / questions.length) * 100}%`;

  return (
    <section
      id="check-in-view"
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      {/* Header */}
      <header className="flex items-center mb-5">
        <button
          id="btn-back"
          onClick={onBack}
          className="text-white text-xl p-2 bg-transparent border-none cursor-pointer"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className="glass-panel flex-1 h-2 rounded ml-4 overflow-hidden">
          <div
            id="progress-fill"
            className="h-full rounded transition-all duration-400"
            style={{ width: progressWidth, background: 'var(--color-gold)' }}
          />
        </div>
      </header>

      {/* Question Content */}
      <main className="flex flex-col justify-center items-center flex-1">
        {isComplete ? (
          <div className="glass-card text-center py-10 px-6" style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
            <i className="fa-solid fa-check-circle text-6xl mb-5 block" style={{ color: 'var(--color-green)' }} />
            <h2 className="text-2xl font-bold mb-2">Check-in Complete</h2>
            <p style={{ color: 'var(--color-muted)' }}>Your Jeeva Score has been updated.</p>
          </div>
        ) : (
          <div
            key={animKey}
            className="glass-card w-full"
            style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}
          >
            <h2 className="text-2xl font-bold mb-8 text-center">{questions[currentStep].q}</h2>
            <div className="flex flex-col gap-3 w-full">
              {questions[currentStep].opts.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => handleOptionClick(i)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl text-white text-base cursor-pointer transition-all"
                  style={{
                    background: selectedIndex === i ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: selectedIndex === i ? '1px solid var(--color-green)' : '1px solid var(--color-glass-border)',
                    transition: 'all 0.2s var(--ease-spring)',
                  }}
                >
                  <div
                    className="flex justify-center items-center rounded-full text-2xl"
                    style={{ width: 40, height: 40, background: 'rgba(0,0,0,0.2)' }}
                  >
                    {opt.e}
                  </div>
                  <span>{opt.t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </section>
  );
};

export default CheckInView;
