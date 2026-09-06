import React, { useState, useEffect, useCallback } from 'react';
import { AppData, Movement, ViewType, LanguageCode, ThemeMode } from './types';
import { INITIAL_DATA, TEXTOS } from './config';
import { loadStoredData, saveStoredData, BASE_CATEGORIES } from './utils';
import { useTheme } from './hooks/useTheme';
import { useMovements } from './hooks/useMovements';
import { useSavings } from './hooks/useSavings';
import { useDebts } from './hooks/useDebts';
import { useMonthCut } from './hooks/useMonthCut';
import { Sidebar } from './components/Sidebar';
import { InicioView } from './components/views/InicioView';
import { HistorialView } from './components/views/HistorialView';
import { ResumenView } from './components/views/ResumenView';
import { DeudasView } from './components/views/DeudasView';
import { AhorrosView } from './components/views/AhorrosView';
import { AjustesView } from './components/views/AjustesView';
import { AbonoModal } from './components/AbonoModal';
import { UndoToast } from './components/UndoToast';
import { AuthSyncModal } from './components/AuthSyncModal';
import { useAuthSync } from './hooks/useAuthSync';
import { ExternalLink, WifiOff, Wifi, X } from 'lucide-react';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';
import { motion, AnimatePresence } from 'motion/react';

const ORDERED_VIEWS: ViewType[] = [
  'inicio',
  'historial',
  'ahorros',
  'deudas',
  'resumen',
  'ajustes',
];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? 44 : -44,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? -44 : 44,
    opacity: 0,
  }),
};

export default function App() {
  const [data, setData] = useState<AppData>(() => loadStoredData());
  const [viewState, setViewState] = useState<{ view: ViewType; direction: number }>({
    view: 'inicio',
    direction: 0,
  });
  const currentView = viewState.view;
  const direction = viewState.direction;

  const handleSelectView = useCallback((newView: ViewType) => {
    setViewState((prev) => {
      if (prev.view === newView) return prev;
      const oldIdx = ORDERED_VIEWS.indexOf(prev.view);
      const newIdx = ORDERED_VIEWS.indexOf(newView);
      const dir = newIdx >= oldIdx ? 1 : -1;
      return { view: newView, direction: dir };
    });
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleDataFromCloud = useCallback((cloudData: AppData) => {
    setData(cloudData);
  }, []);

  const {
    user,
    session,
    isConfigured,
    isSyncing,
    lastSyncTime,
    syncError,
    signUp,
    signIn,
    signOut,
    syncNow,
    notifyMovementAdded,
    notifyMovementDeleted,
    notifyBudgetsChanged,
    notifyUserDataChanged,
  } = useAuthSync(data, handleDataFromCloud);

  const commitData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...next, updated_at: new Date().toISOString() };
    });
  }, []);

  const { theme, effectiveTheme, setTheme } = useTheme(data.tema);
  const [isInsideIframe, setIsInsideIframe] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [offlineAlertStatus, setOfflineAlertStatus] = useState<'offline' | 'back-online'>('offline');

  // Dynamically synchronize browser favicon while keeping the app install icon permanently clean and dark
  useEffect(() => {
    const isLight = effectiveTheme === 'light';
    const svgFavicon = document.getElementById('app-favicon-svg') as HTMLLinkElement | null;
    const pngFavicon = document.getElementById('app-favicon-png') as HTMLLinkElement | null;
    const appleTouchIcon = document.getElementById('app-apple-touch-icon') as HTMLLinkElement | null;

    // App installation icon on iOS/Android stays permanently the clean full-bleed dark icon
    if (appleTouchIcon) {
      appleTouchIcon.href = '/apple-touch-icon.png';
    }

    const svgPath = isLight ? '/icon-light.svg' : '/icon.svg';
    const pngPath = isLight ? '/favicon-light.png' : '/favicon.png';

    if (svgFavicon) svgFavicon.href = svgPath;
    if (pngFavicon) pngFavicon.href = pngPath;
  }, [effectiveTheme]);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setOfflineAlertStatus('back-online');
      setShowOfflineAlert(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineAlertStatus('offline');
      setShowOfflineAlert(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 4500);
    };

    // If starting initial session offline, show subtle toast once then auto-hide
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOfflineAlertStatus('offline');
      setShowOfflineAlert(true);
      hideTimer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 4500);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enable native-like swipe gestures between menus
  useSwipeNavigation({
    currentView,
    onNavigate: handleSelectView,
    enabled: true,
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.self !== window.top) {
        setIsInsideIframe(true);
      }
    } catch {
      setIsInsideIframe(true);
    }
  }, []);

  // Sync to local storage whenever data changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Debounced sync of user profile, debts, goals, fixed expenses to cloud when logged in
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      notifyUserDataChanged(data);
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    user?.id,
    data.dinero_libre,
    data.limite_alerta,
    data.idioma_actual,
    data.tema,
    data.deudas,
    data.metas_ahorro,
    data.gastos_fijos,
    data.historial_cortes,
    data.categorias_personalizadas,
    data.categorias_ocultas,
    notifyUserDataChanged,
  ]);

  const lang = data.idioma_actual;
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const handleThemeChange = useCallback(
    (newTheme: ThemeMode) => {
      setTheme(newTheme);
      commitData((prev) => ({ ...prev, tema: newTheme }));
    },
    [setTheme]
  );

  // Movement CRUD (add / edit / delete / undo) — see hooks/useMovements.ts
  const {
    deletedMovement,
    setDeletedMovement,
    handleAddMovement,
    handleEditMovement,
    handleDeleteMovement,
    handleUndoDeleteMovement,
  } = useMovements({
    historial: data.historial,
    commitData,
    notifyMovementAdded,
    notifyMovementDeleted,
  });

  // Save category budget caps
  const handleSavePresupuestos = useCallback(
    (nuevosPresupuestos: Record<string, number>) => {
      commitData((prev) => ({
        ...prev,
        presupuestos_categoria: nuevosPresupuestos,
      }));
      notifyBudgetsChanged(nuevosPresupuestos);
    },
    [notifyBudgetsChanged]
  );

  // Month cut (Corte de Mes) + fixed-expense logic — see hooks/useMonthCut.ts
  const { handleUpdateGastosFijos, handleAplicarGastosFijosManual, handleEjecutarCorte } = useMonthCut({
    commitData,
    saldoBaseLabel: t('saldo_base'),
  });

  // Debt (deudas) logic — see hooks/useDebts.ts
  const {
    deudaParaAbono,
    setDeudaParaAbono,
    handleRegistrarDeuda,
    handleConfirmarAbono,
    handleEliminarDeuda,
  } = useDebts({ commitData });

  // Savings goal (metas de ahorro) logic — see hooks/useSavings.ts
  const { handleSaveGoal, handleDeleteGoal, handleDepositToGoal, handleWithdrawFromGoal } = useSavings({
    commitData,
  });

  // Add category (custom or restore deleted)
  const handleAddCustomCategory = useCallback((categoria: string) => {
    commitData((prev) => {
      const clean = categoria.trim();
      if (!clean) return prev;
      const existentes = prev.categorias_personalizadas || [];
      const ocultas = prev.categorias_ocultas || [];

      const nextOcultas = ocultas.filter((c) => c.toLowerCase() !== clean.toLowerCase());
      const isBase = BASE_CATEGORIES.some((c) => c.toLowerCase() === clean.toLowerCase());

      let nextPersonalizadas = existentes;
      if (!isBase && !existentes.some((c) => c.toLowerCase() === clean.toLowerCase())) {
        nextPersonalizadas = [...existentes, clean];
      }

      return {
        ...prev,
        categorias_personalizadas: nextPersonalizadas,
        categorias_ocultas: nextOcultas,
      };
    });
  }, []);

  // Delete category (any category, default or custom)
  const handleDeleteCategory = useCallback((categoria: string) => {
    commitData((prev) => {
      const clean = categoria.toLowerCase();
      const nextPersonalizadas = (prev.categorias_personalizadas || []).filter(
        (c) => c.toLowerCase() !== clean
      );
      const ocultas = prev.categorias_ocultas || [];
      const nextOcultas = ocultas.includes(clean) ? ocultas : [...ocultas, clean];

      return {
        ...prev,
        categorias_personalizadas: nextPersonalizadas,
        categorias_ocultas: nextOcultas,
      };
    });
  }, []);

  // Restore individual deleted default category
  const handleRestoreCategory = useCallback((categoria: string) => {
    commitData((prev) => {
      const clean = categoria.toLowerCase();
      return {
        ...prev,
        categorias_ocultas: (prev.categorias_ocultas || []).filter(
          (c) => c.toLowerCase() !== clean
        ),
      };
    });
  }, []);

  // Restore all default categories
  const handleRestoreAllDefaultCategories = useCallback(() => {
    commitData((prev) => ({
      ...prev,
      categorias_ocultas: [],
    }));
  }, []);

  // Save low balance alert threshold
  const handleGuardarLimite = useCallback((nuevoLimite: number) => {
    commitData((prev) => ({
      ...prev,
      limite_alerta: nuevoLimite,
    }));
  }, []);

  // Change app language
  const handleChangeLang = useCallback((newLang: LanguageCode) => {
    commitData((prev) => ({
      ...prev,
      idioma_actual: newLang,
    }));
  }, []);

  // Import full JSON
  const handleImportData = useCallback((imported: AppData) => {
    commitData(imported);
  }, []);

  // Reset to default
  const handleResetDefault = useCallback(() => {
    commitData({ ...INITIAL_DATA, historial: [], deudas: [], metas_ahorro: [], presupuestos_categoria: {}, gastos_fijos: [], historial_cortes: [], categorias_personalizadas: [], categorias_ocultas: [], deleted_movements: [] });
  }, []);

  const mainViews = (
    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
      <motion.div
        key={currentView}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 360, damping: 32 },
          opacity: { duration: 0.18, ease: 'easeOut' },
        }}
        className="w-full"
      >
        {currentView === 'inicio' && (
          <InicioView
            dineroLibre={data.dinero_libre}
            limiteAlerta={data.limite_alerta}
            historial={data.historial}
            presupuestos={data.presupuestos_categoria || {}}
            categoriasPersonalizadas={data.categorias_personalizadas || []}
            categoriasOcultas={data.categorias_ocultas || []}
            lang={lang}
            onAddMovement={handleAddMovement}
            onSavePresupuestos={handleSavePresupuestos}
            onNavigateToHistorial={() => handleSelectView('historial')}
          />
        )}

        {currentView === 'historial' && (
          <HistorialView
            historial={data.historial}
            categoriasPersonalizadas={data.categorias_personalizadas || []}
            categoriasOcultas={data.categorias_ocultas || []}
            lang={lang}
            onDeleteMovement={handleDeleteMovement}
            onEditMovement={handleEditMovement}
          />
        )}

        {currentView === 'ahorros' && (
          <AhorrosView
            metas={data.metas_ahorro || []}
            dineroLibreActual={data.dinero_libre}
            lang={lang}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
            onDepositToGoal={handleDepositToGoal}
            onWithdrawFromGoal={handleWithdrawFromGoal}
          />
        )}

        {currentView === 'deudas' && (
          <DeudasView
            deudas={data.deudas}
            lang={lang}
            onRegistrarDeuda={handleRegistrarDeuda}
            onIniciarAbono={(deuda) => setDeudaParaAbono(deuda)}
            onEliminarDeuda={handleEliminarDeuda}
          />
        )}

        {currentView === 'resumen' && (
          <ResumenView
            dineroLibreActual={data.dinero_libre}
            historial={data.historial}
            gastosFijos={data.gastos_fijos || []}
            historialCortes={data.historial_cortes || []}
            lang={lang}
            onEjecutarCorte={handleEjecutarCorte}
            onUpdateGastosFijos={handleUpdateGastosFijos}
            onAplicarGastosFijosManual={handleAplicarGastosFijosManual}
          />
        )}

        {currentView === 'ajustes' && (
          <AjustesView
            appData={data}
            lang={lang}
            theme={theme}
            categoriasPersonalizadas={data.categorias_personalizadas || []}
            categoriasOcultas={data.categorias_ocultas || []}
            user={user}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onGuardarLimite={handleGuardarLimite}
            onChangeLang={handleChangeLang}
            onChangeTheme={handleThemeChange}
            onImportData={handleImportData}
            onResetDefault={handleResetDefault}
            onAddCustomCategory={handleAddCustomCategory}
            onDeleteCategory={handleDeleteCategory}
            onRestoreCategory={handleRestoreCategory}
            onRestoreAllDefaultCategories={handleRestoreAllDefaultCategories}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );

  const iframeNotice = isInsideIframe ? (
    <div className="w-full bg-[#14231E] border-b border-[#35D0BA]/30 px-3 py-2 flex items-center justify-between text-xs text-[#E1FBF6] z-50 sticky top-0 shadow-md">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[#35D0BA]">📱 Estás en el visor de AI Studio</span>
        <span className="hidden sm:inline text-[#9AA3AD]">| Para usar Pock independiente:</span>
      </div>
      <a
        href={window.location.href}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1 bg-[#35D0BA] text-[#07150D] font-bold rounded-md hover:bg-[#2EB39E] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
      >
        <span>Abrir App Completa</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#17191C] text-[#F4F6F8] flex flex-col antialiased font-sans">
      {iframeNotice}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar (Desktop) and Top/Bottom Nav (Mobile) */}
        <Sidebar
          currentView={currentView}
          onSelectView={handleSelectView}
          lang={lang}
          theme={effectiveTheme}
          user={user}
          isSyncing={isSyncing}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Main Content Area with ample bottom clearance for mobile nav and hidden horizontal overflow for slide animation */}
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto no-scrollbar px-4 sm:px-8 pt-3 pb-28 md:py-8 max-w-6xl mx-auto w-full">
          {mainViews}
        </main>
      </div>

      {/* Cloud Auth & Synchronization Modal */}
      <AuthSyncModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        syncError={syncError}
        appData={data}
        onSignIn={signIn}
        onSignUp={signUp}
        onSignOut={signOut}
        onSyncNow={syncNow}
        lang={lang}
      />

      {/* Subtle Offline Mode Toast (Auto-hides / Dismissible) */}
      <AnimatePresence>
        {showOfflineAlert && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[90] ${
              offlineAlertStatus === 'back-online'
                ? 'bg-[#121E1C]/95 border-[#35D0BA]/50 text-[#E6FAF6]'
                : 'bg-[#1E2024]/95 border-[#E5A93C]/40 text-[#F4F6F8]'
            } border pl-3.5 pr-2 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-medium backdrop-blur-md max-w-[92vw] select-none`}
          >
            {offlineAlertStatus === 'back-online' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#35D0BA] shrink-0" />
                <Wifi className="w-3.5 h-3.5 text-[#35D0BA] shrink-0" />
                <span className="truncate">
                  {lang === 'es' ? 'De nuevo en línea' : 'Back online'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#E5A93C] shrink-0 animate-ping" />
                <WifiOff className="w-3.5 h-3.5 text-[#E5A93C] shrink-0" />
                <span className="truncate">
                  {lang === 'es'
                    ? 'Modo offline: datos guardados localmente'
                    : 'Offline mode: data saved locally'}
                </span>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowOfflineAlert(false)}
              className="p-1 rounded-full text-[#9AA3AD] hover:text-[#F4F6F8] hover:bg-white/10 transition-colors ml-1"
              aria-label={lang === 'es' ? 'Cerrar aviso' : 'Dismiss notice'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abono Modal */}
      {deudaParaAbono && (
        <AbonoModal
          deuda={deudaParaAbono}
          dineroLibre={data.dinero_libre}
          lang={lang}
          onConfirm={handleConfirmarAbono}
          onClose={() => setDeudaParaAbono(null)}
        />
      )}

      {/* Undo Movement Deletion Toast */}
      {deletedMovement && (
        <UndoToast
          message={
            lang === 'es'
              ? `Movimiento "${deletedMovement.movement.desc}" eliminado`
              : `Movement "${deletedMovement.movement.desc}" deleted`
          }
          undoLabel={lang === 'es' ? 'Deshacer' : 'Undo'}
          onUndo={handleUndoDeleteMovement}
          onClose={() => setDeletedMovement(null)}
          duration={5000}
        />
      )}
    </div>
  );
}
