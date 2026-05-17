import { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import type { ViewId } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ProfileViewProps {
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  onNavigate: (view: ViewId) => void;
}

interface ToggleItemProps { label: string; active: boolean; onToggle: () => void; }
const ToggleItem: React.FC<ToggleItemProps> = ({ label, active, onToggle }) => (
  <div className="flex justify-between items-center text-base">
    <span>{label}</span>
    <div onClick={onToggle} className={`toggle-switch relative w-[44px] h-[24px] rounded-xl cursor-pointer ${active ? 'active' : ''}`}
      style={{ background: active ? 'var(--color-green)' : 'rgba(255,255,255,0.1)' }} />
  </div>
);

const GOALS = ['Stay Hydrated', 'Calm Mind', 'Improve Sleep', 'Boost Energy', 'Weight Management', 'Reduce Stress'];

const ProfileView: React.FC<ProfileViewProps> = ({ sfxEnabled, onToggleSfx, onNavigate }) => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'complaint' | 'other'>('bug');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Edit form
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  // Seed form from profile
  useEffect(() => {
    if (!profile) return;
    const realName = (profile.name && profile.name !== 'Wellness Explorer')
      ? profile.name
      : (user?.displayName ?? '');
    setName(realName);
    setBio(profile.bio ?? '');
    setAge(profile.age?.toString() ?? '');
    setHeight(profile.height?.toString() ?? '');
    setWeight(profile.weight?.toString() ?? '');
    setSelectedGoals(profile.goals ?? ['Calm Mind']);
    setEmergencyPhone(profile.emergency_contact_phone ?? '');
    setEmergencyRelation(profile.emergency_contact_relation ?? '');
  }, [profile, user]);

  // Fetch streak
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'streaks', user.uid)).then(snap => {
      if (snap.exists()) setStreak(snap.data().current_streak ?? 0);
    });
  }, [user]);

  const ALL_BADGES = [
    { emoji: '🔥', label: '7-Day',    days: 7 },
    { emoji: '🧘', label: '14-Day',   days: 14 },
    { emoji: '🧱', label: '21-Day',   days: 21 },
    { emoji: '👑', label: '30-Day',   days: 30 },
    { emoji: '⚡', label: '45-Day',   days: 45 },
    { emoji: '💎', label: '60-Day',   days: 60 },
    { emoji: '🌙', label: '75-Day',   days: 75 },
    { emoji: '🏆', label: '90-Day',   days: 90 },
    { emoji: '🌟', label: '120-Day',  days: 120 },
    { emoji: '🦁', label: '150-Day',  days: 150 },
    { emoji: '🔮', label: '180-Day',  days: 180 },
    { emoji: '🌊', label: '1-Year',   days: 365 },
    { emoji: '🚀', label: '18-Month', days: 548 },
    { emoji: '🌈', label: '2-Year',   days: 730 },
  ];

  const displayName = (profile?.name && profile.name !== 'Wellness Explorer')
    ? profile.name
    : (user?.displayName ?? 'Wellness Explorer');

  const avatarUrl = profile?.avatar_url
    ?? user?.photoURL
    ?? null;

  // pehla letter aur background color
  const initials = displayName.trim().charAt(0).toUpperCase();
  const avatarColors = ['#0D9488', '#7C3AED', '#DB2777', '#D97706', '#2563EB', '#059669'];
  const avatarBg = avatarColors[displayName.charCodeAt(0) % avatarColors.length];

  const AvatarCircle = ({ size }: { size: number }) => {
    const [imgError, setImgError] = useState(false);
    if (avatarUrl && !imgError) {
      return (
        <img
          src={avatarUrl}
          alt={initials}
          className="w-full h-full rounded-full bg-white/10"
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <div className="w-full h-full rounded-full flex items-center justify-center font-bold"
        style={{ background: avatarBg, fontSize: size * 0.38, color: 'white' }}>
        {initials}
      </div>
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({
      name, bio,
      age: age ? parseInt(age) : null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      goals: selectedGoals.length > 0 ? selectedGoals : ['Calm Mind'],
      emergency_contact_phone: emergencyPhone || null,
      emergency_contact_relation: emergencyRelation || null,
    });
    setIsSaving(false);
    sounds.click();
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <section className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
        style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button onClick={handleSave} disabled={isSaving} className="text-sm font-bold disabled:opacity-50"
            style={{ color: 'var(--color-gold)' }}>{isSaving ? 'Saving...' : 'Save'}</button>
        </header>
        <div className="flex flex-col gap-6 pb-6">
          <div className="glass-card flex flex-col items-center gap-4 py-6">
            <div className="glass-panel overflow-hidden p-1 relative group cursor-pointer" style={{ width: 110, height: 110, borderRadius: '50%' }}>
              <AvatarCircle size={110} />
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-widest">Profile Picture</span>
          </div>
          <div className="glass-card flex flex-col gap-5">
            {[
              { label: 'Full Name', value: name, set: setName, placeholder: 'Your name' },
              { label: 'Headline / Bio', value: bio, set: setBio, placeholder: 'Brief bio' },
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">{f.label}</label>
                <input value={f.value} onChange={e => f.set(e.target.value)}
                  className="glass-panel p-4 rounded-xl text-white outline-none border-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)' }} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Age', value: age, set: setAge, suffix: 'yrs', step: '1' },
              { label: 'Height', value: height, set: setHeight, suffix: 'ft', step: '0.1' },
              { label: 'Weight', value: weight, set: setWeight, suffix: 'kg', step: '0.1' },
            ].map(m => (
              <div key={m.label} className="glass-card flex flex-col gap-2 p-3">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{m.label}</label>
                <div className="flex items-baseline gap-1">
                  <input type="number" value={m.value} onChange={e => m.set(e.target.value)}
                    step={m.step}
                    className="bg-transparent text-lg font-bold text-white outline-none border-none w-full" />
                  <span className="text-[10px] text-muted">{m.suffix}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card flex flex-col gap-3">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Wellness Goals</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button key={g} onClick={() => { sounds.click(); setSelectedGoals(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${selectedGoals.includes(g) ? 'bg-[var(--color-gold)] text-black' : 'glass-panel bg-white/5 text-muted'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="glass-card flex flex-col gap-4"
            style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
            <div className="flex items-center gap-2">
              <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }} />
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Emergency Contact (WhatsApp)</label>
            </div>
            <p className="text-xs -mt-2" style={{ color: 'var(--color-muted)' }}>
              If your wellness score is critically low for 3 days, this person will be notified via WhatsApp.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Phone Number</label>
              <input value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)}
                className="glass-panel p-4 rounded-xl text-white outline-none border-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                placeholder="e.g. +91 XXXXX XXXXX" type="tel" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Relation</label>
              <div className="flex flex-wrap gap-2">
                {['Parent', 'Friend', 'Partner', 'Sibling', 'Therapist'].map(r => (
                  <button key={r} type="button"
                    onClick={() => { sounds.click(); setEmergencyRelation(r); }}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${emergencyRelation === r ? 'bg-[var(--color-green)] text-black' : 'glass-panel bg-white/5 text-muted'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
    <section id="profile-view" className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="glass-panel overflow-hidden p-1" style={{ width: 70, height: 70, borderRadius: '50%' }}>
            <AvatarCircle size={70} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{profile?.bio ?? 'Wellness Explorer'}</p>
          </div>
        </div>
        <button onClick={() => { sounds.click(); setIsEditing(true); }}
          className="w-10 h-10 flex justify-center items-center rounded-xl glass-panel text-muted hover:text-white transition-colors">
          <i className="fa-solid fa-pen-to-square" />
        </button>
      </header>

      <main>
        <div className="glass-card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Your Achievements</h3>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {streak} day streak
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {ALL_BADGES.map((b, i) => {
              const earned = streak >= b.days;
              // next milestone — pehla jo earn nahi hua
              const isNext = !earned && ALL_BADGES.slice(0, i).every(prev => streak >= prev.days);
              return (
                <div key={b.label}
                  className="flex flex-col items-center gap-2 text-xs shrink-0"
                  style={{
                    width: 'calc((100% - 36px) / 4)',
                    opacity: earned ? 1 : isNext ? 0.6 : 0.25,
                    filter: earned ? 'none' : 'grayscale(1)',
                  }}>
                  <div className="flex justify-center items-center rounded-full text-2xl relative"
                    style={{
                      width: 52, height: 52,
                      background: earned
                        ? 'rgba(212,175,55,0.15)'
                        : 'rgba(255,255,255,0.05)',
                      border: earned
                        ? '1.5px solid rgba(212,175,55,0.4)'
                        : isNext
                          ? '1.5px dashed rgba(255,255,255,0.2)'
                          : '1.5px solid rgba(255,255,255,0.06)',
                    }}>
                    {b.emoji}
                    {earned && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                        style={{ background: 'var(--color-green)', color: 'white' }}>✓</span>
                    )}
                  </div>
                  <span className="text-center leading-tight" style={{ color: earned ? 'white' : 'var(--color-muted)' }}>
                    {b.label}
                  </span>
                  {isNext && (
                    <span className="text-[9px]" style={{ color: 'var(--color-gold)' }}>
                      {b.days - streak}d left
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card mb-4 flex flex-col gap-5">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Preferences</h3>
          <ToggleItem label="Sound Effects" active={sfxEnabled} onToggle={() => { sounds.click(); onToggleSfx(); }} />
          <button className="flex items-center justify-between text-base hover:translate-x-1 transition-transform duration-300 w-full"
            onClick={() => { sounds.click(); onNavigate('daily-reminders'); }}>
            <span>Daily Reminders</span>
            <i className="fa-solid fa-chevron-right text-[12px] text-muted" />
          </button>
        </div>

        <div className="glass-card mb-4 flex flex-col gap-1">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Information & Support</h3>
          {[
            { label: 'About Us', icon: 'fa-solid fa-circle-info', url: '' },
            { label: 'Contact Us', icon: 'fa-solid fa-headset', url: '' },
            { label: 'Visit JeevaJyoti', icon: 'fa-solid fa-earth-asia', color: 'var(--color-gold)', url: 'https://jeevajyoti.org/' },
            { label: 'Privacy Policy', icon: 'fa-solid fa-shield-halved', url: '' },
            { label: 'Terms & Conditions', icon: 'fa-solid fa-file-contract', url: '' },
          ].map(item => (
            <button key={item.label} className="flex items-center justify-between py-3.5 hover:translate-x-1 transition-transform duration-300"
              onClick={() => { sounds.click(); if (item.url) window.open(item.url, '_blank'); }}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex justify-center items-center rounded-lg bg-white/5" style={{ color: item.color ?? 'white' }}>
                  <i className={item.icon} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] text-muted" />
            </button>
          ))}
        </div>

        {/* Feedback & Complaints */}
        <div className="glass-card mb-4"
          style={{ background: 'rgba(212,175,55,0.04)', borderColor: 'rgba(212,175,55,0.2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)' }}>
              <i className="fa-solid fa-comment-dots text-sm" style={{ color: 'var(--color-gold)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Feedback & Complaints</h3>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Report issues or suggest improvements</p>
            </div>
          </div>
          <button
            onClick={() => { sounds.click(); setShowFeedback(true); }}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--color-gold)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <i className="fa-solid fa-pen-to-square mr-2" /> Write Feedback
          </button>
        </div>

        <button onClick={() => { sounds.click(); signOut(); }}
          className="w-full glass-card mb-4 py-4 flex items-center justify-center gap-3 text-sm font-semibold"
          style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}>
          <i className="fa-solid fa-right-from-bracket" /> Sign Out
        </button>
      </main>
    </section>

    {/* Feedback Modal */}
    {showFeedback && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={e => { if (e.target === e.currentTarget) { setShowFeedback(false); setFeedbackSent(false); setFeedbackText(''); } }}>
        <div className="w-full flex flex-col"
          style={{
            maxWidth: 440,
            background: '#0d2424',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 24,
            padding: '24px 20px',
            animation: 'popIn 0.35s var(--ease-spring) forwards',
          }}>

          {feedbackSent ? (
            /* Success state */
            <div className="text-center py-6">
              <i className="fa-solid fa-circle-check text-5xl mb-4 block" style={{ color: 'var(--color-green)' }} />
              <h3 className="text-lg font-bold mb-2">Thank You!</h3>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Your feedback has been recorded. We'll review it soon.</p>
              <button onClick={() => { setShowFeedback(false); setFeedbackSent(false); setFeedbackText(''); }}
                className="mt-5 w-full py-3.5 rounded-xl text-sm font-bold"
                style={{ background: 'var(--color-gold)', color: '#031515' }}>
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">Feedback & Complaints</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Help us improve JeevaLife</p>
                </div>
                <button onClick={() => { setShowFeedback(false); setFeedbackText(''); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 ml-3"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}>
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {([
                  { key: 'bug', label: 'Bug', icon: 'fa-solid fa-bug' },
                  { key: 'feature', label: 'Feature', icon: 'fa-solid fa-wand-magic-sparkles' },
                  { key: 'complaint', label: 'Complaint', icon: 'fa-solid fa-triangle-exclamation' },
                  { key: 'other', label: 'Other', icon: 'fa-solid fa-ellipsis' },
                ] as const).map(t => (
                  <button key={t.key}
                    onClick={() => setFeedbackType(t.key)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: feedbackType === t.key ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                      border: feedbackType === t.key ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: feedbackType === t.key ? 'var(--color-gold)' : 'var(--color-muted)',
                    }}>
                    <i className={`${t.icon} text-sm`} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                autoFocus
                className="w-full text-white resize-none rounded-xl p-4 mb-4"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  fontSize: 14,
                  lineHeight: '1.6',
                  minHeight: 140,
                }}
                placeholder={
                  feedbackType === 'bug' ? 'Describe the bug — what happened and when...' :
                  feedbackType === 'feature' ? 'Describe the feature you\'d like to see...' :
                  feedbackType === 'complaint' ? 'Tell us what went wrong...' :
                  'Write your message...'
                }
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={() => { setShowFeedback(false); setFeedbackText(''); }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Cancel
                </button>
                <button
                  disabled={!feedbackText.trim()}
                  onClick={() => {
                    if (!feedbackText.trim()) return;
                    sounds.success();
                    // TODO: send to email when configured
                    console.log('Feedback:', { type: feedbackType, text: feedbackText, user: user?.uid });
                    setFeedbackSent(true);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: 'var(--color-gold)', color: '#031515' }}>
                  Send Feedback
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </>
  );
};

export default ProfileView;
