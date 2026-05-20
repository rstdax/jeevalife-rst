import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { sounds } from '../utils/audio';

export type FeedbackMilestone = '1day' | '3day' | '7day';

interface UserFeedbackPopupProps {
  milestone: FeedbackMilestone;
  userId: string;
  onClose: () => void;
}

const MILESTONE_LABELS: Record<FeedbackMilestone, string> = {
  '1day': 'After 1 Day',
  '3day': 'After 3 Days',
  '7day': 'After 1 Week',
};

const UserFeedbackPopup: React.FC<UserFeedbackPopupProps> = ({ milestone, userId, onClose }) => {
  const [love, setLove] = useState('');
  const [hate, setHate] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = love.trim().length > 0 || hate.trim().length > 0 || suggestion.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Save to 'feedback' collection so admin sees it in the main feedback view
      await addDoc(collection(db, 'feedback'), {
        user_id: userId,
        type: 'other',                    // milestone feedback goes under 'other'
        text: '',                          // no single text — structured fields below
        milestone,
        rating,
        love: love.trim(),
        hate: hate.trim(),
        suggestion: suggestion.trim(),
        status: 'new',
        created_at: new Date().toISOString(),
      });
      sounds.success();
      setDone(true);
    } catch (e) {
      console.error('Feedback submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center px-4 pb-6"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget && done) onClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 480,
          background: 'linear-gradient(160deg, #0d2424 0%, #031515 100%)',
          border: '1px solid rgba(0,242,254,0.15)',
          borderRadius: 28,
          padding: '28px 24px 24px',
          animation: 'slideUp 0.45s var(--ease-spring) forwards',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {done ? (
          /* Success */
          <div className="text-center py-8 flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1.5px solid rgba(16,185,129,0.3)' }}
            >
              🙏
            </div>
            <h3 className="text-xl font-bold">Thank You!</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Your feedback means the world to us. We'll use it to make JeevaLife better for everyone.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-4 rounded-2xl font-bold text-sm"
              style={{ background: 'var(--color-green)', color: '#031515' }}
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3"
                  style={{ background: 'rgba(0,242,254,0.1)', color: 'var(--color-cyan)', border: '1px solid rgba(0,242,254,0.2)' }}
                >
                  📋 Feedback — {MILESTONE_LABELS[milestone]}
                </span>
                <h2 className="text-xl font-bold leading-snug">How's JeevaLife treating you?</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  Your honest feedback shapes what we build next.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 ml-3 mt-1"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* Star rating */}
            <div className="flex flex-col gap-2 mb-5 mt-4">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Overall Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => { sounds.click(); setRating(star); }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl transition-transform active:scale-90"
                    style={{ filter: (hoverRating || rating) >= star ? 'none' : 'grayscale(1) opacity(0.3)' }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* What you love */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-green)' }}>
                💚 What do you love?
              </label>
              <textarea
                value={love}
                onChange={e => setLove(e.target.value)}
                rows={3}
                className="w-full text-white resize-none rounded-xl p-4 text-sm"
                style={{
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  lineHeight: '1.6',
                }}
                placeholder="What's working great for you..."
              />
            </div>

            {/* What you hate */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EF4444' }}>
                ❌ What do you hate?
              </label>
              <textarea
                value={hate}
                onChange={e => setHate(e.target.value)}
                rows={3}
                className="w-full text-white resize-none rounded-xl p-4 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  lineHeight: '1.6',
                }}
                placeholder="What's frustrating or broken..."
              />
            </div>

            {/* Suggestions */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
                💡 Any suggestions?
              </label>
              <textarea
                value={suggestion}
                onChange={e => setSuggestion(e.target.value)}
                rows={3}
                className="w-full text-white resize-none rounded-xl p-4 text-sm"
                style={{
                  background: 'rgba(212,175,55,0.05)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  lineHeight: '1.6',
                }}
                placeholder="Features you'd love to see..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-muted)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Maybe Later
              </button>
              <button
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
                style={{ background: 'var(--color-gold)', color: '#031515' }}
              >
                {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserFeedbackPopup;
