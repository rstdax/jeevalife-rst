import type { ViewId } from '../types';
import { sounds } from '../utils/audio';

interface BottomNavProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
}

const navItems: { target: ViewId; icon: string; isFab?: boolean }[] = [
  { target: 'dashboard', icon: 'fa-solid fa-house' },
  { target: 'insights', icon: 'fa-solid fa-chart-line' },
  { target: 'tools', icon: 'fa-solid fa-droplet', isFab: true },
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
      className="glass-panel fixed left-1/2 -translate-x-1/2 flex justify-around items-center z-100"
      style={{
        bottom: 'calc(12px + env(safe-area-inset-bottom, 8px))',
        width: 'calc(100% - 48px)',
        maxWidth: 432,
        height: 70,
        borderRadius: 35,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}
    >
      {navItems.map((item) => {
        const isActive = activeView === item.target || (item.target === 'tools' && activeView === 'check-in');

        if (item.isFab) {
          return (
            <div
              key={item.target}
              id={`nav-${item.target}`}
              onClick={() => handleClick(item.target)}
              className="cursor-pointer flex justify-center items-center text-white text-2xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-cyan), #009efd)',
                width: 55,
                height: 55,
                borderRadius: '50%',
                transform: `translateY(-20px)${isActive ? '' : ''}`,
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 20px rgba(0, 242, 254, 0.3)',
                transition: 'transform 0.2s var(--ease-spring)',
              }}
            >
              <i className={item.icon} />
            </div>
          );
        }

        return (
          <div
            key={item.target}
            id={`nav-${item.target}`}
            onClick={() => handleClick(item.target)}
            className={`relative cursor-pointer text-xl p-3 transition-all ${
              isActive ? 'text-white -translate-y-[3px]' : 'text-gray-500'
            }`}
            style={{ transition: 'all 0.3s var(--ease-spring)' }}
          >
            <i className={item.icon} />
            {isActive && (
              <span
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  backgroundColor: 'var(--color-gold)',
                }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
