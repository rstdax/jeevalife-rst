import React from 'react';
import { sounds } from '../utils/audio';

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="glass-card mb-4">
    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-gold)' }}>{title}</h3>
    <div className="text-sm leading-relaxed flex flex-col gap-2" style={{ color: 'var(--color-muted)' }}>
      {children}
    </div>
  </div>
);

const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => (
  <section
    className="flex flex-col flex-1 px-6 pt-6 pb-[100px] h-full overflow-y-auto"
    style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards' }}
  >
    <header className="flex items-center gap-4 mb-8">
      <button
        onClick={() => { sounds.click(); onBack(); }}
        className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-muted hover:text-white transition-colors"
      >
        <i className="fa-solid fa-arrow-left" />
      </button>
      <div>
        <h2 className="text-2xl font-bold">Privacy Policy</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Last updated: May 2025</p>
      </div>
    </header>

    <div
      className="glass-card mb-6 flex items-center gap-4 py-5"
      style={{ background: 'rgba(13,84,84,0.2)', borderColor: 'rgba(0,242,254,0.15)' }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: 'rgba(0,242,254,0.1)' }}>
        🔒
      </div>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Your privacy matters to us. We collect only what's necessary to provide you with a personalised wellness experience.
      </p>
    </div>

    <Section title="1. Information We Collect">
      <p>We collect the following information when you use JeevaLife:</p>
      <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
        <li>Account information (name, phone number or Google account)</li>
        <li>Profile data (age, height, weight, wellness goals)</li>
        <li>Check-in responses and wellness scores</li>
        <li>Journal entries you create</li>
        <li>Reminder preferences</li>
        <li>Emergency contact details (if provided)</li>
        <li>App usage data and feedback you submit</li>
      </ul>
    </Section>

    <Section title="2. How We Use Your Information">
      <p>Your data is used to:</p>
      <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
        <li>Personalise your wellness experience and insights</li>
        <li>Track your progress and streaks over time</li>
        <li>Send reminders you've configured</li>
        <li>Alert your emergency contact if your wellness score is critically low for 3+ days</li>
        <li>Improve the app based on aggregated, anonymised usage patterns</li>
      </ul>
    </Section>

    <Section title="3. Data Storage & Security">
      <p>
        All data is stored securely in <strong className="text-white">Google Firebase Firestore</strong>,
        protected by Firebase Security Rules. Data is encrypted in transit (TLS) and at rest.
      </p>
      <p>
        We do not store your data on our own servers. Firebase is operated by Google LLC and
        complies with GDPR, CCPA, and other applicable data protection regulations.
      </p>
    </Section>

    <Section title="4. Data Sharing">
      <p>We do <strong className="text-white">not</strong> sell, rent, or share your personal data with third parties, except:</p>
      <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
        <li>Your emergency contact (only in critical wellness situations, as described above)</li>
        <li>Service providers necessary to operate the app (Firebase, Google Analytics)</li>
        <li>When required by law or to protect safety</li>
      </ul>
    </Section>

    <Section title="5. Your Rights">
      <p>You have the right to:</p>
      <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
        <li>Access all data we hold about you</li>
        <li>Correct inaccurate data via your Profile page</li>
        <li>Delete your account and all associated data</li>
        <li>Withdraw consent at any time by signing out and contacting us</li>
      </ul>
      <p className="mt-2">To exercise these rights, contact us at <strong className="text-white">jeevajyoti.org@gmail.com</strong></p>
    </Section>

    <Section title="6. Cookies & Analytics">
      <p>
        JeevaLife uses <strong className="text-white">Google Analytics for Firebase</strong> to understand
        how users interact with the app. This data is anonymised and aggregated. No personally
        identifiable information is included in analytics reports.
      </p>
    </Section>

    <Section title="7. Children's Privacy">
      <p>
        JeevaLife is not intended for users under the age of 13. We do not knowingly collect
        personal information from children. If you believe a child has provided us with personal
        information, please contact us immediately.
      </p>
    </Section>

    <Section title="8. Changes to This Policy">
      <p>
        We may update this Privacy Policy from time to time. We will notify you of significant
        changes via the app. Continued use of JeevaLife after changes constitutes acceptance
        of the updated policy.
      </p>
    </Section>

    <Section title="9. Contact">
      <p>
        For privacy-related questions or requests, contact us at:
      </p>
      <p className="mt-1">
        <strong className="text-white">JeevaJyoti · jeevajyoti.org@gmail.com</strong>
        <br />
        <a href="https://jeevajyoti.org" className="underline underline-offset-2" style={{ color: 'var(--color-cyan)' }}>
          jeevajyoti.org
        </a>
      </p>
    </Section>

    <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
      JeevaLife  · Privacy Policy · May 2025
    </p>
  </section>
);

export default PrivacyPolicyView;
