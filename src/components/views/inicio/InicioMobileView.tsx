import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIAS, CATEGORIA_COLOR, TEXTOS } from '../../../config';
import { formatColones, getCurrentTimestamp, parseMoneyInput, getAllCategories, getCategoryLabel } from '../../../utils';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  BarChart3,
  SlidersHorizontal,
  Zap,
  Check,
} from 'lucide-react';
import { PresupuestosModal } from '../../PresupuestosModal';
import { InicioComponentProps } from './types';

const CATEGORIAS_FRECUENTES = [
  'comida',
  'transporte',
  'servicios',
  'vivienda',
  'entretenimiento',
  'otros',
] as const;

export const InicioMobileView: React.FC<InicioComponentProps> = ({
  dineroLibre,
  limiteAlerta,
  historial,
  presupuestos,
  categoriasPersonalizadas = [],
  categoriasOcultas = [],
  lang,
  onAddMovement,
  onSavePresupuestos,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const todasLasCategorias = useMemo(() => {
    return getAllCategories(categoriasPersonalizadas, categoriasOcultas);
  }, [categoriasPersonalizadas, categoriasOcultas]);

  const categoriasFrecuentes = useMemo(() => {
    const preferred = ['comida', 'transporte', 'servicios', 'vivienda', 'entretenimiento', 'otros'];
    const matched = preferred.filter((p) => todasLasCategorias.includes(p));
    const rest = todasLasCategorias.filter((c) => !matched.includes(c));
    return [...matched, ...rest].slice(0, 6);
  }, [todasLasCategorias]);

  const [desc, setDesc] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<string>(todasLasCategorias[0] || 'otros');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarModalPresupuestos, setMostrarModalPresupuestos] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState<'gasto' | 'ingreso' | null>(null);

  // Keep selected category valid if categories change
  useEffect(() => {
    if (!todasLasCategorias.includes(categoria)) {
      setCategoria(todasLasCategorias[0] || 'otros');
    }
  }, [todasLasCategorias, categoria]);

  const isDeficit = dineroLibre < 0;
  const isAlertaBajo = !isDeficit && limiteAlerta > 0 && dineroLibre <= limiteAlerta;

  // Metric: Today's activity
  const todayTimestamp = getCurrentTimestamp();
  const fechaHoy = todayTimestamp.fecha;

  const { gastadoHoy, ingresadoHoy } = useMemo(() => {
    let g = 0;
    let i = 0;
    for (const mov of historial) {
      if (mov.fecha === fechaHoy) {
        if (mov.tipo === 'gasto') g += mov.monto;
        else if (mov.tipo === 'ingreso') i += mov.monto;
      }
    }
    return { gastadoHoy: g, ingresadoHoy: i };
  }, [historial, fechaHoy]);

  // Metric: Category expenses
  const { categoryTotals, rawMap, totalGastos, maxVal } = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const mov of historial) {
      if (mov.tipo === 'gasto') {
        const cat = mov.categoria || 'otros';
        totals[cat] = (totals[cat] || 0) + mov.monto;
      }
    }
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const max = entries.length > 0 ? Math.max(...entries.map(([, v]) => v)) : 1;
    const total = entries.reduce((acc, [, val]) => acc + val, 0);

    return { categoryTotals: entries, rawMap: totals, totalGastos: total, maxVal: max };
  }, [historial]);

  const handleSubmit = (tipo: 'gasto' | 'ingreso') => {
    setErrorMsg(null);
    const cleanDesc = desc.trim();
    if (!cleanDesc) {
      setErrorMsg(t('aviso_desc'));
      return;
    }

    const cleanMontoNum = parseMoneyInput(monto) ?? NaN;
    if (isNaN(cleanMontoNum) || cleanMontoNum <= 0) {
      setErrorMsg(t('aviso_monto'));
      return;
    }

    onAddMovement(cleanDesc, cleanMontoNum, categoria, tipo);
    setFeedbackTipo(tipo);
    setTimeout(() => setFeedbackTipo(null), 1000);
    setDesc('');
    setMonto('');
  };

  return (
    <div id="inicio-mobile-view" className="space-y-4 pb-20 max-w-lg mx-auto">
      {/* 1. Saldo Card (Compact Mobile Layout) */}
      <section
        id="card-dinero-libre-mobile"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#9AA3AD] uppercase">
              {t('dinero_libre')}
            </span>
            <div
              className={`text-3xl font-extrabold tracking-tight mt-0.5 ${
                isDeficit
                  ? 'text-[#F0525D]'
                  : isAlertaBajo
                  ? 'text-[#F4C95D]'
                  : 'text-[#35D0BA]'
              }`}
            >
              {formatColones(dineroLibre)}
            </div>
          </div>

          {/* Status Badge */}
          {isDeficit && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0525D]/15 border border-[#F0525D]/30 text-xs font-semibold text-[#F0525D]">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Déficit</span>
            </div>
          )}
          {isAlertaBajo && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4C95D]/15 border border-[#F4C95D]/30 text-xs font-semibold text-[#F4C95D]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Bajo</span>
            </div>
          )}
        </div>

        {/* Daily Activity Metrics Row */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#30353B]/50 text-xs">
          <div className="bg-[#17191C] border border-[#30353B]/70 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[#9AA3AD] text-[11px]">{t('gastado_hoy')}:</span>
            <span className="font-mono font-bold text-[#F0525D]">
              {formatColones(gastadoHoy)}
            </span>
          </div>

          <div className="bg-[#17191C] border border-[#30353B]/70 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[#9AA3AD] text-[11px]">{t('ingresado_hoy')}:</span>
            <span className="font-mono font-bold text-[#2BC77B]">
              {formatColones(ingresadoHoy)}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Mobile Action Form */}
      <section
        id="card-form-mobile"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-4 shadow-sm"
      >
        <h3 className="text-sm font-bold text-[#F4F6F8] mb-3 pb-2 border-b border-[#30353B]/50 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#35D0BA]"></span>
          {t('registrar_mov')}
        </h3>

        {errorMsg && (
          <div className="mb-3 p-2 rounded bg-[#F0525D]/15 border border-[#F0525D]/30 text-[#F0525D] text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-[#9AA3AD] mb-1">
              {t('desc')}
            </label>
            <input
              id="input-desc-mobile"
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej. Desayuno, Gasolina..."
              className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2.5 text-sm transition-colors placeholder:text-[#9AA3AD]/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#9AA3AD] mb-1">
              {t('monto')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#9AA3AD] font-bold text-sm">
                ₡
              </span>
              <input
                id="input-monto-mobile"
                type="number"
                step="any"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2.5 text-base font-semibold transition-colors placeholder:text-[#9AA3AD]/50"
              />
            </div>

            {/* Quick amount presets for mobile */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[1000, 2000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const current = parseFloat(monto) || 0;
                    setMonto(String(current + preset));
                  }}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#272B30] active:bg-[#35D0BA]/20 text-[#9AA3AD] active:text-[#35D0BA] border border-[#30353B] transition-all cursor-pointer active:scale-95"
                >
                  +{formatColones(preset)}
                </button>
              ))}
              {monto && (
                <button
                  type="button"
                  onClick={() => setMonto('')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-[#272B30] active:bg-[#F0525D]/20 text-[#9AA3AD] hover:text-[#F0525D] border border-[#30353B] transition-all cursor-pointer"
                  title={lang === 'es' ? 'Limpiar' : 'Clear'}
                >
                  {lang === 'es' ? 'Limpiar' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          {/* Quick Categories Horizontal Scroll on Mobile */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-[#9AA3AD]">
                {t('categoria_lbl')}
              </label>
              <span className="text-[10px] text-[#9AA3AD]/70 flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#35D0BA]" />
                {t('categorias_frecuentes')}
              </span>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 -mx-1 px-1 scrollbar-none">
              {categoriasFrecuentes.map((catKey) => {
                const isSelected = categoria === catKey;
                const catColor = CATEGORIA_COLOR[catKey] || '#35D0BA';
                const label = getCategoryLabel(catKey, lang, true);
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategoria(catKey)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                      isSelected
                        ? 'bg-[#35D0BA]/20 text-[#35D0BA] border-[#35D0BA]'
                        : 'bg-[#272B30] text-[#9AA3AD] border-[#30353B]/80 active:bg-[#30353B]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: catColor }}
                    />
                    <span>{label.split(' ')[1] || label}</span>
                  </button>
                );
              })}
            </div>

            <select
              id="select-categoria-mobile"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full mt-1.5 bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer"
            >
              {todasLasCategorias.map((c) => (
                <option key={c} value={c} className="bg-[#272B30] text-[#F4F6F8]">
                  {getCategoryLabel(c, lang, true)}
                </option>
              ))}
            </select>
          </div>

          {/* Large Mobile Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="btn-gasto-mobile"
              type="button"
              onClick={() => handleSubmit('gasto')}
              className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-md active:scale-95 ${
                feedbackTipo === 'gasto'
                  ? 'bg-[#2BC77B] text-[#07150D] ring-2 ring-[#2BC77B]/50'
                  : 'bg-[#F0525D] active:bg-[#D94450] text-white'
              }`}
            >
              {feedbackTipo === 'gasto' ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  <span>{lang === 'es' ? '¡Registrado!' : 'Recorded!'}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span>{t('gasto_btn')}</span>
                </>
              )}
            </button>

            <button
              id="btn-ingreso-mobile"
              type="button"
              onClick={() => handleSubmit('ingreso')}
              className={`flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-md active:scale-95 ${
                feedbackTipo === 'ingreso'
                  ? 'bg-[#35D0BA] text-[#07150D] ring-2 ring-[#35D0BA]/50'
                  : 'bg-[#2BC77B] active:bg-[#20AD69] text-[#07150D]'
              }`}
            >
              {feedbackTipo === 'ingreso' ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  <span>{lang === 'es' ? '¡Registrado!' : 'Recorded!'}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>{t('ingreso_btn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Mobile Category Budget Progress */}
      <section
        id="card-grafico-mobile"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#30353B]/50">
          <h3 className="text-sm font-bold text-[#F4F6F8] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#35D0BA]" />
            {t('grafico_titulo')}
          </h3>

          <button
            id="btn-abrir-presupuestos-mobile"
            onClick={() => setMostrarModalPresupuestos(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#272B30] active:bg-[#30353B] text-xs font-semibold text-[#35D0BA] border border-[#30353B]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('btn_presupuestos')}</span>
          </button>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="text-center py-6 text-[#9AA3AD] text-xs">
            <BarChart3 className="w-6 h-6 mx-auto mb-1 text-[#9AA3AD]/40" />
            <p>{t('grafico_vacio')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryTotals.map(([cat, val]) => {
              const color = CATEGORIA_COLOR[cat] || '#35D0BA';
              const label = getCategoryLabel(cat, lang, true);
              const barWidthPercent = Math.max(3, Math.min(100, (val / maxVal) * 100));

              const budgetCap = presupuestos[cat];
              const hasBudget = typeof budgetCap === 'number' && budgetCap > 0;
              const budgetPercent = hasBudget ? Math.round((val / budgetCap) * 100) : null;
              const isOverBudget = hasBudget && val > budgetCap;
              const isNearBudget = hasBudget && !isOverBudget && budgetPercent! >= 80;

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-[#F4F6F8] flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{label}</span>
                    </span>

                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      {hasBudget && (
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                            isOverBudget
                              ? 'bg-[#F0525D]/20 text-[#F0525D]'
                              : isNearBudget
                              ? 'bg-[#F4C95D]/20 text-[#F4C95D]'
                              : 'bg-[#272B30] text-[#9AA3AD]'
                          }`}
                        >
                          {budgetPercent}%
                        </span>
                      )}
                      <span className="font-bold text-[#F4F6F8]">
                        ₡{val.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`h-2.5 w-full bg-[#17191C] rounded-full overflow-hidden border p-0.5 ${
                      isOverBudget
                        ? 'border-[#F0525D]/70'
                        : isNearBudget
                        ? 'border-[#F4C95D]/60'
                        : 'border-[#30353B]/50'
                    }`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barWidthPercent}%`,
                        backgroundColor: isOverBudget ? '#F0525D' : color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Presupuestos Modal */}
      {mostrarModalPresupuestos && (
        <PresupuestosModal
          presupuestos={presupuestos}
          gastosPorCategoria={rawMap}
          categoriasPersonalizadas={categoriasPersonalizadas}
          categoriasOcultas={categoriasOcultas}
          lang={lang}
          onSave={onSavePresupuestos}
          onClose={() => setMostrarModalPresupuestos(false)}
        />
      )}
    </div>
  );
};
