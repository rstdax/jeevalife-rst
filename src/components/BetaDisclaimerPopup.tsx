import React, { useState } from 'react';

interface BetaDisclaimerPopupProps {
  onAccept: () => void;
}

const BetaDisclaimerPopup: React.FC<BetaDisclaimerPopupProps> = ({ onAccept }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: 'clamp(12px, 3vw, 16px)', paddingBottom: 'clamp(16px, 4vw, 24px)' }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 'min(480px, 100vw)',
          background: 'linear-gradient(160deg, #0d2424 0%, #031515 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 'clamp(20px, 5vw, 28px)',
          padding: 'clamp(20px, 5vw, 28px) clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px)',
          animation: 'slideUp 0.45s var(--ease-spring) forwards',
        }}
      >
        {/* Badge */}
        <div className="flex items-center gap-2 mb-5">
          <span
            className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            🧪 Beta Version
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3 leading-snug">
          Welcome to JeevaLife Beta
        </h2>

        {/* Body */}
        <div
          className="text-sm leading-relaxed mb-6 flex flex-col gap-3"
          style={{ color: 'var(--color-muted)' }}
        >
          <p>
            You're one of the first people to experience JeevaLife. This app is currently in
            <strong className="text-white"> beta</strong> — which means it's still being actively developed,
            tested, and improved.
          </p>
          <p>
            You may encounter <strong className="text-white">bugs, incomplete features, or unexpected behaviour</strong>.
            We appreciate your patience and your willingness to help us build something meaningful.
          </p>
          <p>
            Your data is stored securely, but as a beta product, we recommend not relying on this app
            as your sole wellness tool. Always consult a qualified health professional for medical advice.
          </p>
          <p>
            By continuing, you agree to share anonymous usage feedback to help us improve the experience.
            You can submit detailed feedback anytime from your Profile page.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            JeevaLife Beta · Built with ❤️ by the JeevaJyoti team · Feedback helps us grow
          </p>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
          <div
            onClick={() => setChecked(p => !p)}
            className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
            style={{
              background: checked ? 'var(--color-gold)' : 'rgba(255,255,255,0.08)',
              border: checked ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {checked && <i className="fa-solid fa-check text-[10px] text-black" />}
          </div>
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
            I understand this is a beta product and agree to the{' '}
            <span className="text-white underline underline-offset-2">Terms & Conditions</span>
          </span>
        </label>

        {/* CTA */}
        <button
          disabled={!checked}
          onClick={onAccept}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          style={{
            background: checked
              ? 'linear-gradient(135deg, var(--color-gold) 0%, #b8962e 100%)'
              : 'rgba(255,255,255,0.08)',
            color: checked ? '#031515' : 'var(--color-muted)',
            boxShadow: checked ? '0 0 24px rgba(212,175,55,0.25)' : 'none',
          }}
        >
          I Understand — Let's Begin
        </button>
      </div>
    </div>
  );
};

export default BetaDisclaimerPopup;
