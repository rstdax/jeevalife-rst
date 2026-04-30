import { useState } from 'react';
import { sounds } from '../utils/audio';

interface ProfileViewProps {
  sfxEnabled: boolean;
  onToggleSfx: () => void;
}

const badges = [
  { emoji: '🔥', label: '7-Day Streak', earned: true },
  { emoji: '🧘', label: 'Zen Master', earned: true },
  { emoji: '🌙', label: 'Night Owl', earned: false },
  { emoji: '👑', label: '30-Day King', earned: false },
];

interface ToggleItemProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({ label, active, onToggle }) => (
  <div className="flex justify-between items-center text-base">
    <span>{label}</span>
    <div
      onClick={onToggle}
      className={`toggle-switch relative w-[44px] h-[24px] rounded-xl ${active ? 'active' : ''}`}
      style={{ background: active ? 'var(--color-green)' : 'rgba(255,255,255,0.1)' }}
    />
  </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ sfxEnabled, onToggleSfx }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Rahul Sharma');
  const [bio, setBio] = useState('Level 4 Wellness Explorer');
  const [age, setAge] = useState('24');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [goal, setGoal] = useState('Calm Mind');

  const goals = ['Stay Hydrated', 'Calm Mind', 'Improve Sleep', 'Boost Energy', 'Weight Management'];

  const handleToggleSfx = () => {
    sounds.click();
    onToggleSfx();
  };

  const handleEdit = () => {
    sounds.click();
    setIsEditing(true);
  };

  const handleSave = () => {
    sounds.click();
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <section className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto" style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button onClick={handleSave} className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>Save</button>
        </header>

        <div className="flex flex-col gap-6 pb-6">
          {/* Avatar Edit */}
          <div className="glass-card flex flex-col items-center gap-4 py-6">
             <div className="glass-panel overflow-hidden p-1 relative group cursor-pointer" style={{ width: 110, height: 110, borderRadius: '50%' }}>
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Rahul&backgroundColor=transparent"
                alt="Avatar"
                className="w-full h-full rounded-full bg-white/10"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-camera text-2xl text-white" />
              </div>
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-widest">Change Profile Picture</span>
          </div>

          {/* Basic Info */}
          <div className="glass-card flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Full Name</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="glass-panel p-4 rounded-xl text-white outline-none border-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                placeholder="Enter your name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Headline / Bio</label>
              <input 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                className="glass-panel p-4 rounded-xl text-white outline-none border-none text-sm"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                placeholder="Brief bio"
              />
            </div>
          </div>

          {/* Wellness Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Age', value: age, set: setAge, suffix: 'yrs' },
              { label: 'Height', value: height, set: setHeight, suffix: 'cm' },
              { label: 'Weight', value: weight, set: setWeight, suffix: 'kg' },
            ].map((metric) => (
              <div key={metric.label} className="glass-card flex flex-col gap-2 p-3">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{metric.label}</label>
                <div className="flex items-baseline gap-1">
                  <input 
                    type="number"
                    value={metric.value} 
                    onChange={(e) => metric.set(e.target.value)}
                    className="bg-transparent text-lg font-bold text-white outline-none border-none w-full"
                  />
                  <span className="text-[10px] text-muted">{metric.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Goals Selector */}
          <div className="glass-card flex flex-col gap-3">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Primary Wellness Goal</label>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <button
                  key={g}
                  onClick={() => { sounds.click(); setGoal(g); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    goal === g 
                    ? 'bg-[var(--color-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                    : 'glass-panel bg-white/5 text-muted'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="profile-view"
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      {/* Profile Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <div
            className="glass-panel overflow-hidden p-1"
            style={{ width: 70, height: 70, borderRadius: '50%' }}
          >
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Rahul&backgroundColor=transparent"
              alt="Avatar"
              className="w-full h-full rounded-full bg-white/10"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">{name}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{bio}</p>
          </div>
        </div>
        <button 
          onClick={handleEdit}
          className="w-10 h-10 flex justify-center items-center rounded-xl glass-panel text-muted hover:text-white transition-colors"
        >
          <i className="fa-solid fa-pen-to-square" />
        </button>
      </header>

      <main>
        {/* Achievements */}
        <div className="glass-card mb-4">
          <h3 className="text-base font-semibold">Your Achievements</h3>
          <div className="grid grid-cols-4 gap-3 mt-4 text-center">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2 text-xs"
                style={{
                  opacity: badge.earned ? 1 : 0.4,
                  filter: badge.earned ? 'none' : 'grayscale(1)',
                }}
              >
                <div
                  className="glass-panel flex justify-center items-center rounded-full text-2xl"
                  style={{ width: 50, height: 50 }}
                >
                  {badge.emoji}
                </div>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="glass-card mb-4 flex flex-col gap-5">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Preferences</h3>
          <ToggleItem label="Dark Mode" active={true} onToggle={() => sounds.click()} />
          <ToggleItem label="Sound Effects" active={sfxEnabled} onToggle={handleToggleSfx} />
          <ToggleItem label="Daily Reminders" active={false} onToggle={() => sounds.click()} />
        </div>

        {/* Information Section */}
        <div className="glass-card mb-4 flex flex-col gap-1">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Information & Support</h3>
          {[
            { label: 'About Us', icon: 'fa-solid fa-circle-info' },
            { label: 'Contact Us', icon: 'fa-solid fa-headset' },
            { label: 'Visit JeevaJyoti', icon: 'fa-solid fa-earth-asia', color: 'var(--color-gold)' },
            { label: 'Privacy Policy', icon: 'fa-solid fa-shield-halved' },
            { label: 'Terms & Conditions', icon: 'fa-solid fa-file-contract' },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center justify-between py-3.5 hover:translate-x-1 transition-transform duration-300"
              onClick={() => sounds.click()}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex justify-center items-center rounded-lg bg-white/5" style={{ color: item.color || 'white' }}>
                  <i className={item.icon} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <i className="fa-solid fa-chevron-right text-[10px] text-muted" />
            </button>
          ))}
        </div>
      </main>
    </section>
  );
};

export default ProfileView;
