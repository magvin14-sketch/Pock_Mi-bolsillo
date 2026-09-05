import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Lock pinch zoom and gesture zooming on iOS Safari
if (typeof document !== 'undefined') {
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
}

// Register Service Worker for offline PWA capability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true);
      },
      onRegistered(registration) {
        console.log('Pock offline Service Worker registered:', registration?.scope);
      },
      onRegisterError(error) {
        console.warn('Pock Service Worker registration error:', error);
      },
    });
  } catch (err) {
    console.warn('SW registration call exception:', err);
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.dataset.mounted = 'true';
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
