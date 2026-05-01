import React, { useEffect, useState } from 'react';
import { sounds } from '../utils/audio';

interface StreakPopupProps {
  onClose: () => void;
  streakCount: number;
}

const StreakPopup: React.FC<StreakPopupProps> = ({ onClose, streakCount }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);

  useEffect(() => {
    // slight delay for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      sounds.success();
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClaim = () => {
    sounds.click();
    setIsVisible(false);
    setTimeout(onClose, 400); // Wait for fade out animation
  };

  const basePage = Math.floor(Math.max(streakCount - 1, 0) / 12);
  const currentPage = Math.max(0, basePage + pageOffset);
  const startDay = currentPage * 12 + 1;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClaim} />
      
      <div 
        className={`glass-card relative flex flex-col items-center text-center p-8 w-full max-w-sm transition-all duration-500 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-10 scale-95'}`}
        style={{ border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 40px rgba(212,175,55,0.1)' }}
      >
        <h2 className="text-2xl font-bold mb-2">Daily Check-in!</h2>
        <p className="text-muted text-sm mb-4">
          You're on a <span className="font-bold" style={{ color: 'var(--color-gold)' }}>{streakCount} Day</span> streak.
        </p>

        <div className="flex items-center justify-between w-full mb-3 px-1">
          <button 
            onClick={() => { sounds.click(); setPageOffset(p => p - 1); }} 
            disabled={currentPage === 0} 
            className={`w-8 h-8 flex items-center justify-center rounded-full glass-panel transition-all ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-white'}`}
          >
            <i className="fa-solid fa-chevron-left text-[10px]" />
          </button>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Days {startDay} - {startDay + 11}
          </span>
          <button 
            onClick={() => { sounds.click(); setPageOffset(p => p + 1); }} 
            className="w-8 h-8 flex items-center justify-center rounded-full glass-panel hover:bg-white/10 text-white transition-all"
          >
            <i className="fa-solid fa-chevron-right text-[10px]" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 w-full mb-6">
          {Array.from({ length: 12 }, (_, i) => {
            return startDay + i;
          }).map((day) => {
            const isCompleted = day < streakCount;
            const isToday = day === streakCount;
            const milestones = [7, 15, 30, 45, 60, 75, 100, 125, 150, 175, 200, 365];
            const isMilestone = milestones.includes(day);

            return (
              <div 
                key={day} 
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                  isToday 
                    ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] transform scale-105 z-10' 
                    : isCompleted 
                      ? 'border-transparent bg-white/10 text-white' 
                      : isMilestone
                        ? 'border-[var(--color-gold)] border-opacity-50 bg-[var(--color-gold)]/10 text-white shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                        : 'border-white/5 bg-white/5 text-muted opacity-50'
                }`}
              >
                {/* Milestone Badge for future milestones */}
                {isMilestone && !isToday && !isCompleted && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--color-gold)] rounded-full flex items-center justify-center shadow-[0_0_5px_rgba(212,175,55,0.8)]">
                    <i className="fa-solid fa-star text-[7px] text-black" />
                  </div>
                )}
                
                <span className={`text-[10px] font-bold mb-1 whitespace-nowrap ${isMilestone && !isToday && !isCompleted ? 'text-[var(--color-gold)]' : ''}`}>Day {day}</span>
                {isCompleted ? (
                  <i className="fa-solid fa-check text-[14px]" style={{ color: 'var(--color-green, #4ade80)' }} />
                ) : isToday ? (
                  <span className="text-[14px]">🔥</span>
                ) : isMilestone ? (
                  <i className="fa-solid fa-gift text-[12px] text-[var(--color-gold)]" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1" />
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={handleClaim}
          className="w-full py-4 rounded-xl font-bold transition-transform duration-300 transform hover:scale-[1.02]"
          style={{ background: 'var(--color-gold)', color: 'black', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}
        >
          Claim Daily Streak
        </button>
      </div>
    </div>
  );
};

export default StreakPopup;
