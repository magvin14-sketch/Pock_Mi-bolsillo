import React, { memo, useMemo } from 'react';
import { ViewType, LanguageCode } from '../types';
import { TEXTOS } from '../config';
import { Home, History, CalendarDays, ReceiptText, Settings, PiggyBank, Cloud, RefreshCw } from 'lucide-react';
import { PockLogo } from './PockLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  lang: LanguageCode;
  theme?: 'light' | 'dark';
  user?: User | null;
  isSyncing?: boolean;
  onOpenAuthModal?: () => void;
}

const NAV_ITEM_IDS: ViewType[] = ['inicio', 'historial', 'ahorros', 'deudas', 'resumen', 'ajustes'];
const NAV_ICON_MAP: Record<ViewType, React.ComponentType<{ className?: string }>> = {
  inicio: Home,
  historial: History,
  ahorros: PiggyBank,
  deudas: ReceiptText,
  resumen: CalendarDays,
  ajustes: Settings,
};
const NAV_LABEL_KEY: Record<ViewType, keyof typeof TEXTOS['es']> = {
  inicio: 'nav_inicio',
  historial: 'nav_historial',
  ahorros: 'nav_ahorros',
  deudas: 'nav_deudas',
  resumen: 'nav_resumen',
  ajustes: 'nav_ajustes',
};

export const Sidebar: React.FC<SidebarProps> = memo(function Sidebar({
  currentView,
  onSelectView,
  lang,
  theme,
  user,
  isSyncing,
  onOpenAuthModal,
}) {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  // Recalcular las etiquetas solo cuando cambia el idioma, no en cada render de App
  const navItems = useMemo(
    () =>
      NAV_ITEM_IDS.map((id) => ({
        id,
        label: t(NAV_LABEL_KEY[id]),
        Icon: NAV_ICON_MAP[id],
      })),
    [lang]
  );

  return (
    <>
      {/* Desktop Sidebar (visible on md screens and wider) */}
      <aside
        id="app-sidebar"
        className="hidden md:flex flex-col w-56 bg-[#121316] border-r border-[#30353B]/50 shrink-0 h-screen sticky top-0"
      >
        <div className="p-5 pb-6 border-b border-[#30353B]/40 flex items-center justify-between">
          <PockLogo variant="desktop" theme={theme} size="md" showWordmark={true} />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#202328] text-[#35D0BA] border border-[#35D0BA]/30 shadow-sm'
                    : 'text-[#9AA3AD] hover:text-[#F4F6F8] hover:bg-[#202328]/60'
                }`}
              >
                <item.Icon className="w-4 h-4 mr-3 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Cloud Multi-Device Sync Card in Desktop Sidebar */}
        <div className="p-3 border-t border-[#30353B]/40 flex flex-col gap-2">
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                user
                  ? 'bg-[#18201E] border-[#35D0BA]/30 hover:border-[#35D0BA]/60 text-[#E1FBF6]'
                  : 'bg-[#202328]/70 border-[#30353B] hover:border-[#35D0BA]/40 text-[#9AA3AD] hover:text-[#F4F6F8]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  user
                    ? 'bg-[#35D0BA]/20 text-[#35D0BA]'
                    : 'bg-[#121316] text-[#9AA3AD]'
                }`}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#35D0BA]" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">
                    {user ? user.email?.split('@')[0] : (lang === 'es' ? 'Sincronizar nube' : 'Cloud Sync')}
                  </span>
                  {user && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35D0BA] shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-[#9AA3AD] block truncate">
                  {user
                    ? (isSyncing
                        ? (lang === 'es' ? 'Sincronizando...' : 'Syncing...')
                        : (lang === 'es' ? 'Multidispositivo activo' : 'Multi-device active'))
                    : (lang === 'es' ? 'Laptop ⇄ Celular' : 'Laptop ⇄ Mobile')}
                </span>
              </div>
            </button>
          )}

          <PWAInstallButton lang={lang} variant="full" />

          <div className="px-1 text-xs text-[#9AA3AD]/70 flex items-center justify-between">
            <span>Costa Rica (₡)</span>
            <span className="px-1.5 py-0.5 rounded bg-[#202328] text-[10px] text-[#35D0BA] font-mono uppercase">
              {lang}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header (with safe area top padding) */}
      <header
        id="mobile-header"
        className="md:hidden flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-[#121316]/95 backdrop-blur-md border-b border-[#30353B]/60 sticky top-0 z-30"
      >
        <PockLogo variant="mobile" theme={theme} size="sm" showWordmark={true} />

        <div className="flex items-center gap-2">
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                user
                  ? 'bg-[#18201E] border-[#35D0BA]/40 text-[#35D0BA]'
                  : 'bg-[#202328] border-[#30353B] text-[#9AA3AD] hover:text-[#F4F6F8]'
              }`}
              title={lang === 'es' ? 'Sincronización Multidispositivo' : 'Multi-device Sync'}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#35D0BA]" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              {user && <span className="w-1.5 h-1.5 rounded-full bg-[#35D0BA]" />}
            </button>
          )}

          <PWAInstallButton lang={lang} variant="compact" />
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#202328] text-[#35D0BA] font-mono font-bold border border-[#30353B]/60">
            ₡ Colones
          </span>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (with safe area bottom padding) */}
      <nav
        id="mobile-bottom-nav"
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121316]/95 backdrop-blur-md border-t border-[#30353B]/70 items-center justify-around px-1 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl select-none"
      >
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg text-xs transition-all active:scale-95 cursor-pointer relative min-h-[48px] ${
                isActive ? 'text-[#35D0BA] font-bold' : 'text-[#9AA3AD] hover:text-[#F4F6F8]'
              }`}
            >
              <div className={`mb-1 transition-transform ${isActive ? 'scale-110' : 'opacity-80'}`}>
                <item.Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className={`text-[10px] tracking-tight leading-none truncate max-w-full ${isActive ? 'text-[#35D0BA]' : 'text-[#8E97A2]'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-3 h-0.5 bg-[#35D0BA] rounded-full shadow-xs shadow-[#35D0BA]" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
});
