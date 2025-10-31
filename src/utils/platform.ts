/**
 * Platform detection utilities for cross-platform support
 */

/**
 * Detect if the current platform is mobile (iOS or Android)
 */
export function isMobilePlatform(): boolean {
  // Check if running in Tauri
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    // Tauri provides platform information
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // Check for iOS
    if (
      /iphone|ipad|ipod/.test(userAgent) ||
      (platform.includes('mac') && 'ontouchend' in document)
    ) {
      return true;
    }

    // Check for Android
    if (/android/.test(userAgent)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the current platform type
 */
export function getPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // Check for iOS
    if (
      /iphone|ipad|ipod/.test(userAgent) ||
      (platform.includes('mac') && 'ontouchend' in document)
    ) {
      return 'ios';
    }

    // Check for Android
    if (/android/.test(userAgent)) {
      return 'android';
    }
  }

  return 'desktop';
}

/**
 * Check if the current platform is iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Check if the current platform is Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Check if the current platform is desktop
 */
export function isDesktop(): boolean {
  return getPlatform() === 'desktop';
}

/**
 * Check if touch events are supported
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - msMaxTouchPoints is IE specific
    navigator.msMaxTouchPoints > 0
  );
}
