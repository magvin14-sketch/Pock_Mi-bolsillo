import { useEffect, useRef } from 'react';
import { ViewType } from '../types';

export const ORDERED_VIEWS: ViewType[] = [
  'inicio',
  'historial',
  'ahorros',
  'deudas',
  'resumen',
  'ajustes',
];

interface SwipeNavigationOptions {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  enabled?: boolean;
}

export function useSwipeNavigation({
  currentView,
  onNavigate,
  enabled = true,
}: SwipeNavigationOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      // Ignore multi-touch (e.g. pinch attempts)
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore touches starting inside interactive form controls
      const isInput = target.closest('input, textarea, select, button, [role="button"], [role="dialog"]');
      if (isInput) {
        // Still allow swipe if touching the general background of a card/view, but not inside specific form controls
        const isFormInput = target.closest('input, textarea, select');
        if (isFormInput) {
          touchStartRef.current = null;
          return;
        }
      }

      // Ignore touches starting inside horizontal scroll areas (e.g. category pill carousels, charts)
      const isHorizontalScroll = target.closest('.overflow-x-auto, .recharts-responsive-container, [data-prevent-swipe="true"]');
      if (isHorizontalScroll) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      // Swipe thresholds:
      // Minimum 55px horizontal swipe
      // Horizontal motion must be clearly dominant over vertical motion (1.4x)
      // Must happen within 550ms
      const isFastEnough = elapsed < 550;
      const isDominantHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
      const isFarEnough = Math.abs(deltaX) >= 55;

      if (isFastEnough && isDominantHorizontal && isFarEnough) {
        const currentIdx = ORDERED_VIEWS.indexOf(currentViewRef.current);
        if (currentIdx === -1) return;

        if (deltaX < 0) {
          // Swipe Left -> Next Tab
          if (currentIdx < ORDERED_VIEWS.length - 1) {
            const nextView = ORDERED_VIEWS[currentIdx + 1];
            try {
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(8);
              }
            } catch {
              // Ignore if unsupported
            }
            onNavigate(nextView);
          }
        } else {
          // Swipe Right -> Previous Tab
          if (currentIdx > 0) {
            const prevView = ORDERED_VIEWS[currentIdx - 1];
            try {
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(8);
              }
            } catch {
              // Ignore if unsupported
            }
            onNavigate(prevView);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onNavigate]);
}
