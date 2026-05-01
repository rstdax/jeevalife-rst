import { useState, useCallback, useEffect } from 'react';
import type { ViewId } from './types';
import { initAudio, sounds } from './utils/audio';
import AmbientBackground from './components/AmbientBackground';
import BottomNav from './components/BottomNav';
import DashboardView from './views/DashboardView';
import CheckInView from './views/CheckInView';
import ToolsView from './views/ToolsView';
import InsightsView from './views/InsightsView';
import JournalView from './views/JournalView';
import ProfileView from './views/ProfileView';
import DailyRemindersView from './views/DailyRemindersView';
import StreakPopup from './components/StreakPopup';
import OnboardingView from './views/OnboardingView';
import PhoneSignInView from './views/PhoneSignInView';
import OtpVerifyView from './views/OtpVerifyView';
import OnboardingDetailsView from './views/OnboardingDetailsView';

function App() {
  const [activeView, setActiveView] = useState<ViewId>('onboarding');
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [streakCount] = useState(7); // Example streak count
  const [onboardingName, setOnboardingName] = useState('');

  // Initialize audio on first user interaction
  useEffect(() => {
    const handler = () => {
      initAudio();
      document.body.removeEventListener('click', handler);
    };
    document.body.addEventListener('click', handler, { once: true });
    return () => document.body.removeEventListener('click', handler);
  }, []);

  // Check for daily check-in
  useEffect(() => {
    const lastCheckin = localStorage.getItem('lastCheckinDate');
    const today = new Date().toDateString();
    
    if (lastCheckin !== today) {
      const timer = setTimeout(() => setShowStreakPopup(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClaimStreak = useCallback(() => {
    localStorage.setItem('lastCheckinDate', new Date().toDateString());
    setShowStreakPopup(false);
  }, []);

  const handleNavigate = useCallback((view: ViewId) => {
    sounds.swoosh();
    setActiveView(view);
    window.scrollTo(0, 0);
  }, []);

  const handleCompleteOnboarding = useCallback(() => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    handleNavigate('dashboard');
  }, [handleNavigate]);

  const handleCompleteOnboardingDetails = useCallback(() => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    handleNavigate('check-in');
  }, [handleNavigate]);

  const handleSignUpSuccess = useCallback((name?: string, isGoogle?: boolean) => {
    if (isGoogle) {
      setOnboardingName("Alex Morgan"); // Mocked Google Name
    } else if (name) {
      setOnboardingName(name);
    }
    handleNavigate('onboarding-details');
  }, [handleNavigate]);

  const handleStartCheckIn = useCallback(() => {
    setActiveView('check-in');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setActiveView('dashboard');
  }, []);

  const handleToggleSfx = useCallback(() => {
    setSfxEnabled((prev) => !prev);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView sfxEnabled={sfxEnabled} onStartCheckIn={handleStartCheckIn} />;
      case 'check-in':
        return <CheckInView onBack={handleBackToDashboard} />;
      case 'tools':
        return <ToolsView />;
      case 'insights':
        return <InsightsView />;
      case 'journal':
        return <JournalView />;
      case 'profile':
        return <ProfileView sfxEnabled={sfxEnabled} onToggleSfx={handleToggleSfx} onNavigate={handleNavigate} />;
      case 'daily-reminders':
        return <DailyRemindersView onBack={() => handleNavigate('profile')} />;
      case 'onboarding':
        return <OnboardingView onNavigate={handleNavigate} onGoogleSignUp={() => handleSignUpSuccess(undefined, true)} />;
      case 'phone-sign-in':
        return <PhoneSignInView onBack={() => handleNavigate('onboarding')} onContinue={() => handleNavigate('otp-verify')} />;
      case 'otp-verify':
        return <OtpVerifyView onBack={() => handleNavigate('phone-sign-in')} onVerify={() => handleNavigate('onboarding-details')} />;
      case 'onboarding-details':
        return <OnboardingDetailsView onComplete={handleCompleteOnboardingDetails} initialName={onboardingName} />;
      default:
        return <DashboardView sfxEnabled={sfxEnabled} onStartCheckIn={handleStartCheckIn} />;
    }
  };

  const isAuthView = activeView === 'onboarding' || activeView === 'phone-sign-in' || activeView === 'otp-verify' || activeView === 'onboarding-details';

  return (
    <>
      <AmbientBackground />
      {showStreakPopup && !isAuthView && <StreakPopup streakCount={streakCount} onClose={handleClaimStreak} />}
      <div
        id="app"
        className="relative flex flex-col mx-auto min-h-screen"
        style={{ maxWidth: 480, minHeight: '100dvh' }}
      >
        {renderView()}
        {!isAuthView && <BottomNav activeView={activeView} onNavigate={handleNavigate} />}
      </div>
    </>
  );
}

export default App;
