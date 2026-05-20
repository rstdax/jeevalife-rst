import React, { useState } from 'react';
import { sounds } from '../utils/audio';
import { db } from '../lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface ContactUsViewProps {
  onBack: () => void;
}

const ContactUsView: React.FC<ContactUsViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      await addDoc(collection(db, 'contact_messages'), {
        user_id: user?.uid ?? null,
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        created_at: new Date().toISOString(),
      });
      sounds.success();
      setSent(true);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
    >
      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={() => { sounds.click(); onBack(); }}
          className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-muted hover:text-white transition-colors"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h2 className="text-2xl font-bold">Contact Us</h2>
      </header>

      {sent ? (
        <div className="flex flex-col items-center text-center gap-5 mt-12">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}
          >
            ✉️
          </div>
          <h3 className="text-xl font-bold">Message Sent!</h3>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            We've received your message and will get back to you within 2–3 business days.
          </p>
          <button
            onClick={() => { setSent(false); setSubject(''); setMessage(''); }}
            className="mt-4 px-8 py-3.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--color-green)', color: '#031515' }}
          >
            Send Another
          </button>
        </div>
      ) : (
        <>
          {/* Contact options */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: '📧', label: 'Email', value: 'jeevajyoti.org@gmail.com', action: () => window.open('mailto:jeevajyoti.org@gmail.com') },
              { icon: '🌐', label: 'Website', value: 'jeevajyoti.org', action: () => window.open('https://jeevajyoti.org/', '_blank') },
            ].map(c => (
              <button
                key={c.label}
                onClick={c.action}
                className="glass-card flex flex-col items-center gap-2 py-5 text-center hover:scale-[1.02] transition-transform active:scale-95"
              >
                <span className="text-2xl">{c.icon}</span>
                <p className="text-xs font-bold text-white">{c.label}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{c.value}</p>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="flex flex-col gap-5">
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
              Send us a message
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Your Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent"
                placeholder="What's this about?"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="glass-panel p-4 rounded-xl text-white outline-none border border-white/5 text-sm focus:border-white/20 transition-colors bg-transparent resize-none"
                placeholder="Tell us how we can help..."
                style={{ fontFamily: 'var(--font-body)', lineHeight: '1.6' }}
              />
            </div>

            {error && <p className="text-sm text-center" style={{ color: '#EF4444' }}>{error}</p>}

            <button
              type="submit"
              disabled={sending || !subject.trim() || !message.trim()}
              className="w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'var(--color-gold)', color: '#031515' }}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
            We typically respond within 2–3 business days
          </p>
        </>
      )}
    </section>
  );
};

export default ContactUsView;
