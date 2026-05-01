import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../utils/audio';

interface OtpVerifyViewProps {
  onBack: () => void;
  onVerify: () => void;
}

const OtpVerifyView: React.FC<OtpVerifyViewProps> = ({ onBack, onVerify }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    sounds.click();
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next
    if (value !== '' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto submit
    if (value !== '' && index === 3 && newCode.every(v => v !== '')) {
      sounds.success();
      setTimeout(onVerify, 500);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
        <h1 className="text-3xl font-bold mb-2">Verify it's you</h1>
        <p className="text-muted text-sm mb-10">Enter the 4-digit code we just sent to your phone.</p>

        <div className="flex gap-4 justify-center mb-10">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-16 h-16 glass-card text-center text-3xl font-bold text-white outline-none border border-white/10 focus:border-[var(--color-gold)] focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all bg-transparent rounded-2xl"
            />
          ))}
        </div>

        <div className="text-center text-sm text-muted">
          Didn't receive the code? <button className="text-white hover:underline transition-all">Resend in 0:30</button>
        </div>
      </div>
    </section>
  );
};

export default OtpVerifyView;
