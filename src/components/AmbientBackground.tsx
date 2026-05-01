import { memo } from 'react';
import { isAndroid } from '../utils/performance';

/**
 * AmbientBackground renders decorative blurred blobs behind the app.
 * On Android, blur radius is halved and elements are GPU-promoted via
 * will-change + translateZ(0) to avoid main-thread compositing jank.
 * 
 * Memoized because this component never needs to re-render.
 */
const AmbientBackground: React.FC = memo(() => {
  const android = isAndroid();
  // Android: smaller blur (40px vs 80px), fewer/smaller blobs
  const blurRadius = android ? 40 : 80;
  const blob1Size = android ? 200 : 300;
  const blob2Size = android ? 260 : 400;
  const blob3Size = android ? 170 : 250;
  // Slower animation on Android = fewer repaints per second
  const animDuration = android ? '30s' : '20s';

  return (
    <div className="fixed inset-0 -z-1 overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <div
        className="absolute rounded-full opacity-50 ambient-blob"
        style={{
          top: '-10%',
          left: '-10%',
          width: blob1Size,
          height: blob1Size,
          background: 'var(--color-teal)',
          filter: `blur(${blurRadius}px)`,
          animation: `floatBlob ${animDuration} infinite alternate ease-in-out`,
          willChange: 'transform',
          transform: 'translateZ(0)',
          contain: 'strict' as const,
        }}
      />
      <div
        className="absolute rounded-full opacity-50 ambient-blob"
        style={{
          bottom: '10%',
          right: '-10%',
          width: blob2Size,
          height: blob2Size,
          background: 'rgba(212, 175, 55, 0.2)',
          filter: `blur(${blurRadius}px)`,
          animation: `floatBlob ${animDuration} infinite alternate ease-in-out`,
          animationDelay: '-5s',
          willChange: 'transform',
          transform: 'translateZ(0)',
          contain: 'strict' as const,
        }}
      />
      <div
        className="absolute rounded-full opacity-50 ambient-blob"
        style={{
          top: '40%',
          left: '40%',
          width: blob3Size,
          height: blob3Size,
          background: 'rgba(16, 185, 129, 0.15)',
          filter: `blur(${blurRadius}px)`,
          animation: `floatBlob ${animDuration} infinite alternate ease-in-out`,
          animationDelay: '-10s',
          willChange: 'transform',
          transform: 'translateZ(0)',
          contain: 'strict' as const,
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';

export default AmbientBackground;
