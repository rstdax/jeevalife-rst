import React, { useState } from 'react';
import { sounds } from '../utils/audio';
import type { ViewId } from '../types';

interface OnboardingViewProps {
  onNavigate: (view: ViewId) => void;
  onGoogleSignUp: () => void;
}

const slides = [
  {
    title: 'Find Your Center',
    description: 'Discover inner peace and build healthy habits that last a lifetime with daily guided reflections.',
    badge: 'fa-solid fa-leaf',
    accent: '#10b981', // Emerald Green
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop', 
  },
  {
    title: 'Track Your Journey',
    description: 'Monitor your daily hydration, mood, and sleep with beautiful, actionable insights.',
    badge: 'fa-solid fa-chart-pie',
    accent: '#3b82f6', // Blue
    image: 'https://img.freepik.com/premium-photo/scenic-road-mountains-travel-background-man-going-sunrise-background_328046-13312.jpg?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Build Unbreakable Streaks',
    description: 'Stay motivated by unlocking milestones and watching your personal growth compound over time.',
    badge: 'fa-solid fa-fire-flame-curved',
    accent: '#f59e0b', // Amber/Gold
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
  },
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onNavigate, onGoogleSignUp }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = () => {
    if (isTransitioning) return;
    sounds.click();
    if (currentSlide < slides.length - 1) {
      setIsTransitioning(true);
      setCurrentSlide(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  };

  const slide = slides[currentSlide];

  return (
    <>
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes revealUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal {
          animation: revealUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* FIX: Changed to `fixed inset-0` to guarantee it covers 100% of the device screen, 
        ignoring any parent container constraints that were causing the cutoff. 
      */}
      <section className="fixed inset-0 flex flex-col w-full overflow-hidden bg-[#070b14] z-[100]">
        
        {/* ── 1. Background Layer ── */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {slides.map((s, i) => (
            <div 
              key={i}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ 
                opacity: currentSlide === i ? 1 : 0, 
                zIndex: currentSlide === i ? 1 : 0 
              }}
            >
              {/* Image covers the entire absolute container */}
              <img 
                src={s.image} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ 
                  animation: currentSlide === i ? 'kenBurns 20s ease-out forwards' : 'none',
                  filter: 'brightness(0.6) contrast(1.1)'
                }}
              />
            </div>
          ))}
          
          {/* ── Smooth Gradient Overlay ── */}
          <div 
            className="absolute inset-0 z-10" 
            style={{ 
              // Solid dark at the bottom 15%, fading smoothly to completely transparent at 70% height
              background: 'linear-gradient(to top, #070b14 0%, #070b14 15%, rgba(7, 11, 20, 0.8) 35%, transparent 70%)' 
            }} 
          />
        </div>

        {/* ── 2. Content Layout (Flex Column) ── */}
        <div className="relative z-20 flex flex-col h-full w-full mx-auto" style={{ maxWidth: 'min(450px, 100vw)', paddingLeft: 'clamp(20px, 5vw, 28px)', paddingRight: 'clamp(20px, 5vw, 28px)', paddingTop: 'clamp(48px, 10vh, 80px)', paddingBottom: 'clamp(24px, 4vh, 40px)' }}>
          
          {/* Top Half: Floating Badge */}
          <div className="flex-1 flex flex-col items-center justify-start pt-10">
            <div 
              key={`badge-${currentSlide}`}
              className="relative flex items-center justify-center"
              style={{ 
                width: 'min(128px, 30vw)', height: 'min(128px, 30vw)',
                borderRadius: 'clamp(1.5rem, 5vw, 2.5rem)',
                animation: 'floatBadge 4s ease-in-out infinite, revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `0 20px 40px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.05)`
              }}
            >
              <i className={`${slide.badge} text-[3.5rem]`} style={{ 
                background: `linear-gradient(135deg, #ffffff 0%, ${slide.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 4px 10px ${slide.accent}40)`
              }} />
            </div>
          </div>

          {/* Bottom Half: Text, Dots, and Buttons */}
          <div className="w-full flex flex-col mt-auto shrink-0 pb-safe">
            
            {/* Animated Text Block */}
            <div key={`text-${currentSlide}`} className="flex flex-col animate-reveal">
              <h1 className="leading-tight font-extrabold text-white mb-3 tracking-tight" style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)' }}>
                {slide.title}
              </h1>
              <p className="text-gray-300 text-base leading-[1.6] mb-6 drop-shadow-md">
                {slide.description}
              </p>
            </div>

            {/* Progress Indicators */}
            <div className="flex gap-2 mb-10 items-center">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className="h-1.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ 
                    width: i === currentSlide ? 28 : 8, 
                    background: i === currentSlide ? '#10b981' : 'rgba(255,255,255,0.2)'
                  }} 
                />
              ))}
            </div>

            {/* Action Buttons - Anchored to bottom */}
            <div className="w-full min-h-[56px] flex flex-col justify-end">
              {currentSlide < slides.length - 1 ? (
                <button 
                  onClick={handleNext}
                  className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ 
                    background: '#10b981', 
                    boxShadow: '0 4px 20px rgba(16,185,129,0.2)' 
                  }}
                >
                  Continue <i className="fa-solid fa-arrow-right text-sm ml-1 opacity-90" />
                </button>
              ) : (
                <div key="auth-buttons" className="w-full flex flex-col gap-3 animate-reveal">
                  <button 
                    onClick={() => { sounds.click(); onNavigate('phone-sign-in'); }}
                    className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ 
                      background: '#10b981', 
                      boxShadow: '0 4px 20px rgba(16,185,129,0.2)' 
                    }}
                  >
                    <i className="fa-solid fa-phone" /> Continue with Phone
                  </button>
                  <button 
                    onClick={() => { sounds.click(); onGoogleSignUp(); }}
                    className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </section>
    </>
  );
};

export default OnboardingView;