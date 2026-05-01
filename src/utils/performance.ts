// ================= ANDROID PERFORMANCE DETECTION & OPTIMIZATION =================
// Android Chrome handles backdrop-filter, CSS filter blur, and complex box-shadows
// far less efficiently than iOS Safari. This module detects the platform and
// applies class-based overrides so CSS can swap in lighter effects.

/**
 * Returns true if the device is running Android.
 * We check the User-Agent because CSS alone cannot reliably distinguish
 * Android Chrome from desktop Chrome.
 */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Returns true if the device is running iOS.
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Checks if the device has low-end GPU capabilities.
 * Uses a combination of heuristics:
 * - deviceMemory API (Chrome)
 * - hardwareConcurrency (logical cores)
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const nav = navigator as Navigator & {
    deviceMemory?: number;
  };
  
  // Less than 4GB RAM → probably low-end
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) {
    return true;
  }
  
  // 4 or fewer logical cores → probably low-end
  if (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  
  return false;
}

/**
 * Call once at app startup. Sets CSS classes on <html> so that
 * CSS rules can key off them (e.g. `.is-android .glass-card { ... }`).
 */
export function applyPlatformClasses(): void {
  const html = document.documentElement;

  if (isAndroid()) {
    html.classList.add('is-android');
  }

  if (isIOS()) {
    html.classList.add('is-ios');
  }

  if (isLowEndDevice()) {
    html.classList.add('is-low-end');
  }
}

/**
 * Pauses all CSS animations on elements not currently in the viewport.
 * This prevents Android from wasting GPU cycles on off-screen animated elements.
 * Returns a cleanup function.
 */
export function setupViewportAnimationPausing(): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.style.animationPlayState = 'running';
        } else {
          el.style.animationPlayState = 'paused';
        }
      });
    },
    { rootMargin: '50px' }
  );

  // Observe elements that have CSS animations
  const animated = document.querySelectorAll('[data-animate]');
  animated.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}
