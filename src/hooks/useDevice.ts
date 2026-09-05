import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/**
 * useDevice hook
 * Detecta automáticamente el tipo de dispositivo según el ancho de pantalla.
 * Mobile: < 768px (sm)
 * Desktop: >= 768px (md/lg/xl)
 *
 * Usa matchMedia en vez de escuchar "resize" directamente: solo dispara
 * un nuevo render cuando realmente se cruza el punto de quiebre (768px),
 * no en cada pixel que cambia la ventana. Esto evita renders innecesarios
 * durante rotaciones de pantalla, apertura del teclado en móvil, o al
 * redimensionar la ventana en escritorio.
 */
export function useDevice() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(MOBILE_QUERY);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Sync in case it changed between initial render and effect mount
    handleChange(mediaQuery);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    isMobile,
    isDesktop: !isMobile,
  };
}
