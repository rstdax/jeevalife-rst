import React from 'react';
import { sounds } from '../utils/audio';

interface TermsViewProps {
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

const TermsView: React.FC<TermsViewProps> = ({ onBack }) => (
  <section
    className="flex flex-col flex-1 pt-6 h-full overflow-y-auto"
    style={{ animation: 'fadeIn 0.4s var(--ease-smooth) forwards', paddingLeft: 'clamp(16px, 4vw, 24px)', paddingRight: 'clamp(16px, 4vw, 24px)', paddingBottom: 'calc(clamp(85px, 14vw, 100px) + env(safe-area-inset-bottom, 0px))' }}
  >
    <header className="flex items-center gap-4 mb-8">
      <button
        onClick={() => { sounds.click(); onBack(); }}
        className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-muted hover:text-white transition-colors"
      >
        <i className="fa-solid fa-arrow-left" />
      </button>
      <div>
        <h2 className="text-2xl font-bold">Terms & Conditions</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Last updated: May 2025</p>
      </div>
    </header>

    <div
      className="glass-card mb-6 flex items-center gap-4 py-5"
      style={{ background: 'rgba(212,175,55,0.05)', borderColor: 'rgba(212,175,55,0.2)' }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: 'rgba(212,175,55,0.1)' }}>
        📋
      </div>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Please read these terms carefully before using JeevaLife. By using the app, you agree to be bound by these terms.
      </p>
    </div>

    <Section title="1. Acceptance of Terms">
      <p>
        By accessing or using JeevaLife ("the App"), you agree to be bound by these Terms and Conditions
        and our Privacy Policy. If you do not agree, please do not use the App.
      </p>
      <p>
        JeevaLife is currently in <strong className="text-white">beta</strong>. Features may change,
        be removed, or be unavailable at any time without notice.
      </p>
    </Section>

    <Section title="2. Not Medical Advice">
      <p>
        <strong className="text-white">JeevaLife is a wellness tool, not a medical device or service.</strong>
      </p>
      <p>
        The content, scores, insights, and recommendations provided by JeevaLife are for
        informational and motivational purposes only. They do not constitute medical advice,
        diagnosis, or treatment.
      </p>
      <p>
        Always consult a qualified healthcare professional before making decisions about your
        physical or mental health. Do not disregard professional medical advice based on
        anything you read or see in this app.
      </p>
    </Section>

    <Section title="3. User Accounts">
      <p>You are responsible for:</p>
      <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
        <li>Maintaining the confidentiality of your account credentials</li>
        <li>All activity that occurs under your account</li>
        <li>Providing accurate and truthful information</li>
        <li>Notifying us immediately of any unauthorised use</li>
      </ul>
      <p className="mt-2">
        You must be at least 13 years old to use JeevaLife. By using the App, you confirm you meet this requirement.
      </p>
    </Section>

    <Section title="4. Acceptable Use">
      <p>You agree not to:</p>
      <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
        <li>Use the App for any unlawful purpose</li>
        <li>Attempt to reverse-engineer, hack, or disrupt the App</li>
        <li>Submit false, misleading, or harmful content</li>
        <li>Impersonate any person or entity</li>
        <li>Use the App to harass, abuse, or harm others</li>
      </ul>
    </Section>

    <Section title="5. Emergency Contact Feature">
      <p>
        If you provide an emergency contact, you confirm that:
      </p>
      <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
        <li>You have obtained consent from that person to be contacted</li>
        <li>The contact details are accurate</li>
        <li>You understand notifications are sent via WhatsApp when your wellness score is critically low for 3+ consecutive days</li>
      </ul>
      <p className="mt-2">
        JeevaLife is not a crisis service. If you are in immediate danger, please contact emergency services (112 / 911).
      </p>
    </Section>

    <Section title="6. Intellectual Property">
      <p>
        All content, design, code, and branding in JeevaLife is owned by JeevaJyoti and protected
        by applicable intellectual property laws. You may not copy, reproduce, or distribute any
        part of the App without written permission.
      </p>
    </Section>

    <Section title="7. Disclaimer of Warranties">
      <p>
        JeevaLife is provided <strong className="text-white">"as is"</strong> without warranties of
        any kind. We do not guarantee that the App will be error-free, uninterrupted, or meet your
        specific requirements. As a beta product, you use it at your own risk.
      </p>
    </Section>

    <Section title="8. Limitation of Liability">
      <p>
        To the maximum extent permitted by law, JeevaJyoti shall not be liable for any indirect,
        incidental, special, or consequential damages arising from your use of the App, including
        but not limited to loss of data, health outcomes, or reliance on app content.
      </p>
    </Section>

    <Section title="9. Changes to Terms">
      <p>
        We reserve the right to modify these Terms at any time. We will notify you of material
        changes via the App. Continued use after changes constitutes acceptance of the new Terms.
      </p>
    </Section>

    <Section title="10. Governing Law">
      <p>
        These Terms are governed by the laws of India. Any disputes shall be subject to the
        exclusive jurisdiction of the courts of India.
      </p>
    </Section>

    <Section title="11. Contact">
      <p>
        For questions about these Terms, contact us at:
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
      JeevaLife Beta · Terms & Conditions · May 2025
    </p>
  </section>
);

export default TermsView;
