import type { ViewId } from '../types';
import { sounds } from '../utils/audio';
import { AudioWaveform } from 'lucide-react'; 

interface BottomNavProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  lightMode?: boolean; // Kept to prevent type errors from parent, but styles are now unified to the dark/green theme
}

const navItems: { target: ViewId; icon: string; isLucide?: boolean }[] = [
  { target: 'dashboard', icon: 'fa-solid fa-house' },
  { target: 'insights', icon: 'fa-solid fa-chart-line' },
  { target: 'tools', icon: 'audio-waveform', isLucide: true }, 
  { target: 'journal', icon: 'fa-solid fa-book' },
  { target: 'profile', icon: 'fa-regular fa-user' },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate }) => {
  const handleClick = (target: ViewId) => {
    sounds.click();
    onNavigate(target);
  };

  return (
    <nav
      id="bottom-nav"
      className="fixed left-1/2 -translate-x-1/2 flex justify-around items-center z-[100]"
      style={{
        bottom: 'calc(12px + env(safe-area-inset-bottom, 8px))',
        width: 'min(calc(100% - 32px), calc(100vw - 32px))',
        maxWidth: 432,
        height: 'clamp(58px, 10vw, 70px)',
        borderRadius: 35,
        background: 'rgba(2, 6, 23, 0.65)', // Deep dark blue glass
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {navItems.map((item) => {
        const isActive = activeView === item.target || (item.target === 'tools' && activeView === 'check-in');

        return (
          <div
            key={item.target}
            id={`nav-${item.target}`}
            onClick={() => handleClick(item.target)}
            className="relative cursor-pointer flex flex-col items-center justify-center transition-all duration-300"
            style={{
              width: 'clamp(40px, 10vw, 48px)',
              height: 'clamp(40px, 10vw, 48px)',
              color: isActive ? '#10b981' : '#64748b', // Emerald green when active, slate when inactive
              transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              textShadow: isActive && !item.isLucide ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
            }}
          >
            {/* Render Lucide component or FontAwesome <i> tag */}
            {item.isLucide ? (
               <AudioWaveform 
                 size={20} 
                 style={{ 
                   filter: isActive ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' : 'none',
                   transition: 'filter 0.3s ease'
                 }} 
               />
            ) : (
               <i className={`${item.icon} text-[20px]`} />
            )}
            
            {/* Glowing Active Dot Indicator */}
            <div 
              data-no-min-size
              className={`absolute bottom-0 w-[5px] h-[5px] rounded-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
              style={{ 
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}
            />
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;