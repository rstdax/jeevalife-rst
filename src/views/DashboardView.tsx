import { useState, useEffect } from 'react';
import { sounds, toggleTherapy } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { ViewId } from '../types';

interface Reminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
}

interface DashboardViewProps {
  sfxEnabled: boolean;
  onStartCheckIn: () => void;
  streakCount: number; // Fallback from parent
  jeevaScore: number | null;
  onNavigate: (view: ViewId) => void;
  reminders: Reminder[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ sfxEnabled, onStartCheckIn, streakCount, jeevaScore, onNavigate, reminders }) => {
  const { user, profile } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [actualStreak, setActualStreak] = useState(streakCount || 0);

  // Fetch the latest streak directly from Firebase on load
  useEffect(() => {
    if (!user) return;
    const fetchStreak = async () => {
      try {
        const snap = await getDoc(doc(db, 'streaks', user.uid));
        if (snap.exists()) {
          setActualStreak(snap.data().current_streak || 0);
        }
      } catch (error) {
        console.error("Error fetching streak:", error);
      }
    };
    fetchStreak();
  }, [user]);

  // Sync with parent prop if it updates (e.g., right after a check-in finishes)
  useEffect(() => {
    if (streakCount > actualStreak) {
      setActualStreak(streakCount);
    }
  }, [streakCount]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good Morning';
    if (h >= 12 && h < 17) return 'Good Afternoon';
    if (h >= 17 && h < 21) return 'Good Evening';
    return 'Good Night';
  };

  const displayName = (() => {
    if (profile?.name && profile.name !== 'Wellness Explorer') return profile.name.split(' ')[0];
    const g = user?.displayName;
    return g ? g.split(' ')[0] : 'Friend';
  })();

  const truncatedName = displayName.length > 7 ? displayName.slice(0, 7) + '...' : displayName;

  const scoreLabel = jeevaScore
    ? jeevaScore >= 85 ? 'Excellent' : jeevaScore >= 70 ? 'Good' : jeevaScore >= 50 ? 'Fair' : 'Low'
    : 'No data';
  const scoreColor = jeevaScore
    ? jeevaScore >= 70 ? 'var(--color-green)' : jeevaScore >= 50 ? 'var(--color-gold)' : '#EF4444'
    : 'var(--color-muted)';

  return (
    <section id="dashboard-view" className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-[1.6rem] tracking-tight font-bold">{getGreeting()}, {truncatedName}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {profile?.goals?.length ? `Goals: ${profile.goals.slice(0, 2).join(', ')} 🌿` : 'Your mind is clear today. 🌿'}
          </p>
        </div>
        <div className="glass-panel px-4 py-2 rounded-full font-bold flex items-center gap-1.5"
          style={{ color: 'var(--color-gold)', animation: 'popIn 0.6s var(--ease-spring) forwards', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
          <i className="fa-solid fa-fire" /> {actualStreak}
        </div>
      </header>

      <main>
        <>
          <style>{`
            @keyframes rippleWater {
              0% {
                transform: scale(0.95);
                opacity: 0;
                border-radius: 43% 57% 41% 59% / 51% 39% 61% 49%;
              }
              15% {
                opacity: 0.4; /* Fades in gently rather than popping */
              }
              100% {
                transform: scale(1.7);
                opacity: 0;
                border-radius: 50%;
              }
            }
            
            @keyframes dropletMorph {
              0%, 100% { border-radius: 43% 57% 41% 59% / 51% 39% 61% 49%; }
              33% { border-radius: 51% 49% 56% 44% / 43% 54% 46% 57%; }
              66% { border-radius: 45% 55% 38% 62% / 56% 41% 59% 44%; }
            }

            @keyframes pulseWaterGlow {
              0%, 100% { opacity: 0.3; transform: scale(0.95); }
              50% { opacity: 0.6; transform: scale(1.05); }
            }
          `}</style>

          <div className="relative flex justify-center items-center mx-auto mb-10" style={{ width: 280, height: 280 }}>
            
            {/* Multiple staggered ripples for frequent, gentle emergence */}
            <div className="absolute pointer-events-none" style={{
              width: 195, height: 195,
              opacity: 0,
              borderRadius: '50%',
              border: '1.5px solid rgba(0, 242, 254, 0.5)',
              animation: 'rippleWater 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
              willChange: 'transform, opacity, border-radius',
            }} />
            <div className="absolute pointer-events-none" style={{
              width: 195, height: 195,
              opacity: 0,
              borderRadius: '50%',
              border: '1.5px solid rgba(0, 242, 254, 0.4)',
              animation: 'rippleWater 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
              animationDelay: '2s',
              willChange: 'transform, opacity, border-radius',
            }} />
            <div className="absolute pointer-events-none" style={{
              width: 195, height: 195,
              opacity: 0,
              borderRadius: '50%',
              border: '1.5px solid rgba(0, 242, 254, 0.3)',
              animation: 'rippleWater 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
              animationDelay: '4s',
              willChange: 'transform, opacity, border-radius',
            }} />

            {/* Ambient Water Glow behind the droplet */}
            <div className="absolute pointer-events-none" style={{
              width: 190, height: 190,
              background: 'radial-gradient(circle at 40% 40%, rgba(0,242,254,0.3) 0%, transparent 70%)',
              animation: 'pulseWaterGlow 4s ease-in-out infinite, dropletMorph 8s ease-in-out infinite',
              willChange: 'opacity, transform, border-radius',
            }} />

            {/* Main Droplet Button - Fully transparent, relies on light/shadow for volume */}
            <button id="btn-start-checkin"
              onClick={() => { sounds.waterDrop(); onStartCheckIn(); }}
              aria-label="Start 60-second Check-in"
              className="relative z-10 flex flex-col justify-center items-center text-center cursor-pointer active:scale-95 focus:outline-none transition-transform duration-300"
              style={{
                width: 195, height: 195,
                animation: 'dropletMorph 8s ease-in-out infinite',
                background: 'transparent',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  inset 15px 15px 25px rgba(255, 255, 255, 0.4),
                  inset -15px -15px 25px rgba(0, 0, 0, 0.3),
                  0 25px 45px rgba(0, 0, 0, 0.25),
                  0 10px 20px rgba(0, 242, 254, 0.1)
                `,
                willChange: 'transform, border-radius',
              }}>
              
              {/* Specular Highlight */}
              <div className="absolute top-[8%] left-[15%] w-[30%] h-[30%] rounded-full bg-white opacity-[0.35] blur-[3px] pointer-events-none" 
                   style={{ transform: 'rotate(-45deg)', borderRadius: '50% 50% 50% 70%' }} />

              <span className="text-xl font-bold block text-white drop-shadow-md z-10">60s Check-in</span>
              <span className="text-xs uppercase tracking-widest text-[var(--color-gold)] mt-1 font-medium z-10 drop-shadow-sm">Tap to flow</span>
            </button>
          </div>
        </>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card cursor-pointer" onClick={() => { sounds.click(); onNavigate('insights'); }}
            style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', animationDelay: '0.1s', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Jeeva Score</h3>
              <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--color-muted)' }} />
            </div>
            <div className="flex items-baseline gap-2 mt-3 mb-1">
              <span className="text-4xl font-extrabold leading-none" style={{ fontFamily: 'var(--font-heading)' }}>{jeevaScore ?? '--'}</span>
              <span className="font-semibold" style={{ color: scoreColor }}>{scoreLabel}</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{jeevaScore ? 'Based on last check-in' : 'Complete a check-in'}</p>
          </div>
          <div className="glass-card cursor-pointer" onClick={() => { sounds.click(); onNavigate('daily-reminders'); }}
            style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', animationDelay: '0.2s', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Daily Reminders</h3>
              <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--color-muted)' }} />
            </div>
            {reminders.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No reminders set</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {reminders.slice(0, 3).map(r => (
                  <li key={r.id} className="flex items-center gap-2"
                    style={{ opacity: r.enabled ? 1 : 0.4 }}>
                    <i className={r.enabled ? 'fa-regular fa-bell' : 'fa-regular fa-bell-slash'}
                      style={{ color: r.enabled ? 'var(--color-gold)' : 'var(--color-muted)', fontSize: 11 }} />
                    <span className="truncate">{r.title}</span>
                    <span className="ml-auto text-[10px] shrink-0" style={{ color: 'var(--color-muted)' }}>{r.time}</span>
                  </li>
                ))}
                {reminders.length > 3 && (
                  <li className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    +{reminders.length - 3} more
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="glass-card mt-4" style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', animationDelay: '0.3s', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold">Sound Therapy</h3>
            <button onClick={() => { sounds.click(); onNavigate('tools'); }}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-muted)' }}>
              More <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Recommended for your current stress level</p>
          <div className="glass-panel flex items-center gap-4 p-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-center items-center rounded-full text-lg" style={{ color: 'var(--color-gold)', background: 'rgba(212,175,55,0.1)', width: 40, height: 40 }}>
              <i className="fa-solid fa-headphones-simple" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold mb-0.5">432Hz Deep Calm</h4>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Relieve Tension</p>
            </div>
            <button onClick={() => { if (!sfxEnabled) { alert('Enable Sound Effects in Profile.'); return; } setIsPlaying(toggleTherapy(sfxEnabled)); }}
              className="flex justify-center items-center rounded-full text-white cursor-pointer"
              style={{ width: 40, height: 40, background: isPlaying ? 'var(--color-teal-light)' : 'transparent', border: '1px solid var(--color-teal-light)' }}>
              <i className={isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'} />
            </button>
          </div>
        </div>
      </main>
    </section>
  );
};

export default DashboardView;