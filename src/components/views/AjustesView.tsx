import React, { useState } from 'react';
import { AppData, LanguageCode, ThemeMode } from '../../types';
import { TEXTOS, CATEGORIA_COLOR } from '../../config';
import { formatColones, getAllCategories, parseMoneyInput, BASE_CATEGORIES, getCategoryLabel } from '../../utils';
import { BellRing, Languages, Database, Download, Upload, Check, AlertTriangle, RefreshCw, Moon, Sun, Monitor, Tag, Plus, Trash2, Smartphone, Share2, RotateCcw, Undo2, ChevronDown, ChevronUp, Cloud, Laptop } from 'lucide-react';
import { PWAInstallButton } from '../PWAInstallButton';
import { ConfirmModal } from '../ConfirmModal';
import { User } from '@supabase/supabase-js';

interface AjustesViewProps {
  appData: AppData;
  lang: LanguageCode;
  theme: ThemeMode;
  categoriasPersonalizadas?: string[];
  categoriasOcultas?: string[];
  user?: User | null;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  onOpenAuthModal?: () => void;
  onGuardarLimite: (limite: number) => void;
  onChangeLang: (newLang: LanguageCode) => void;
  onChangeTheme: (newTheme: ThemeMode) => void;
  onImportData: (data: AppData) => void;
  onResetDefault: () => void;
  onAddCustomCategory?: (categoria: string) => void;
  onDeleteCategory?: (categoria: string) => void;
  onRestoreCategory?: (categoria: string) => void;
  onRestoreAllDefaultCategories?: () => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  appData,
  lang,
  theme,
  categoriasPersonalizadas = [],
  categoriasOcultas = [],
  user,
  isSyncing,
  lastSyncTime,
  onOpenAuthModal,
  onGuardarLimite,
  onChangeLang,
  onChangeTheme,
  onImportData,
  onResetDefault,
  onAddCustomCategory,
  onDeleteCategory,
  onRestoreCategory,
  onRestoreAllDefaultCategories,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const todasLasCategorias = getAllCategories(categoriasPersonalizadas, categoriasOcultas);
  const categoriasOcultasValidas = BASE_CATEGORIES.filter((c) =>
    categoriasOcultas.map((o) => o.toLowerCase()).includes(c.toLowerCase())
  );

  const [limiteInput, setLimiteInput] = useState(
    appData.limite_alerta > 0 ? String(appData.limite_alerta) : '0'
  );
  const [nuevaCatInput, setNuevaCatInput] = useState('');
  const [catError, setCatError] = useState<string | null>(null);
  const [mostrarCategoriasActivas, setMostrarCategoriasActivas] = useState(false);
  const [mostrarCategoriasOcultas, setMostrarCategoriasOcultas] = useState(false);
  const [mensajeLimite, setMensajeLimite] = useState<string | null>(null);
  const [errorLimite, setErrorLimite] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mostrarConfirmReset, setMostrarConfirmReset] = useState(false);

  const handleShareApp = async () => {
    const shareUrl = window.location.origin;
    const shareData = {
      title: 'Pock - Organizador Financiero',
      text: 'Organizador financiero personal para control de gastos, deudas y ahorros.',
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // user cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    const clean = nuevaCatInput.trim();
    if (!clean) return;

    if (todasLasCategorias.map((c) => c.toLowerCase()).includes(clean.toLowerCase())) {
      setCatError(t('categoria_existe'));
      return;
    }

    if (onAddCustomCategory) {
      onAddCustomCategory(clean);
      setNuevaCatInput('');
    }
  };

  const handleGuardarLimite = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLimite(null);
    setMensajeLimite(null);

    const val = parseMoneyInput(limiteInput) ?? NaN;
    if (isNaN(val) || val < 0) {
      setErrorLimite(t('limite_error'));
      return;
    }

    onGuardarLimite(val);
    setMensajeLimite(t('limite_guardado'));
    setTimeout(() => setMensajeLimite(null), 3000);
  };

  const handleExportarJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'historial_finanzas.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed.dinero_libre === 'number' && Array.isArray(parsed.historial)) {
          onImportData({
            dinero_libre: parsed.dinero_libre,
            limite_alerta: typeof parsed.limite_alerta === 'number' ? parsed.limite_alerta : 0,
            idioma_actual: parsed.idioma_actual === 'en' ? 'en' : 'es',
            tema: parsed.tema || 'dark',
            historial: parsed.historial,
            deudas: Array.isArray(parsed.deudas) ? parsed.deudas : [],
            metas_ahorro: Array.isArray(parsed.metas_ahorro) ? parsed.metas_ahorro : [],
            categorias_personalizadas: Array.isArray(parsed.categorias_personalizadas) ? parsed.categorias_personalizadas : [],
            categorias_ocultas: Array.isArray(parsed.categorias_ocultas) ? parsed.categorias_ocultas : [],
            deleted_movements: Array.isArray(parsed.deleted_movements) ? parsed.deleted_movements : [],
            updated_at: new Date().toISOString(),
            presupuestos_categoria: parsed.presupuestos_categoria || {},
            gastos_fijos: Array.isArray(parsed.gastos_fijos) ? parsed.gastos_fijos : [],
            historial_cortes: Array.isArray(parsed.historial_cortes) ? parsed.historial_cortes : [],
          });
          setImportStatus({
            type: 'success',
            message: lang === 'es' ? 'Datos importados exitosamente.' : 'Data imported successfully.',
          });
          setTimeout(() => setImportStatus(null), 3500);
        } else {
          setImportStatus({
            type: 'error',
            message: lang === 'es' ? 'Formato JSON no válido.' : 'Invalid JSON format.',
          });
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: lang === 'es' ? 'Error al leer el archivo JSON.' : 'Error reading the JSON file.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 pb-24 md:pb-6 max-w-2xl mx-auto">
      {/* Title Header */}
      <div className="pb-3 border-b border-[#30353B]/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F4F6F8] flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <span>{t('ajustes_titulo')}</span>
          </h2>
          <p className="text-xs text-[#9AA3AD] mt-0.5">
            {lang === 'es' ? 'Personaliza tu experiencia financiera y gestiona tus datos de forma segura.' : 'Customize your financial experience and securely manage your data.'}
          </p>
        </div>
      </div>

      {/* BLOQUE 1: FINANZAS Y CATEGORÍAS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-[#35D0BA]"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#35D0BA]">
            {lang === 'es' ? 'Finanzas y Categorías' : 'Finance & Categories'}
          </h3>
        </div>

        {/* Alerta de saldo bajo */}
        <section
          id="card-ajuste-alerta"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#35D0BA]" />
            <h4 className="text-sm font-bold text-[#F4F6F8]">
              {t('ajustes_alerta_tit')}
            </h4>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {lang === 'es'
              ? 'Recibe una alerta visual en la pantalla de inicio cuando tu saldo libre sea menor o igual a este monto.'
              : 'Receive a visual alert on the home screen when your free balance is less than or equal to this amount.'}
          </p>

          <form onSubmit={handleGuardarLimite} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-60">
              <span className="absolute left-3.5 top-2.5 text-[#9AA3AD] font-bold text-sm">
                ₡
              </span>
              <input
                id="input-limite-alerta"
                type="number"
                step="any"
                value={limiteInput}
                onChange={(e) => setLimiteInput(e.target.value)}
                className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-8 pr-3 py-2 text-sm font-semibold transition-colors"
              />
            </div>

            <button
              id="btn-guardar-limite"
              type="submit"
              className="w-full sm:w-auto bg-[#35D0BA] hover:bg-[#2EB39E] text-[#07150D] font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {t('ajustes_btn_guardar')}
            </button>
          </form>

          {mensajeLimite && (
            <p className="text-xs font-semibold text-[#2BC77B] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{mensajeLimite}</span>
            </p>
          )}

          {errorLimite && (
            <p className="text-xs font-semibold text-[#F0525D]">{errorLimite}</p>
          )}
        </section>

        {/* Personalización de Categorías */}
        <section
          id="card-ajuste-categorias"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#35D0BA]" />
              <h4 className="text-sm font-bold text-[#F4F6F8]">
                {t('cat_personalizada_tit')}
              </h4>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#35D0BA]/15 text-[#35D0BA] border border-[#35D0BA]/30">
              {todasLasCategorias.length} {lang === 'es' ? 'activas' : 'active'}
            </span>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {t('cat_personalizadas_desc')}
          </p>

          {catError && (
            <p className="text-xs font-semibold text-[#F0525D] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{catError}</span>
            </p>
          )}

          {/* Input para agregar nueva categoría */}
          <form onSubmit={handleCrearCategoria} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
            <input
              id="input-nueva-cat"
              type="text"
              value={nuevaCatInput}
              onChange={(e) => setNuevaCatInput(e.target.value)}
              placeholder={t('cat_nombre_placeholder')}
              className="w-full sm:flex-1 bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-xs font-medium placeholder:text-[#9AA3AD]/50"
            />
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#35D0BA] active:bg-[#2EB39E] hover:bg-[#2EB39E] text-[#07150D] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('cat_crear_btn')}</span>
            </button>
          </form>

          {/* Acordeón / Desplegable de Categorías Activas */}
          <div className="pt-2 border-t border-[#30353B]/60 space-y-3">
            <button
              type="button"
              onClick={() => setMostrarCategoriasActivas(!mostrarCategoriasActivas)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#17191C] hover:bg-[#1d2024] border border-[#30353B] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#F4F6F8] uppercase tracking-wider">
                  {t('cat_activas')}
                </span>
                <span className="text-[11px] font-semibold text-[#35D0BA] bg-[#35D0BA]/10 px-2 py-0.5 rounded-full">
                  {todasLasCategorias.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#9AA3AD]">
                <span className="hidden sm:inline font-medium">
                  {mostrarCategoriasActivas ? t('cat_ocultar_lista') : t('cat_mostrar_todas')}
                </span>
                {mostrarCategoriasActivas ? (
                  <ChevronUp className="w-4 h-4 text-[#35D0BA]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9AA3AD]" />
                )}
              </div>
            </button>

            {/* Vista Plegada (Resumen compacto) */}
            {!mostrarCategoriasActivas && (
              <div className="flex flex-wrap items-center gap-1.5 px-1 py-0.5">
                {todasLasCategorias.slice(0, 5).map((cat) => {
                  const color = CATEGORIA_COLOR[cat] || '#35D0BA';
                  const label = getCategoryLabel(cat, lang, true);
                  return (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#17191C] border border-[#30353B]/70 text-[11px] text-[#9AA3AD]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate max-w-[120px]">{label}</span>
                    </span>
                  );
                })}
                {todasLasCategorias.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setMostrarCategoriasActivas(true)}
                    className="text-[11px] text-[#35D0BA] hover:underline font-semibold px-2 py-1 cursor-pointer"
                  >
                    +{todasLasCategorias.length - 5} {lang === 'es' ? 'más...' : 'more...'}
                  </button>
                )}
              </div>
            )}

            {/* Vista Desplegada Completa */}
            {mostrarCategoriasActivas && (
              <div className="space-y-2 pt-1">
                {todasLasCategorias.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {todasLasCategorias.map((cat) => {
                      const isBase = BASE_CATEGORIES.includes(cat);
                      const color = CATEGORIA_COLOR[cat] || '#35D0BA';
                      const label = getCategoryLabel(cat, lang, true);

                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#17191C] border border-[#30353B] hover:border-[#30353B]/90 transition-all group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-semibold text-[#F4F6F8] truncate">
                              {label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] font-medium text-[#9AA3AD]/70 px-1.5 py-0.5 rounded bg-[#202328] border border-[#30353B]/50">
                              {isBase ? (lang === 'es' ? 'Previa' : 'Default') : 'Custom'}
                            </span>

                            {onDeleteCategory && (
                              <button
                                type="button"
                                onClick={() => onDeleteCategory(cat)}
                                title={`${t('cat_eliminar')}: ${label}`}
                                aria-label={`${t('cat_eliminar')} ${label}`}
                                className="p-1.5 rounded-lg text-[#9AA3AD] hover:text-[#F0525D] hover:bg-[#F0525D]/15 active:bg-[#F0525D]/25 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#E5A93C] italic p-3 rounded-lg bg-[#E5A93C]/10 border border-[#E5A93C]/20">
                    {t('cat_no_hay_activas')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Categorías Predeterminadas Eliminadas */}
          {categoriasOcultasValidas.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#17191C]/70 border border-[#30353B]/70 space-y-3 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarCategoriasOcultas(!mostrarCategoriasOcultas)}
                  className="flex items-center gap-2 text-left cursor-pointer group"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#E5A93C]" />
                  <span className="text-xs font-bold text-[#F4F6F8] group-hover:text-[#35D0BA] transition-colors">
                    {t('cat_ocultas')} ({categoriasOcultasValidas.length})
                  </span>
                  {mostrarCategoriasOcultas ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#9AA3AD]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#9AA3AD]" />
                  )}
                </button>

                {onRestoreAllDefaultCategories && (
                  <button
                    type="button"
                    onClick={onRestoreAllDefaultCategories}
                    className="text-[11px] font-bold text-[#35D0BA] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('cat_restaurar_todas')}</span>
                  </button>
                )}
              </div>

              {mostrarCategoriasOcultas && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {categoriasOcultasValidas.map((cat) => {
                    const label = getCategoryLabel(cat, lang, true);
                    return (
                      <div
                        key={cat}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#202328] border border-[#30353B] text-xs text-[#9AA3AD]"
                      >
                        <span className="line-through opacity-70">{label}</span>
                        {onRestoreCategory && (
                          <button
                            type="button"
                            onClick={() => onRestoreCategory(cat)}
                            className="text-[11px] font-bold text-[#35D0BA] hover:text-[#2EB39E] px-1.5 py-0.5 rounded bg-[#35D0BA]/10 hover:bg-[#35D0BA]/20 transition-colors cursor-pointer"
                          >
                            {t('cat_restaurar')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* BLOQUE 2: PREFERENCIAS (Tema e Idioma) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-[#35D0BA]"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#35D0BA]">
            {lang === 'es' ? 'Preferencias de Interfaz' : 'Interface Preferences'}
          </h3>
        </div>

        {/* Tema */}
        <section
          id="card-ajuste-tema"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#35D0BA]" />
            <h4 className="text-sm font-bold text-[#F4F6F8]">
              {t('ajustes_tema_tit')}
            </h4>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {t('ajustes_tema_desc')}
          </p>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-md">
            <button
              id="btn-theme-dark"
              type="button"
              onClick={() => onChangeTheme('dark')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#35D0BA]/15 text-[#35D0BA] border-[#35D0BA]/40 shadow-xs'
                  : 'bg-[#17191C] text-[#9AA3AD] border-[#30353B] hover:text-[#F4F6F8]'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{t('tema_oscuro')}</span>
            </button>

            <button
              id="btn-theme-light"
              type="button"
              onClick={() => onChangeTheme('light')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#35D0BA]/15 text-[#35D0BA] border-[#35D0BA]/40 shadow-xs'
                  : 'bg-[#17191C] text-[#9AA3AD] border-[#30353B] hover:text-[#F4F6F8]'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{t('tema_claro')}</span>
            </button>

            <button
              id="btn-theme-system"
              type="button"
              onClick={() => onChangeTheme('system')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-[#35D0BA]/15 text-[#35D0BA] border-[#35D0BA]/40 shadow-xs'
                  : 'bg-[#17191C] text-[#9AA3AD] border-[#30353B] hover:text-[#F4F6F8]'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>{t('tema_sistema')}</span>
            </button>
          </div>
        </section>

        {/* Idioma */}
        <section
          id="card-ajuste-idioma"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-[#35D0BA]" />
            <h4 className="text-sm font-bold text-[#F4F6F8]">
              {t('ajustes_idioma_tit')}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              id="btn-lang-es"
              type="button"
              onClick={() => onChangeLang('es')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm border transition-colors cursor-pointer ${
                lang === 'es'
                  ? 'bg-[#35D0BA]/15 text-[#35D0BA] border-[#35D0BA]/40 shadow-sm'
                  : 'bg-[#17191C] text-[#9AA3AD] border-[#30353B] hover:text-[#F4F6F8]'
              }`}
            >
              <span>🇪🇸</span>
              <span>Español</span>
            </button>

            <button
              id="btn-lang-en"
              type="button"
              onClick={() => onChangeLang('en')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm border transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#35D0BA]/15 text-[#35D0BA] border-[#35D0BA]/40 shadow-sm'
                  : 'bg-[#17191C] text-[#9AA3AD] border-[#30353B] hover:text-[#F4F6F8]'
              }`}
            >
              <span>🇺🇸</span>
              <span>English</span>
            </button>
          </div>
        </section>
      </div>

      {/* BLOQUE 3: SISTEMA, PWA Y DATOS (Incluye Zona de Peligro) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-[#35D0BA]"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#35D0BA]">
            {lang === 'es' ? 'Sistema, Compartir y Datos' : 'System, Sharing & Data'}
          </h3>
        </div>

        {/* PWA */}
        <section
          id="card-ajuste-pwa"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#35D0BA]" />
            <h4 className="text-sm font-bold text-[#F4F6F8]">
              {lang === 'es' ? 'Instalación y Funcionamiento Offline' : 'Installation & Offline Operation'}
            </h4>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {lang === 'es'
              ? 'Instala Pock directamente en tu teléfono o computadora para disfrutar de una experiencia nativa rápida y 100% independiente de conexión a internet.'
              : 'Install Pock directly on your phone or computer for a fast native experience with 100% offline capability.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <PWAInstallButton lang={lang} variant="card" />
            
            <button
              type="button"
              onClick={async () => {
                try {
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let reg of registrations) {
                      await reg.update();
                    }
                  }
                } catch (e) {}
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 bg-[#17191C] hover:bg-[#272B30] text-[#35D0BA] font-bold px-4 py-2 rounded-lg text-xs border border-[#35D0BA]/30 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'es' ? 'Actualizar App' : 'Update App'}</span>
            </button>
          </div>
        </section>

        {/* Compartir */}
        <section
          id="card-ajuste-compartir"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#35D0BA]" />
            <h4 className="text-sm font-bold text-[#F4F6F8]">
              {lang === 'es' ? 'Compartir con amigos o familia' : 'Share with friends or family'}
            </h4>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {lang === 'es'
              ? 'Cada persona que abra Pock en su teléfono o computadora tendrá su propio espacio 100% privado y limpio (inicia en ₡0). Sus datos se guardan únicamente en su propio dispositivo y nunca se mezclarán con los tuyos.'
              : 'Everyone opening Pock gets their own private and fresh space (starts at ₡0). Data is stored locally on their device and never mixed.'}
          </p>

          <div>
            <button
              type="button"
              onClick={handleShareApp}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#35D0BA] hover:bg-[#2EB39E] text-[#07150D] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {copiedLink
                  ? (lang === 'es' ? '¡Enlace copiado al portapapeles!' : 'Link copied to clipboard!')
                  : (lang === 'es' ? 'Compartir o Copiar Enlace' : 'Share or Copy Link')}
              </span>
            </button>
          </div>
        </section>

        {/* Sincronización Multidispositivo (Nube & Supabase) */}
        <section
          id="card-ajuste-sync"
          className="bg-[#202328] border border-[#35D0BA]/30 rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#35D0BA]/15 text-[#35D0BA] flex items-center justify-center border border-[#35D0BA]/30">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F4F6F8]">
                  {lang === 'es' ? 'Sincronización Multidispositivo (Nube)' : 'Multi-Device Cloud Sync'}
                </h4>
                <p className="text-[11px] text-[#9AA3AD]">
                  {lang === 'es' ? 'Accede a tus finanzas desde laptop y celular' : 'Access your finances across laptop & mobile'}
                </p>
              </div>
            </div>
            {user ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#35D0BA]/15 text-[#35D0BA] border border-[#35D0BA]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35D0BA] animate-pulse" />
                {lang === 'es' ? 'Conectado' : 'Connected'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#30353B]/60 text-[#9AA3AD] border border-[#30353B]">
                {lang === 'es' ? 'Modo Local' : 'Local Mode'}
              </span>
            )}
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {user
              ? (lang === 'es'
                  ? `Sesión activa con ${user.email}. Cada gasto, ingreso y presupuesto que registres aquí se sincroniza automáticamente con tus otros dispositivos.`
                  : `Active session as ${user.email}. Movements and budgets sync automatically across all your devices.`)
              : (lang === 'es'
                  ? 'Inicia sesión o crea tu cuenta gratuita para sincronizar automáticamente todos tus gastos e ingresos entre tu laptop, teléfono y tableta en tiempo real.'
                  : 'Sign in or create a free account to sync expenses and incomes in real time across your devices.')}
          </p>

          {user && lastSyncTime && (
            <div className="text-xs text-[#9AA3AD] flex items-center gap-1.5 font-mono">
              <RefreshCw className={`w-3.5 h-3.5 text-[#35D0BA] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{lang === 'es' ? `Última sincronización: ${lastSyncTime}` : `Last sync: ${lastSyncTime}`}</span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#35D0BA] hover:bg-[#2EB39E] text-[#07150D] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>
                {user
                  ? (lang === 'es' ? 'Administrar Cuenta y Sincronización' : 'Manage Account & Sync')
                  : (lang === 'es' ? 'Iniciar Sesión / Crear Cuenta' : 'Sign In / Create Account')}
              </span>
            </button>
          </div>
        </section>

        {/* Gestión de Datos y Copia de Respaldo */}
        <section
          id="card-ajuste-datos"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#35D0BA]" />
            <h4 className="text-sm font-bold text-[#F4F6F8]">
              {t('ajustes_datos_tit')}
            </h4>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {lang === 'es'
              ? 'Tus datos se guardan de forma local en tu navegador. Puedes exportar o importar tu archivo historial_finanzas.json para transferir tus finanzas entre dispositivos.'
              : 'Your data is saved locally in your browser. You can export or import your historial_finanzas.json file to transfer your finances across devices.'}
          </p>

          {importStatus && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-[#2BC77B]/15 border-[#2BC77B]/30 text-[#2BC77B]'
                  : 'bg-[#F0525D]/15 border-[#F0525D]/30 text-[#F0525D]'
              }`}
            >
              {importStatus.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportarJSON}
              className="inline-flex items-center gap-2 bg-[#17191C] hover:bg-[#272B30] text-[#F4F6F8] font-bold px-4 py-2 rounded-lg text-xs border border-[#30353B] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#35D0BA]" />
              <span>{t('ajustes_exportar')}</span>
            </button>

            <label className="inline-flex items-center gap-2 bg-[#17191C] hover:bg-[#272B30] text-[#F4F6F8] font-bold px-4 py-2 rounded-lg text-xs border border-[#30353B] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#35D0BA]" />
              <span>{t('ajustes_importar')}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportarJSON}
                className="hidden"
              />
            </label>
          </div>
        </section>

        {/* ZONA DE PELIGRO (Restablecer valores de fábrica) */}
        <section
          id="card-ajuste-danger"
          className="bg-[#202328] border border-[#F0525D]/30 rounded-xl p-5 space-y-3 shadow-sm"
        >
          <div className="flex items-center gap-2 text-[#F0525D]">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-sm font-bold">
              {lang === 'es' ? 'Zona de Peligro' : 'Danger Zone'}
            </h4>
          </div>

          <p className="text-xs text-[#9AA3AD] leading-relaxed">
            {lang === 'es'
              ? 'Restablecer la aplicación borrará los movimientos actuales y volverá al estado inicial. Asegúrate de exportar una copia de respaldo en JSON antes de continuar si lo necesitas.'
              : 'Resetting the app will clear current movements and restore initial state. Make sure to export a JSON backup before proceeding if needed.'}
          </p>

          <div>
            <button
              id="btn-reiniciar-pock"
              type="button"
              onClick={() => setMostrarConfirmReset(true)}
              className="inline-flex items-center gap-2 bg-[#F0525D]/15 hover:bg-[#F0525D]/25 text-[#F0525D] font-bold px-4 py-2.5 rounded-lg text-xs border border-[#F0525D]/30 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('ajustes_reiniciar')}</span>
            </button>
          </div>
        </section>
      </div>

      {mostrarConfirmReset && (
        <ConfirmModal
          title={lang === 'es' ? 'Restablecer Pock' : 'Reset Pock'}
          message={
            lang === 'es'
              ? '¿Estás seguro de restablecer los datos iniciales de Pock? Esta acción no se puede deshacer y borrará los movimientos actuales.'
              : 'Are you sure you want to reset Pock to initial data? This action cannot be undone and will delete current records.'
          }
          confirmText={lang === 'es' ? 'Sí, restablecer' : 'Yes, reset'}
          cancelText={lang === 'es' ? 'Cancelar' : 'Cancel'}
          isDestructive={true}
          onConfirm={onResetDefault}
          onClose={() => setMostrarConfirmReset(false)}
        />
      )}
    </div>
  );
};
