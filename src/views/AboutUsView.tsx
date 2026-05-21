import React from 'react';
import type { ViewId } from '../types';
import { sounds } from '../utils/audio';

interface AboutUsViewProps {
  onBack: () => void;
  onNavigate: (view: ViewId) => void;
}

const AboutUsView: React.FC<AboutUsViewProps> = ({ onBack }) => (
  <section
    className="flex flex-col flex-1 pt-6 h-full overflow-y-auto"
    style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards', paddingLeft: 'clamp(16px, 4vw, 24px)', paddingRight: 'clamp(16px, 4vw, 24px)', paddingBottom: 'calc(clamp(85px, 14vw, 100px) + env(safe-area-inset-bottom, 0px))' }}
  >
    {/* Header */}
    <header className="flex items-center gap-4 mb-8">
      <button
        onClick={() => { sounds.click(); onBack(); }}
        className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-muted hover:text-white transition-colors"
      >
        <i className="fa-solid fa-arrow-left" />
      </button>
      <h2 className="text-2xl font-bold">About Us</h2>
    </header>

    {/* Hero */}
    <div
      className="glass-card mb-6 flex flex-col items-center text-center py-8 gap-4"
      style={{ background: 'linear-gradient(135deg, rgba(13,84,84,0.3) 0%, rgba(3,21,21,0.6) 100%)' }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: 'rgba(212,175,55,0.12)', border: '1.5px solid rgba(212,175,55,0.3)' }}
      >
        🌿
      </div>
      <h1 className="text-2xl font-bold">JeevaLife</h1>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        A wellness companion built with heart
      </p>
      <span
        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
        style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--color-gold)', border: '1px solid rgba(212,175,55,0.25)' }}
      >
        🧪 Beta
      </span>
    </div>

    {/* Mission */}
    <div className="glass-card mb-4">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-gold)' }}>Our Mission</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        Abhi k liye khali hian we need to add .
      </p>
    </div>

    {/* Story */}
    <div className="glass-card mb-4">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-cyan)' }}>Our Story</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
         Abhi k liye khali hian we need to add .
      </p>
      <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--color-muted)' }}>
         Abhi k liye khali hian we need to add .
      </p>
    </div>

    {/* Values */}
    <div className="glass-card mb-4">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-green)' }}>What We Stand For</h3>
      <div className="flex flex-col gap-4">
        {[
          { icon: '', title: 'Privacy First', desc: 'Your data belongs to you. We never sell or share your personal information.' },
          { icon: '', title: 'Holistic Wellness', desc: 'Mind, body, and spirit — we care about the whole you, not just numbers.' },
          { icon: '', title: 'Continuous Growth', desc: 'We\'re always improving. Your feedback is our roadmap.' },
          { icon: '', title: 'Community', desc: 'Built in partnership with JeevaJyoti\'s community of wellness practitioners.' },
        ].map(v => (
          <div key={v.title} className="flex gap-4 items-start">
            <span className="text-2xl shrink-0">{v.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{v.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{v.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* JeevaJyoti link */}
    <button
      onClick={() => window.open('https://jeevajyoti.org/', '_blank')}
      className="glass-card mb-4 flex items-center justify-between py-4 w-full hover:translate-x-1 transition-transform duration-300"
      style={{ borderColor: 'rgba(212,175,55,0.2)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}>
          <i className="fa-solid fa-earth-asia" style={{ color: 'var(--color-gold)' }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold">Visit JeevaJyoti</p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>jeevajyoti.org</p>
        </div>
      </div>
      <i className="fa-solid fa-arrow-up-right-from-square text-xs" style={{ color: 'var(--color-muted)' }} />
    </button>

    <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
      JeevaLife Beta · Made with ❤️ by JeevaJyoti
    </p>
  </section>
);

export default AboutUsView;
