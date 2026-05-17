import { useState, useRef, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// ── Multi-Color System ─────────────────────────────────────────────────────

const CATEGORY_VIBES: Record<string, string> = {
  Recommended: '#00f2fe',
  Mood: '#b066ff',
  Energy: '#ffae00',
  Stress: '#00e5ff',
  Focus: '#00ffb2',
  Sleep: '#4d4dff',
};

const getCategoryColor = (category: string, opacity: number): string => {
  const hex = CATEGORY_VIBES[category] || CATEGORY_VIBES.Recommended;
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ── Data Models ────────────────────────────────────────────────────────────

interface SoundItem {
  id: string;
  label: string;
  icon: string;
  category: string;
  freq: number;
  noiseType: 'pink' | 'brown' | 'white' | 'tone' | 'binaural';
  benefit: string;
  helpsWhen?: ('mood' | 'energy' | 'stress' | 'sleep' | 'focus')[];
}

const SOUNDS: SoundItem[] = [
  { id: '528hz', label: '528 Hz', icon: 'fa-solid fa-heart', category: 'Mood', freq: 528, noiseType: 'tone', benefit: 'Love & peace', helpsWhen: ['mood'] },
  { id: '417hz', label: '417 Hz', icon: 'fa-solid fa-rotate-left', category: 'Mood', freq: 417, noiseType: 'tone', benefit: 'Release negativity', helpsWhen: ['mood'] },
  { id: 'alpha', label: 'Alpha Waves', icon: 'fa-solid fa-brain', category: 'Mood', freq: 10, noiseType: 'binaural', benefit: 'Relaxed awareness', helpsWhen: ['mood', 'stress'] },
  { id: 'beta', label: 'Beta Waves', icon: 'fa-solid fa-bolt', category: 'Energy', freq: 20, noiseType: 'binaural', benefit: 'Alertness & drive', helpsWhen: ['energy'] },
  { id: '963hz', label: '963 Hz', icon: 'fa-solid fa-sun', category: 'Energy', freq: 963, noiseType: 'tone', benefit: 'Awaken & energise', helpsWhen: ['energy'] },
  { id: '396hz', label: '396 Hz', icon: 'fa-solid fa-fire', category: 'Energy', freq: 396, noiseType: 'tone', benefit: 'Grief to joy', helpsWhen: ['energy', 'mood'] },
  { id: '174hz', label: '174 Hz', icon: 'fa-solid fa-shield-halved', category: 'Stress', freq: 174, noiseType: 'tone', benefit: 'Natural anesthetic', helpsWhen: ['stress'] },
  { id: '432hz', label: '432 Hz', icon: 'fa-solid fa-earth-americas', category: 'Stress', freq: 432, noiseType: 'tone', benefit: 'Heartbeat of Earth', helpsWhen: ['stress', 'mood'] },
  { id: 'theta', label: 'Theta Waves', icon: 'fa-solid fa-water', category: 'Stress', freq: 6, noiseType: 'binaural', benefit: 'Deep calm', helpsWhen: ['stress', 'sleep'] },
  { id: 'gamma', label: 'Gamma Waves', icon: 'fa-solid fa-crosshairs', category: 'Focus', freq: 40, noiseType: 'binaural', benefit: 'Peak concentration', helpsWhen: ['focus'] },
  { id: '741hz', label: '741 Hz', icon: 'fa-solid fa-lightbulb', category: 'Focus', freq: 741, noiseType: 'tone', benefit: 'Clarity & intuition', helpsWhen: ['focus'] },
  { id: '639hz', label: '639 Hz', icon: 'fa-solid fa-comments', category: 'Focus', freq: 639, noiseType: 'tone', benefit: 'Mental clarity', helpsWhen: ['focus', 'mood'] },
  { id: 'delta', label: 'Delta Waves', icon: 'fa-solid fa-moon', category: 'Sleep', freq: 2, noiseType: 'binaural', benefit: 'Deep dreamless sleep', helpsWhen: ['sleep'] },
  { id: '285hz', label: '285 Hz', icon: 'fa-solid fa-bed', category: 'Sleep', freq: 285, noiseType: 'tone', benefit: 'Safe & secure', helpsWhen: ['sleep'] },
  { id: 'pink', label: 'Pink Noise', icon: 'fa-solid fa-droplet', category: 'Sleep', freq: 200, noiseType: 'pink', benefit: 'Mask disturbances', helpsWhen: ['sleep'] },
  { id: 'brown', label: 'Brown Noise', icon: 'fa-solid fa-cloud', category: 'Sleep', freq: 100, noiseType: 'brown', benefit: 'Deep rumble calm', helpsWhen: ['sleep', 'stress'] },
];

const CATEGORIES = ['Recommended', 'Mood', 'Energy', 'Stress', 'Focus', 'Sleep'];

// ── Audio Engine ───────────────────────────────────────────────────────────
let ctx: AudioContext | null = null;
let activeNodes: AudioNode[] = [];

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

function stopAll() {
  activeNodes.forEach(n => { try { (n as OscillatorNode).stop?.(); n.disconnect(); } catch { /* ignore */ } });
  activeNodes = [];
}

function playSound(sound: SoundItem, volume: number) {
  stopAll();
  const ac = getCtx();
  const masterGain = ac.createGain();
  masterGain.gain.setValueAtTime(0, ac.currentTime);
  masterGain.gain.linearRampToValueAtTime(volume * 0.12, ac.currentTime + 2);
  masterGain.connect(ac.destination);
  activeNodes.push(masterGain);

  if (sound.noiseType === 'tone') {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = sound.freq;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    osc.connect(masterGain);
    osc.start(); lfo.start();
    activeNodes.push(osc, lfo, lfoGain);
  } else if (sound.noiseType === 'binaural') {
    const base = 200;
    const merger = ac.createChannelMerger(2);
    merger.connect(masterGain);
    [0, 1].forEach(ch => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = ch === 0 ? base : base + sound.freq;
      osc.connect(merger, 0, ch);
      osc.start();
      activeNodes.push(osc);
    });
  } else {
    const bufferSize = ac.sampleRate * 4;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (sound.noiseType === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else if (sound.noiseType === 'brown') {
        b0 = (b0 + 0.02 * white) / 1.02;
        data[i] = b0 * 3.5;
      } else {
        data[i] = white * 0.3;
      }
    }
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = sound.freq;
    filter.Q.value = 0.4;
    source.connect(filter);
    filter.connect(masterGain);
    source.start();
    activeNodes.push(source, filter);
  }
}

// ── Main Component ─────────────────────────────────────────────────────────
const ToolsView: React.FC = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('Recommended');
  const [activeSound, setActiveSound] = useState<SoundItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [elapsed, setElapsed] = useState(0);
  const [checkin, setCheckin] = useState<Record<string, number> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 30 * 60;

  const currentCategoryVibe = activeSound ? activeSound.category : (activeCategory === 'Recommended' ? 'Recommended' : activeCategory);
  const activeColor = CATEGORY_VIBES[currentCategoryVibe] || CATEGORY_VIBES.Recommended;

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'checkins'), where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(10));
    getDocs(q).then(snap => {
      const todayDoc = snap.docs.find(d => (d.data().created_at as string).startsWith(today));
      if (todayDoc) setCheckin(todayDoc.data() as Record<string, number>);
    });
  }, [user]);

  // ── FIX: Stop audio when leaving the page ──
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const recommended = SOUNDS.filter(s => checkin && s.helpsWhen?.some(dim => (checkin[dim] ?? 0) >= 2));
  const filtered = activeCategory === 'Recommended'
    ? (recommended.length > 0 ? recommended : SOUNDS.slice(0, 6))
    : SOUNDS.filter(s => s.category === activeCategory);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  const handleSelect = (sound: SoundItem) => {
    sounds.click();
    setActiveSound(sound);
    setElapsed(0);
    setIsPlaying(true);
    playSound(sound, volume);
  };

  const handlePlayPause = () => {
    sounds.click();
    if (isPlaying) { stopAll(); setIsPlaying(false); }
    else if (activeSound) { setIsPlaying(true); playSound(activeSound, volume); }
  };

  const handleSkip = (dir: 1 | -1) => {
    if (!activeSound) return;
    sounds.click();
    const idx = SOUNDS.findIndex(s => s.id === activeSound.id);
    handleSelect(SOUNDS[(idx + dir + SOUNDS.length) % SOUNDS.length]);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = Math.min(elapsed / DURATION, 1);

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden flex flex-col font-sans text-white pb-32">
      
      {/* ── Ambient Background Glow ── */}
      <div 
        className="absolute inset-0 z-0 opacity-40 transition-colors duration-1000 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${getCategoryColor(currentCategoryVibe, 0.4)} 0%, transparent 60%)` }}
      />
      
      {/* ── Content Wrapper ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-10" style={{ scrollbarWidth: 'none' }}>
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Soundscapes</h1>
          <p className="text-white/50 text-sm mt-1 font-medium">Calibrate your mind with frequencies</p>
        </header>

        {/* ── Hero Player (Bento Card) ── */}
        <div className="relative rounded-[36px] bg-white/5 backdrop-blur-xl border border-white/10 p-6 mb-8 shadow-2xl overflow-hidden transition-all duration-500">
          
          {/* Subtle noise texture overlay for the glass card */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

          {/* Top Info */}
          <div className="flex flex-col items-center text-center relative z-10 mb-8">
            <div className="h-6 mb-2">
              {activeSound && (
                <span className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full bg-white/10 border border-white/5 inline-block" style={{ color: activeColor }}>
                  {activeSound.noiseType}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1 transition-colors duration-300" style={{ textShadow: `0 0 20px ${getCategoryColor(currentCategoryVibe, 0.5)}` }}>
              {activeSound ? activeSound.label : 'Select a Frequency'}
            </h2>
            <p className="text-xs text-white/50 font-medium">
              {activeSound ? activeSound.benefit : 'Ready to begin session'}
            </p>
          </div>

          {/* Visualizer (Concentric pulsing circles) */}
          <div className="relative flex items-center justify-center h-28 mb-10 z-10">
            <div className="absolute w-28 h-28 rounded-full border border-white/5 flex items-center justify-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-out"
                style={{ 
                  background: `radial-gradient(circle, ${getCategoryColor(currentCategoryVibe, isPlaying ? 0.4 : 0.1)} 0%, transparent 70%)`,
                  transform: isPlaying ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: isPlaying ? `0 0 40px ${getCategoryColor(currentCategoryVibe, 0.6)}` : 'none',
                  animation: isPlaying ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <i className={`${activeSound ? activeSound.icon : 'fa-solid fa-wave-square'} text-lg`} style={{ color: activeSound ? activeColor : 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 mb-6 z-10 relative">
            <button onClick={() => handleSkip(-1)} className="w-10 h-10 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90">
              <i className="fa-solid fa-backward-step" />
            </button>
            
            <button 
              onClick={handlePlayPause}
              className="w-16 h-16 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-lg"
              style={{ 
                background: activeColor,
                boxShadow: isPlaying ? `0 0 30px ${getCategoryColor(currentCategoryVibe, 0.5)}` : '0 4px 15px rgba(0,0,0,0.3)'
              }}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-2xl text-black ml-${isPlaying ? '0' : '1'}`} />
            </button>

            <button onClick={() => handleSkip(1)} className="w-10 h-10 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90">
              <i className="fa-solid fa-forward-step" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative z-10 px-2 mb-4 group">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 linear"
                style={{ width: `${progress * 100}%`, background: activeColor, boxShadow: `0 0 10px ${activeColor}` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-white/40 tracking-wider">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(DURATION)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 px-2 z-10 relative">
            <i className="fa-solid fa-volume-low text-xs text-white/30" />
            <input 
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (isPlaying && activeSound) playSound(activeSound, v); }}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            <i className="fa-solid fa-volume-high text-xs text-white/30" />
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 px-1 -mx-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const vibe = CATEGORY_VIBES[cat] || CATEGORY_VIBES.Recommended;
            return (
              <button 
                key={cat}
                onClick={() => { sounds.click(); setActiveCategory(cat); }}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border flex items-center gap-2`}
                style={{
                  background: isActive ? getCategoryColor(cat, 0.15) : 'rgba(255,255,255,0.03)',
                  borderColor: isActive ? getCategoryColor(cat, 0.4) : 'rgba(255,255,255,0.05)',
                  color: isActive ? vibe : 'rgba(255,255,255,0.6)',
                  boxShadow: isActive ? `0 4px 20px ${getCategoryColor(cat, 0.1)}` : 'none'
                }}
              >
                {cat}
                {cat === 'Recommended' && recommended.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white leading-none">
                    {recommended.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Empty State */}
        {activeCategory === 'Recommended' && !checkin && (
          <div className="w-full rounded-[28px] bg-white/5 border border-white/5 p-8 text-center mb-8 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <i className="fa-solid fa-clipboard-check text-2xl text-white/30" />
            </div>
            <h3 className="text-lg font-bold mb-1">Daily Check-in Needed</h3>
            <p className="text-sm text-white/40 max-w-[250px]">Complete today's check-in to unlock personalized frequency recommendations.</p>
          </div>
        )}

        {/* ── Bento Grid (Sounds) ── */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {filtered.map(sound => {
            const isActive = activeSound?.id === sound.id;
            const sColor = CATEGORY_VIBES[sound.category] || CATEGORY_VIBES.Recommended;
            
            return (
              <button 
                key={sound.id} 
                onClick={() => handleSelect(sound)}
                className={`group relative flex flex-col p-5 rounded-[28px] text-left transition-all duration-300 active:scale-95 overflow-hidden`}
                style={{
                  background: isActive ? getCategoryColor(sound.category, 0.1) : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? getCategoryColor(sound.category, 0.3) : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: isActive ? `0 8px 24px ${getCategoryColor(sound.category, 0.15)}` : '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl" style={{ background: getCategoryColor(sound.category, 0.4) }} />
                )}

                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 relative z-10"
                  style={{ background: isActive ? sColor : 'rgba(255,255,255,0.05)' }}>
                  <i className={sound.icon} style={{ color: isActive ? '#000' : sColor, fontSize: 18 }} />
                </div>
                
                <div className="relative z-10">
                  <span className={`text-base font-bold block mb-1 ${isActive ? 'text-white' : 'text-white/90'}`}>
                    {sound.label}
                  </span>
                  <span className={`text-[11px] font-medium block line-clamp-1 ${isActive ? 'text-white/70' : 'text-white/40'}`}>
                    {sound.benefit}
                  </span>
                </div>

                {/* Playing visualizer bars on active tile */}
                {isActive && isPlaying && (
                  <div className="absolute top-5 right-5 flex items-end gap-[2px] h-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 bg-white rounded-t-sm" style={{ height: `${Math.random() * 100}%`, animation: `pulse ${0.5 + i * 0.2}s infinite alternate` }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Coming Soon Tile */}
        <div className="flex items-center gap-4 p-4 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-not-allowed group">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all">
            <i className="fa-solid fa-wand-magic-sparkles text-white/30" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white/80">More Tools Coming</p>
            <p className="text-xs text-white/40 mt-0.5">Advanced binaural mixing soon.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ToolsView;