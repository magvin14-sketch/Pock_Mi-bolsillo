import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Check, Sparkles, Smartphone, Share, PlusSquare, ExternalLink, X, ShieldCheck, WifiOff, Wifi } from 'lucide-react';
import { LanguageCode } from '../types';
import { ModalPortal } from './ModalPortal';

interface PWAInstallButtonProps {
  lang: LanguageCode;
  variant?: 'compact' | 'full' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang, variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInsideIframe, isOnline, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleAction = async () => {
    // If inside iframe (e.g. preview), prompt opening directly
    if (isInsideIframe) {
      window.open(window.location.href, '_blank');
      return;
    }

    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
      return;
    }

    // Otherwise show platform-specific automated guide
    setShowGuide(true);
  };

  const getDeviceLabel = () => {
    if (isIOS) return 'iPhone / iPad (iOS)';
    if (isAndroid) return 'Android (Chrome / Samsung)';
    return 'Escritorio / Navegador';
  };

  if (variant === 'card') {
    return (
      <div className="bg-[#17191C] border border-[#30353B] rounded-xl p-4 sm:p-5 space-y-4">
        {/* Device & Offline status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#30353B]/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#35D0BA] animate-pulse" />
            <span className="text-xs font-semibold text-[#F4F6F8]">
              {getDeviceLabel()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#202328] border border-[#30353B] text-[11px] font-medium text-[#9AA3AD]">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-[#2BC77B]" />
                <span>{lang === 'es' ? 'En línea' : 'Online'}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-[#E5A93C]" />
                <span className="text-[#E5A93C] font-semibold">{lang === 'es' ? 'Modo Offline activo' : 'Offline Mode active'}</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#35D0BA]">
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'es' ? '100% Funcional Sin Internet' : '100% Offline Capable'}</span>
          </div>
          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {lang === 'es'
              ? 'Todos tus registros, saldos, categorías y presupuestos se guardan de forma permanente e instantánea en tu dispositivo. Puedes abrir y usar Pock sin conexión wifi ni datos móviles.'
              : 'All your records, balances, categories and budgets are stored permanently and instantly on your device. Use Pock without wifi or mobile data.'}
          </p>
        </div>

        {/* Action Button */}
        {isInstalled ? (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#2BC77B]/10 border border-[#2BC77B]/30 text-[#2BC77B] text-xs font-bold">
            <Check className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'es'
                ? '¡Pock ya está instalada y activa en este dispositivo!'
                : 'Pock is already installed and active on this device!'}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              id="btn-pwa-auto-install"
              type="button"
              onClick={handleAction}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#35D0BA] active:bg-[#2EB39E] hover:bg-[#2EB39E] text-[#07150D] text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.99]"
            >
              {isInstallable ? (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{lang === 'es' ? 'Instalar Pock Automáticamente' : 'Install Pock Automatically'}</span>
                </>
              ) : isInsideIframe ? (
                <>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>{lang === 'es' ? 'Abrir e Instalar en tu Navegador' : 'Open & Install in Browser'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>
                    {isIOS
                      ? (lang === 'es' ? 'Instalar en iPhone / iPad' : 'Install on iPhone / iPad')
                      : (lang === 'es' ? 'Instalar en este Dispositivo' : 'Install on this Device')}
                  </span>
                </>
              )}
            </button>

            {installSuccess && (
              <p className="text-xs font-semibold text-[#2BC77B] flex items-center justify-center gap-1.5 text-center">
                <Check className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? '¡Pock se ha instalado con éxito!' : 'Pock installed successfully!'}</span>
              </p>
            )}
          </div>
        )}

        {/* Modal guide */}
        {showGuide && (
          <ModalPortal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="w-full max-w-md rounded-2xl bg-[#202328] border border-[#30353B] p-5 sm:p-6 shadow-2xl text-[#F4F6F8] space-y-4 max-h-[90vh] overflow-y-auto my-auto animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[#30353B]/60">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#35D0BA]/15 text-[#35D0BA]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#F4F6F8]">
                        {isIOS
                          ? (lang === 'es' ? 'Instalación en iPhone / iPad' : 'iPhone / iPad Installation')
                          : (lang === 'es' ? 'Instalación en tu dispositivo' : 'Device Installation')}
                      </h3>
                      <p className="text-[11px] text-[#9AA3AD]">{getDeviceLabel()}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide(false)}
                    className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1.5 rounded-lg hover:bg-[#272B30] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isIOS ? (
                  <div className="space-y-3 text-xs text-[#9AA3AD] leading-relaxed">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#17191C] border border-[#30353B]/60">
                      <div className="p-2 rounded-lg bg-[#272B30] text-[#35D0BA] shrink-0 font-bold">
                        <Share className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[#F4F6F8] font-bold">1. Toca Compartir en Safari</p>
                        <p className="text-[11px] text-[#9AA3AD] mt-0.5">
                          Presiona el ícono de <strong>Compartir</strong> (el cuadrado con flecha hacia arriba) en la barra inferior de Safari.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#17191C] border border-[#30353B]/60">
                      <div className="p-2 rounded-lg bg-[#272B30] text-[#35D0BA] shrink-0 font-bold">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[#F4F6F8] font-bold">2. Agregar a Inicio</p>
                        <p className="text-[11px] text-[#9AA3AD] mt-0.5">
                          Desliza hacia abajo en las opciones y selecciona <strong>"Agregar al inicio"</strong> o <strong>"Add to Home Screen"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#17191C] border border-[#30353B]/60">
                      <div className="p-2 rounded-lg bg-[#272B30] text-[#35D0BA] shrink-0 font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[#F4F6F8] font-bold">3. ¡Listo para usar Offline!</p>
                        <p className="text-[11px] text-[#9AA3AD] mt-0.5">
                          Toca <strong>"Agregar"</strong> en la esquina superior derecha. Pock se abrirá como app independiente sin barras de navegador y funcionará 100% offline.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-[#9AA3AD] leading-relaxed">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#17191C] border border-[#30353B]/60">
                      <div className="w-7 h-7 rounded-lg bg-[#272B30] text-[#35D0BA] flex items-center justify-center shrink-0 font-bold text-xs">
                        1
                      </div>
                      <div>
                        <p className="text-[#F4F6F8] font-bold">Abre el menú del navegador (⋮)</p>
                        <p className="text-[11px] text-[#9AA3AD] mt-0.5">
                          Toca los tres puntos en la esquina superior derecha en Chrome, Edge o Samsung Internet.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#17191C] border border-[#30353B]/60">
                      <div className="w-7 h-7 rounded-lg bg-[#272B30] text-[#35D0BA] flex items-center justify-center shrink-0 font-bold text-xs">
                        2
                      </div>
                      <div>
                        <p className="text-[#F4F6F8] font-bold">Selecciona "Instalar aplicación"</p>
                        <p className="text-[11px] text-[#9AA3AD] mt-0.5">
                          O elige <strong>"Agregar a la pantalla principal"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#17191C] border border-[#30353B]/60">
                      <div className="w-7 h-7 rounded-lg bg-[#272B30] text-[#35D0BA] flex items-center justify-center shrink-0 font-bold text-xs">
                        3
                      </div>
                      <div>
                        <p className="text-[#F4F6F8] font-bold">¡Confirma la instalación!</p>
                        <p className="text-[11px] text-[#9AA3AD] mt-0.5">
                          Pock quedará instalada como app nativa y funcionará de inmediato con o sin internet.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="w-full py-3 bg-[#35D0BA] active:bg-[#2EB39E] hover:bg-[#2EB39E] text-[#07150D] text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'es' ? 'Entendido' : 'Got it'}
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>
    );
  }

  // Compact or full button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        id="btn-pwa-install-quick"
        type="button"
        onClick={handleAction}
        className={`inline-flex items-center gap-2 rounded-xl bg-[#35D0BA] active:bg-[#2EB39E] hover:bg-[#2EB39E] text-[#07150D] font-bold transition-all shadow-sm cursor-pointer ${
          variant === 'full' ? 'w-full justify-center px-4 py-3 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{lang === 'es' ? 'Instalar App' : 'Install App'}</span>
      </button>

      {showGuide && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-md rounded-2xl bg-[#202328] border border-[#30353B] p-5 sm:p-6 shadow-2xl text-[#F4F6F8] space-y-4 my-auto animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#30353B]/60">
                <h3 className="text-sm font-bold text-[#F4F6F8]">
                  {lang === 'es' ? 'Instalar Pock' : 'Install Pock'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1.5 rounded-lg hover:bg-[#272B30] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#9AA3AD] leading-relaxed">
                {isIOS
                  ? (lang === 'es' ? 'En Safari, toca el botón Compartir y elige "Agregar a inicio".' : 'In Safari, tap Share and select "Add to Home Screen".')
                  : (lang === 'es' ? 'En el menú de tu navegador (⋮), selecciona "Instalar aplicación".' : 'In your browser menu (⋮), tap "Install app".')}
              </p>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 bg-[#35D0BA] active:bg-[#2EB39E] hover:bg-[#2EB39E] text-[#07150D] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {lang === 'es' ? 'Entendido' : 'Got it'}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

