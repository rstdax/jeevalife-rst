import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../utils/audio';

interface OtpVerifyViewProps {
  onBack: () => void;
  onVerify: (token: string) => void;
  phone?: string;
  error?: string;
}

const OtpVerifyView: React.FC<OtpVerifyViewProps> = ({ onBack, onVerify, phone, error }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = async (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    sounds.click();
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value !== '' && index === 5 && newCode.every(v => v !== '')) {
      sounds.success();
      setIsVerifying(true);
      await onVerify(newCode.join(''));
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const maskedPhone = phone
    ? phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
    : '';

  return (
    <section className="flex flex-col flex-1 h-full px-6 pt-6 pb-[100px] overflow-y-auto"
      style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}>
      <header className="flex items-center gap-4 mb-10">
        <button type="button" onClick={() => { sounds.click(); onBack(); }}
          className="w-10 h-10 flex justify-center items-center rounded-xl glass-panel text-muted hover:text-white transition-colors">
          <i className="fa-solid fa-arrow-left" />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <h1 className="text-3xl font-bold mb-2">Verify it's you</h1>
        <p className="text-muted text-sm mb-10">
          Enter the 6-digit code sent to <span className="text-white font-semibold">{maskedPhone}</span>
        </p>

        <div className="flex gap-2 justify-center mb-4">
          {code.map((digit, index) => (
            <input key={index} ref={el => { inputRefs.current[index] = el; }}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={isVerifying}
              className="w-12 h-14 glass-card text-center text-2xl font-bold text-white outline-none border border-white/10 focus:border-[var(--color-gold)] transition-all bg-transparent rounded-2xl disabled:opacity-50" />
          ))}
        </div>

        {error && <p className="text-center text-sm mb-4" style={{ color: '#EF4444' }}>{error}</p>}
        {isVerifying && <p className="text-center text-sm mb-4" style={{ color: 'var(--color-gold)' }}>Verifying...</p>}

        <div className="text-center text-sm text-muted mt-4">
          Didn't receive the code?{' '}
          <button className="text-white hover:underline" onClick={onBack}>Resend</button>
        </div>
      </div>
    </section>
  );
};

export default OtpVerifyView;
