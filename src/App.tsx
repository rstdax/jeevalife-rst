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

function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [sfxEnabled, setSfxEnabled] = useState(true);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handler = () => {
      initAudio();
      document.body.removeEventListener('click', handler);
    };
    document.body.addEventListener('click', handler, { once: true });
    return () => document.body.removeEventListener('click', handler);
  }, []);

  const handleNavigate = useCallback((view: ViewId) => {
    sounds.swoosh();
    setActiveView(view);
    window.scrollTo(0, 0);
  }, []);

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
        return <ProfileView sfxEnabled={sfxEnabled} onToggleSfx={handleToggleSfx} />;
      default:
        return <DashboardView sfxEnabled={sfxEnabled} onStartCheckIn={handleStartCheckIn} />;
    }
  };

  return (
    <>
      <AmbientBackground />
      <div
        id="app"
        className="relative flex flex-col mx-auto min-h-screen"
        style={{ maxWidth: 480, minHeight: '100dvh' }}
      >
        {renderView()}
        <BottomNav activeView={activeView} onNavigate={handleNavigate} />
      </div>
    </>
  );
}

export default App;
