import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __PWA_PROMPT__?: BeforeInstallPromptEvent | null;
  }
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isInsideIframe: boolean;
  isOnline: boolean;
  install: () => Promise<'accepted' | 'dismissed' | 'unsupported'>;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? window.__PWA_PROMPT__ || null : null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isInsideIframe, setIsInsideIframe] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(standalone);
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    try {
      mediaQuery.addEventListener('change', checkStandalone);
    } catch {
      // Fallback for older browsers
    }

    // Platform detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    const isMobileDevice = isIOSDevice || isAndroidDevice || /mobile/.test(ua);
    const inIframe = window.self !== window.top;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);
    setIsInsideIframe(inIframe);

    // Prompt listeners
    if (window.__PWA_PROMPT__) {
      setDeferredPrompt(window.__PWA_PROMPT__);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__PWA_PROMPT__ = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptReady = () => {
      if (window.__PWA_PROMPT__) {
        setDeferredPrompt(window.__PWA_PROMPT__);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__PWA_PROMPT__ = null;
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      try {
        mediaQuery.removeEventListener('change', checkStandalone);
      } catch {}
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const prompt = deferredPrompt || window.__PWA_PROMPT__;
    if (!prompt) {
      return 'unsupported';
    }

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.__PWA_PROMPT__ = null;
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('PWA prompt error:', err);
      return 'unsupported';
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt || !!(typeof window !== 'undefined' && window.__PWA_PROMPT__),
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    isInsideIframe,
    isOnline,
    install,
  };
}
