import React, { useState } from 'react';
import { sounds } from '../utils/audio';
import type { ViewId } from '../types';

interface OnboardingViewProps {
  onNavigate: (view: ViewId) => void;
  onGoogleSignUp: () => void;
}

const slides = [
  {
    title: 'Welcome to JeevaLife',
    description: 'Discover your inner peace and build healthy habits that last a lifetime.',
    icon: 'fa-solid fa-leaf',
    color: 'var(--color-green, #4ade80)',
  },
  {
    title: 'Track Your Journey',
    description: 'Monitor your daily hydration, mood, and sleep with beautiful insights.',
    icon: 'fa-solid fa-chart-line',
    color: 'var(--color-blue, #60a5fa)',
  },
  {
    title: 'Gamified Streaks',
    description: 'Stay motivated by unlocking milestones and building unbreakable streaks.',
    icon: 'fa-solid fa-fire',
    color: 'var(--color-gold, #D4AF37)',
  },
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onNavigate, onGoogleSignUp }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    sounds.click();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <section className="flex flex-col flex-1 h-full relative overflow-hidden" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Background Decor */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20 pointer-events-none transition-all duration-1000" 
        style={{ background: slide.color }} 
      />

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center mt-10">
        <div 
          key={currentSlide} 
          className="flex flex-col items-center"
          style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
        >
          <div 
            className="w-32 h-32 rounded-full glass-card flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            style={{ border: `1px solid ${slide.color}40` }}
          >
            <i className={`${slide.icon} text-5xl drop-shadow-lg`} style={{ color: slide.color }} />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 tracking-tight">{slide.title}</h1>
          <p className="text-muted text-base leading-relaxed max-w-[280px]">
            {slide.description}
          </p>
        </div>
      </div>

      <div className="p-8 pb-12 z-10 flex flex-col items-center gap-8">
        {/* Indicators */}
        <div className="flex gap-3">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} 
            />
          ))}
        </div>

        {/* Action Button */}
        {currentSlide < slides.length - 1 ? (
          <button 
            onClick={handleNext}
            className="w-full py-4 rounded-xl font-bold text-lg text-black transition-transform duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            style={{ background: 'white' }}
          >
            Continue
          </button>
        ) : (
          <div className="w-full flex flex-col gap-3 animate-[fadeIn_0.5s_ease-out_forwards]">
            <button 
              onClick={() => { sounds.click(); onNavigate('onboarding-details'); }}
              className="w-full py-3.5 rounded-xl font-bold text-black transition-transform duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              style={{ background: 'white' }}
            >
              <i className="fa-solid fa-phone mr-2 opacity-50" /> Continue with Phone Number
            </button>
            <button 
              onClick={() => { sounds.click(); onGoogleSignUp(); }}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 border border-white/20 transition-transform duration-300 transform hover:scale-[1.02] glass-panel"
            >
              <i className="fa-brands fa-google text-[var(--color-blue, #60a5fa)]" /> Continue with Google
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default OnboardingView;
