import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface SignInViewProps {
  onBack: () => void;
  onLogin: () => void;
}

const SignInView: React.FC<SignInViewProps> = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.success();
    onLogin();
  };

  return (
    <section className="flex flex-col flex-1 h-full px-6 pt-6 pb-[100px] overflow-y-auto" style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <header className="flex items-center gap-4 mb-10">
        <button
          type="button"
          onClick={() => { sounds.click(); onBack(); }}
          className="w-10 h-10 flex justify-center items-center rounded-xl glass-panel text-muted hover:text-white transition-colors"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-muted text-sm mb-10">Log in to continue your mindfulness journey.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 flex justify-between">
              <span>Password</span>
              <a href="#" className="text-white opacity-70 hover:opacity-100 transition-opacity">Forgot?</a>
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-4 py-4 rounded-xl font-bold text-black transition-transform duration-300 transform hover:scale-[1.02]"
            style={{ background: 'white', boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}
          >
            Log In
          </button>
        </form>

        <div className="flex items-center gap-4 mb-8 opacity-50">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-xs uppercase tracking-widest">Or</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <button 
          type="button"
          onClick={() => { sounds.success(); onLogin(); }}
          className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 border border-white/10 transition-transform duration-300 transform hover:scale-[1.02] glass-panel"
        >
          <i className="fa-brands fa-google text-[var(--color-blue, #60a5fa)] text-lg" />
          Continue with Google
        </button>
      </div>
    </section>
  );
};

export default SignInView;
