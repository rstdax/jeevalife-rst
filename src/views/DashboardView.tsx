import { useState } from 'react';
import { sounds, toggleTherapy } from '../utils/audio';

interface DashboardViewProps {
  sfxEnabled: boolean;
  onStartCheckIn: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ sfxEnabled, onStartCheckIn }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayTherapy = () => {
    if (!sfxEnabled) {
      alert('Please enable Sound Effects in Profile settings to hear therapy sounds.');
      return;
    }
    const playing = toggleTherapy(sfxEnabled);
    setIsPlaying(playing);
  };

  const handleStartCheckIn = () => {
    sounds.waterDrop();
    onStartCheckIn();
  };

  return (
    <section
      id="dashboard-view"
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-[1.6rem] tracking-tight font-bold">Good Morning, Rahul</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Your mind is clear today. 🌿</p>
        </div>
        <div
          className="glass-panel px-4 py-2 rounded-full font-bold flex items-center gap-1.5"
          style={{
            color: 'var(--color-gold)',
            animation: 'popIn 0.6s var(--ease-spring) forwards',
            opacity: 0,
            transform: 'translateY(20px) scale(0.95)',
          }}
        >
          <i className="fa-solid fa-fire" style={{ animation: 'flicker 2s infinite alternate' }} /> 12
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Liquid CTA */}
        <div className="relative flex justify-center items-center mx-auto mb-10" style={{ width: 280, height: 280 }}>
          {/* Dynamic Ripple Waves */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-full h-full opacity-0"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 60%, rgba(255, 255, 255, 0.12) 75%, transparent 85%)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                boxShadow: '0 0 12px rgba(0, 242, 254, 0.1)',
                animation: `liquidWobble 6s linear infinite, rippleOut 5s ease-out infinite`,
                animationDelay: `0s, ${i * 1.67}s`,
              }}
            />
          ))}

          {/* Sub-surface Caustics & Glow */}
          <div
            className="absolute"
            style={{
              width: 190,
              height: 190,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 60%)',
              animation: 'pulseGlow 6s linear infinite',
            }}
          />

          {/* Hyper-realistic Morphing Water Droplet */}
          <div
            id="btn-start-checkin"
            onClick={handleStartCheckIn}
            className="relative z-2 flex justify-center items-center text-center cursor-pointer overflow-hidden"
            style={{
              width: 195,
              height: 195,
              borderRadius: '45% 55% 40% 60% / 55% 45% 60% 40%',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              border: 'none',
              outline: 'none',
              boxShadow: `
                inset 12px 18px 25px rgba(255, 255, 255, 0.25),
                inset -15px -20px 35px rgba(0, 15, 20, 0.6),
                inset 0px -45px 50px rgba(0, 5, 10, 0.4),
                8px 25px 45px rgba(0, 0, 0, 0.5)
              `,
              animation: 'liquidWobble 4s linear infinite',
              transition: 'transform 0.4s var(--ease-spring), box-shadow 0.4s ease',
            }}
          >
            {/* Soft Primary Specular Highlight */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '6%',
                left: '12%',
                width: '60%',
                height: '22%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.15) 55%, transparent 80%)',
                filter: 'blur(2.5px)',
                transform: 'rotate(-20deg)',
                animation: 'specularFloat 4s linear infinite',
              }}
            />

            {/* Subtle Secondary Reflection */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '20%',
                right: '10%',
                width: '25%',
                height: '12%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
                filter: 'blur(3px)',
                transform: 'rotate(40deg)',
              }}
            />

             {/* Internal Caustic Reflection (Bottom) */}
             <div
              className="absolute pointer-events-none"
              style={{
                bottom: '1%',
                left: '10%',
                width: '80%',
                height: '18%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at bottom, rgba(255, 255, 255, 0.2) 0%, transparent 75%)',
                filter: 'blur(5px)',
              }}
            />

            {/* Text Layer - Blended inside water */}
            <div className="flex flex-col items-center relative z-10" style={{ mixBlendMode: 'overlay' }}>
              <span className="text-xl font-bold block text-white/95" style={{ textShadow: '0 3px 15px rgba(0,0,0,0.9)' }}>
                60s Check-in
              </span>
              <span className="text-xs uppercase tracking-widest text-white/80" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                Tap to flow
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className="glass-card"
            style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', animationDelay: '0.1s', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}
          >
            <h3 className="text-sm font-semibold">Jeeva Score</h3>
            <div className="flex items-baseline gap-2 mt-3 mb-1">
              <span className="text-4xl font-extrabold leading-none" style={{ fontFamily: 'var(--font-heading)' }}>78</span>
              <span className="font-semibold" style={{ color: 'var(--color-green)' }}>Good</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Top 15% of your week</p>
          </div>

          <div
            className="glass-card"
            style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', animationDelay: '0.2s', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}
          >
            <h3 className="text-sm font-semibold">Today's Focus</h3>
            <ul className="flex flex-col gap-2.5 mt-3 text-sm">
              <li className="flex items-center gap-2">
                <i className="fa-regular fa-circle-check" style={{ color: 'var(--color-green)' }} /> Hydration
              </li>
              <li className="flex items-center gap-2">
                <i className="fa-regular fa-circle" /> 10 min walk
              </li>
            </ul>
          </div>
        </div>

        {/* Sound Therapy */}
        <div
          className="glass-card mt-4"
          style={{ animation: 'popIn 0.6s var(--ease-spring) forwards', animationDelay: '0.3s', opacity: 0, transform: 'translateY(20px) scale(0.95)' }}
        >
          <h3 className="text-sm font-semibold">Sound Therapy</h3>
          <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>Recommended for your current stress level</p>
          <div
            className="glass-panel flex items-center gap-4 p-3 rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div
              className="flex justify-center items-center rounded-full text-lg"
              style={{
                color: 'var(--color-gold)',
                background: 'rgba(212,175,55,0.1)',
                width: 40,
                height: 40,
              }}
            >
              <i className="fa-solid fa-headphones-simple" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold mb-0.5">432Hz Deep Calm</h4>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Relieve Tension</p>
            </div>
            <button
              id="btn-play-therapy"
              onClick={handlePlayTherapy}
              className="flex justify-center items-center rounded-full text-white cursor-pointer"
              style={{
                width: 40,
                height: 40,
                background: isPlaying ? 'var(--color-teal-light)' : 'transparent',
                border: '1px solid var(--color-teal-light)',
                animation: isPlaying ? 'pulse 2s infinite' : 'none',
              }}
            >
              <i className={isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'} />
            </button>
          </div>
        </div>
      </main>
    </section>
  );
};

export default DashboardView;
