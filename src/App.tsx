import { useState, useCallback, useEffect, useRef } from 'react';
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
import { useAuth } from './context/AuthContext';
import { db } from './lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { cache } from './utils/cache';

const AUTH_VIEWS: ViewId[] = ['onboarding', 'phone-sign-in', 'otp-verify', 'onboarding-details'];
const LAST_VIEW_KEY = 'jeevalife_last_view';

function App() {
  const { user, profile, loading, profileReady, signInWithGoogle, signInWithPhone, verifyOtp } = useAuth();

  const [activeView, setActiveView] = useState<ViewId | null>(null);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [jeevaScore, setJeevaScore] = useState<number | null>(null);
  const [pendingPhone, setPendingPhone] = useState('');
  const [otpError, setOtpError] = useState('');

  // streak aur score fetch karo — wait for auth + profile to be ready
  useEffect(() => {
    if (!user?.uid || !profileReady) return;

    // streak
    const streakQ = query(collection(db, 'streaks'), where('user_id', '==', user.uid));
    getDocs(streakQ).then(snap => {
      if (!snap.empty) setStreakCount(snap.docs[0].data().current_streak ?? 0);
    });

    // latest jeeva score
    const checkinQ = query(
      collection(db, 'checkins'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    getDocs(checkinQ).then(snap => {
      if (!snap.empty) setJeevaScore(snap.docs[0].data().jeeva_score ?? null);
    });
  }, [user?.uid, profileReady]);

  // audio pehli click pe init karo
  useEffect(() => {
    const handler = () => { initAudio(); document.body.removeEventListener('click', handler); };
    document.body.addEventListener('click', handler, { once: true });
    return () => document.body.removeEventListener('click', handler);
  }, []);

  // reminders ek baar fetch karo, memory mein rakho
  const remindersFiredRef = useRef<Set<string>>(new Set());
  const cachedRemindersRef = useRef<{ id: string; title: string; time: string; enabled: boolean }[]>([]);
  const [reminders, setReminders] = useState<{ id: string; title: string; time: string; enabled: boolean }[]>([]);

  useEffect(() => {
    if (!user?.uid || !profileReady) return;
    const q = query(collection(db, 'reminders'), where('user_id', '==', user.uid));
    getDocs(q).then(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; title: string; time: string; enabled: boolean }));
      data.sort((a, b) => ((a as unknown as { created_at: string }).created_at ?? '').localeCompare((b as unknown as { created_at: string }).created_at ?? ''));
      cachedRemindersRef.current = data;
      setReminders(data);
    });
  }, [user?.uid, profileReady]);

  // har 30s pe memory se check karo — koi DB query nahi
  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      if (Notification.permission !== 'granted') return;
      if (!cachedRemindersRef.current.length) return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const todayKey = now.toDateString();

      cachedRemindersRef.current.forEach(r => {
        if (!r.enabled) return;
        let hour = 0, min = 0;
        const ampmMatch = r.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        const plainMatch = r.time.match(/(\d+):(\d+)/);
        if (ampmMatch) {
          hour = parseInt(ampmMatch[1]);
          min = parseInt(ampmMatch[2]);
          const period = ampmMatch[3].toUpperCase();
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
        } else if (plainMatch) {
          hour = parseInt(plainMatch[1]);
          min = parseInt(plainMatch[2]);
        }
        const fireKey = `${r.id}_${todayKey}_${hour}:${min}`;
        if (currentHour === hour && currentMin === min && !remindersFiredRef.current.has(fireKey)) {
          remindersFiredRef.current.add(fireKey);
          new Notification(`⏰ ${r.title}`, { body: `JeevaLife reminder: ${r.title}`, icon: '/favicon.svg', tag: fireKey });
        }
      });
      remindersFiredRef.current = new Set([...remindersFiredRef.current].filter(k => k.includes(todayKey)));
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // routing — loading khatam hone ke baad
  useEffect(() => {
    if (loading) return;
    if (!user) {
      localStorage.removeItem(LAST_VIEW_KEY);
      setActiveView('onboarding');
      return;
    }
    if (profile?.age) {
      localStorage.setItem(`onboarding_done_${user.uid}`, 'true');
    }
    const done = localStorage.getItem(`onboarding_done_${user.uid}`);
    if (!done && !profile?.age && profileReady) {
      setActiveView('onboarding-details');
      return;
    }
    const saved = localStorage.getItem(LAST_VIEW_KEY) as ViewId | null;
    setActiveView(saved && !AUTH_VIEWS.includes(saved) ? saved : 'dashboard');
  }, [loading, user, profile?.age, profileReady]);

  // active view save karo
  useEffect(() => {
    if (activeView && !AUTH_VIEWS.includes(activeView)) {
      localStorage.setItem(LAST_VIEW_KEY, activeView);
    }
  }, [activeView]);

  // logout hone pe onboarding pe bhejo
  useEffect(() => {
    if (loading) return;
    if (!user && activeView && !AUTH_VIEWS.includes(activeView)) {
      setActiveView('onboarding');
    }
  }, [user, loading, activeView]);

  // streak popup
  useEffect(() => {
    if (!user || !profile?.age) return;
    const last = localStorage.getItem(`lastCheckinDate_${user.uid}`);
    if (last !== new Date().toDateString()) {
      const t = setTimeout(() => setShowStreakPopup(true), 1500);
      return () => clearTimeout(t);
    }
  }, [user, profile?.age]);

  const handleClaimStreak = useCallback(() => {
    if (user) localStorage.setItem(`lastCheckinDate_${user.uid}`, new Date().toDateString());
    setShowStreakPopup(false);
  }, [user]);

  const handleNavigate = useCallback((view: ViewId) => {
    sounds.swoosh();
    setActiveView(view);
    window.scrollTo(0, 0);
  }, []);

  const handleGoogleSignUp = useCallback(async () => {
    sounds.click();
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const handlePhoneContinue = useCallback(async (phone: string) => {
    setPendingPhone(phone);
    const { error } = await signInWithPhone(phone);
    if (error) { setOtpError(error); return; }
    setOtpError('');
    handleNavigate('otp-verify');
  }, [signInWithPhone, handleNavigate]);

  const handleOtpVerify = useCallback(async (token: string) => {
    const { error } = await verifyOtp(token);
    if (error) { setOtpError(error); return; }
    setOtpError('');
  }, [verifyOtp]);

  const handleCompleteOnboardingDetails = useCallback(() => {
    if (user) localStorage.setItem(`onboarding_done_${user.uid}`, 'true');
    handleNavigate('dashboard');
  }, [handleNavigate, user]);

  const handleStartCheckIn = useCallback(() => setActiveView('check-in'), []);
  const handleBackToDashboard = useCallback(() => setActiveView('dashboard'), []);
  const handleToggleSfx = useCallback(() => setSfxEnabled(p => !p), []);

  const handleCheckinComplete = useCallback((score: number, streak: number) => {
    setStreakCount(streak);
    setJeevaScore(score);
    if (user) localStorage.setItem(`lastCheckinDate_${user.uid}`, new Date().toDateString());
    if (user) cache.invalidatePrefix(`insights_`);
  }, [user]);

  if (activeView === null) {
    return (
      <>
        <AmbientBackground />
        <div className="relative flex flex-col mx-auto min-h-screen items-center justify-center"
          style={{ maxWidth: 480, minHeight: '100dvh' }}>
          <div className="w-16 h-16 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-teal-light)', borderTopColor: 'transparent' }} />
        </div>
      </>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView sfxEnabled={sfxEnabled} onStartCheckIn={handleStartCheckIn} streakCount={streakCount} jeevaScore={jeevaScore} onNavigate={handleNavigate} reminders={reminders} />;
      case 'check-in':
        return <CheckInView onBack={handleBackToDashboard} onComplete={handleCheckinComplete} />;
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
        return <OnboardingView onNavigate={handleNavigate} onGoogleSignUp={handleGoogleSignUp} />;
      case 'phone-sign-in':
        return <PhoneSignInView onBack={() => handleNavigate('onboarding')} onContinue={handlePhoneContinue} error={otpError} />;
      case 'otp-verify':
        return <OtpVerifyView onBack={() => handleNavigate('phone-sign-in')} onVerify={handleOtpVerify} phone={pendingPhone} error={otpError} />;
      case 'onboarding-details':
        return <OnboardingDetailsView
          onComplete={handleCompleteOnboardingDetails}
          initialName={
            profile?.name && profile.name !== 'Wellness Explorer'
              ? profile.name
              : (user?.displayName ?? '')
          }
        />;
      default:
        return (
          <div className="relative flex flex-col mx-auto min-h-screen items-center justify-center"
            style={{ maxWidth: 480, minHeight: '100dvh' }}>
            <div className="w-16 h-16 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--color-teal-light)', borderTopColor: 'transparent' }} />
          </div>
        );
    }
  };

  const isAuthView = AUTH_VIEWS.includes(activeView);

  return (
    // Root application layer that maps perfectly over your background assets
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-bg text-text selection:bg-teal">
      
      {/* 1. Fixed Background layer so graphics never collapse or stretch layout items */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <AmbientBackground />
      </div>

      {/* 2. Streak overlay components wrapper */}
      {showStreakPopup && !isAuthView && (
        <div className="relative z-50">
          <StreakPopup streakCount={streakCount} onClose={handleClaimStreak} />
        </div>
      )}

      {/* 3. Main content phone frame shell wrapper */}
      <div 
        id="app" 
        className="relative z-10 flex flex-col mx-auto min-h-screen min-h-[100dvh] w-full"
        style={{ maxWidth: 480 }}
      >
        {/* Dynamic view components container */}
        <main className="flex-1 w-full relative">
          {renderView()}
        </main>
        
        {/* Navigation panel layout constraints */}
        {!isAuthView && (
          <div className="sticky bottom-0 left-0 right-0 w-full z-40">
            <BottomNav 
              activeView={activeView} 
              onNavigate={handleNavigate} 
              lightMode={activeView === 'check-in'} 
            />
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
