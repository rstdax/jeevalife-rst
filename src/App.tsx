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
import SignInView from './views/SignInView';
import SignUpView from './views/SignUpView';

function App() {
  const [activeView, setActiveView] = useState<ViewId>('onboarding');
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [streakCount] = useState(7); // Example streak count

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
        return <OnboardingView onNavigate={handleNavigate} />;
      case 'sign-in':
        return <SignInView onBack={() => handleNavigate('onboarding')} onLogin={handleCompleteOnboarding} />;
      case 'sign-up':
        return <SignUpView onBack={() => handleNavigate('onboarding')} onSignUp={handleCompleteOnboarding} />;
      default:
        return <DashboardView sfxEnabled={sfxEnabled} onStartCheckIn={handleStartCheckIn} />;
    }
  };

  const isAuthView = activeView === 'onboarding' || activeView === 'sign-in' || activeView === 'sign-up';

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
