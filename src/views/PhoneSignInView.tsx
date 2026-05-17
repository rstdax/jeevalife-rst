import React, { useState } from 'react';
import { sounds } from '../utils/audio';

interface PhoneSignInViewProps {
  onBack: () => void;
  onContinue: (phone: string) => void;
  error?: string;
}

const COUNTRIES = [
  { code: 'US', dialCode: '+1', flag: '🇺🇸', format: '(XXX) XXX-XXXX' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', format: 'XXXXX-XXXXX' },
  { code: 'UK', dialCode: '+44', flag: '🇬🇧', format: 'XXXX XXXXXX' },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺', format: 'XXX XXX XXX' },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦', format: '(XXX) XXX-XXXX' },
];

const formatPhone = (raw: string, format: string) => {
  let formatted = '';
  let rawIndex = 0;
  for (let i = 0; i < format.length; i++) {
    if (rawIndex >= raw.length) break;
    if (format[i] === 'X') {
      formatted += raw[rawIndex];
      rawIndex++;
    } else {
      formatted += format[i];
    }
  }
  return formatted;
};

const PhoneSignInView: React.FC<PhoneSignInViewProps> = ({ onBack, onContinue, error }) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [rawPhone, setRawPhone] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const maxDigits = selectedCountry.format.replace(/[^X]/g, '').length;
    setRawPhone(digits.slice(0, maxDigits));
  };

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    sounds.click();
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    // Re-truncate if the new country has fewer digits
    const maxDigits = country.format.replace(/[^X]/g, '').length;
    setRawPhone(prev => prev.slice(0, maxDigits));
  };

  const formattedPhone = formatPhone(rawPhone, selectedCountry.format);
  const maxDigits = selectedCountry.format.replace(/[^X]/g, '').length;
  const isValid = rawPhone.length === maxDigits;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      sounds.success();
      // E.164 format: +[dialCode][digits] — no spaces or formatting
      const e164 = `${selectedCountry.dialCode}${rawPhone}`;
      onContinue(e164);
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
        <h1 className="text-3xl font-bold mb-2">What's your number?</h1>
        <p className="text-muted text-sm mb-10">We'll send you a secure code to verify your account.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-8">
          <div className="flex flex-col gap-2 relative z-50">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Phone Number</label>
            <div className={`glass-panel p-2 rounded-xl flex items-center border transition-colors ${isDropdownOpen ? 'border-[var(--color-gold)] bg-white/5' : 'border-white/5 focus-within:border-[var(--color-gold)]'}`}>
              
              <div 
                className="relative flex items-center px-3 border-r border-white/10 text-lg cursor-pointer hover:bg-white/5 rounded-lg py-1 transition-colors"
                onClick={() => { sounds.click(); setIsDropdownOpen(!isDropdownOpen); }}
              >
                <span className="mr-2">{selectedCountry.flag}</span>
                <span className="font-bold text-white">{selectedCountry.dialCode}</span>
                <i className={`fa-solid fa-chevron-down text-xs ml-3 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-[var(--color-gold)]' : 'text-white/30'}`} />
              </div>

              <input 
                type="tel"
                required
                value={formattedPhone}
                onChange={handlePhoneChange}
                className="bg-transparent text-white outline-none text-lg flex-1 font-mono tracking-wider pl-4 py-2 w-full"
                placeholder={selectedCountry.format.replace(/X/g, '0')}
              />
            </div>

            {/* Custom Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div 
                  className="absolute top-[80px] left-0 w-[200px] glass-card rounded-xl p-2 z-50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col gap-1" 
                  style={{ animation: 'fadeIn 0.2s var(--ease-spring) forwards' }}
                >
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-left ${selectedCountry.code === c.code ? 'bg-[var(--color-gold)] text-black' : 'text-muted hover:bg-white/10 hover:text-white'}`}
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="font-bold flex-1">{c.dialCode}</span>
                      <span className={`text-xs ${selectedCountry.code === c.code ? 'opacity-80' : 'opacity-40'}`}>{c.code}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button 
            type="submit"
            disabled={!isValid}
            className={`w-full mt-4 py-4 rounded-xl font-bold transition-all duration-300 transform ${isValid ? 'hover:scale-[1.02] text-black bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
          >
            Send OTP Code
          </button>
          {error && (
            <p className="text-center text-sm mt-2" style={{ color: '#EF4444' }}>{error}</p>
          )}
        </form>
      </div>
    </section>
  );
};

export default PhoneSignInView;
