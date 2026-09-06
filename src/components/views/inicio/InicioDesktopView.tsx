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
  Clock,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Check,
} from 'lucide-react';
import { PresupuestosModal } from '../../PresupuestosModal';
import { InicioComponentProps } from './types';

export const InicioDesktopView: React.FC<InicioComponentProps> = ({
  dineroLibre,
  limiteAlerta,
  historial,
  presupuestos,
  categoriasPersonalizadas = [],
  categoriasOcultas = [],
  lang,
  onAddMovement,
  onSavePresupuestos,
  onNavigateToHistorial,
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

  // Last 4 transactions
  const ultimosMovimientos = useMemo(() => {
    return historial.slice(-4).reverse();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handleSubmit('ingreso');
      } else {
        handleSubmit('gasto');
      }
    }
  };

  return (
    <div id="inicio-desktop-view" className="space-y-6 pb-6">
      {/* 1. Saldo Card with Daily Activity */}
      <section
        id="card-dinero-libre-desktop"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-6 shadow-sm transition-all"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[#9AA3AD] uppercase mb-1">
              {t('dinero_libre')}
            </h2>
            <div
              className={`text-4xl font-extrabold tracking-tight ${
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

          <div className="flex items-center gap-3">
            {/* Today's Expense Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#17191C] border border-[#30353B]/70 text-xs">
              <span className="text-[#9AA3AD] font-medium">{t('gastado_hoy')}:</span>
              <span className="font-mono font-bold text-[#F0525D]">
                {formatColones(gastadoHoy)}
              </span>
            </div>

            {/* Today's Income Pill */}
            {ingresadoHoy > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#17191C] border border-[#30353B]/70 text-xs">
                <span className="text-[#9AA3AD] font-medium">{t('ingresado_hoy')}:</span>
                <span className="font-mono font-bold text-[#2BC77B]">
                  {formatColones(ingresadoHoy)}
                </span>
              </div>
            )}

            {/* State badge */}
            {isDeficit && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0525D]/15 border border-[#F0525D]/30 text-xs font-semibold text-[#F0525D]">
                <AlertOctagon className="w-4 h-4" />
                <span>
                  {t('deficit')} {formatColones(Math.abs(dineroLibre))}
                </span>
              </div>
            )}

            {isAlertaBajo && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4C95D]/15 border border-[#F4C95D]/30 text-xs font-semibold text-[#F4C95D]">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('alerta_bajo')}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Desktop Two-Column Layout (Form + Graph) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <section
          id="card-form-desktop"
          className="col-span-5 bg-[#202328] border border-[#30353B] rounded-xl p-5 flex flex-col justify-between shadow-sm"
        >
          <div>
            <h3 className="text-base font-bold text-[#F4F6F8] mb-4 pb-2 border-b border-[#30353B]/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#35D0BA]"></span>
              {t('registrar_mov')}
            </h3>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded bg-[#F0525D]/15 border border-[#F0525D]/30 text-[#F0525D] text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                  {t('desc')}
                </label>
                <input
                  id="input-desc-desktop"
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej. Almuerzo de trabajo, Gasolina, Salario..."
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-sm transition-colors placeholder:text-[#9AA3AD]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                  {t('monto')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#9AA3AD] font-bold text-sm">
                    ₡
                  </span>
                  <input
                    id="input-monto-desktop"
                    type="number"
                    step="any"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="0.00"
                    className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 text-sm font-medium transition-colors placeholder:text-[#9AA3AD]/50"
                  />
                </div>

                {/* Quick amount preset chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[1000, 2000, 5000, 10000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const current = parseFloat(monto) || 0;
                        setMonto(String(current + preset));
                      }}
                      className="text-[11px] font-mono px-2 py-1 rounded-md bg-[#272B30] hover:bg-[#30353B] text-[#9AA3AD] hover:text-[#35D0BA] border border-[#30353B] transition-all cursor-pointer active:scale-95"
                    >
                      +{formatColones(preset)}
                    </button>
                  ))}
                  {monto && (
                    <button
                      type="button"
                      onClick={() => setMonto('')}
                      className="text-[11px] px-2 py-1 rounded-md bg-[#272B30] hover:bg-[#F0525D]/15 text-[#9AA3AD] hover:text-[#F0525D] border border-[#30353B] transition-all cursor-pointer"
                      title={lang === 'es' ? 'Limpiar monto' : 'Clear amount'}
                    >
                      {lang === 'es' ? 'Limpiar' : 'Clear'}
                    </button>
                  )}
                </div>
              </div>

              {/* Category Selection + Quick Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#9AA3AD]">
                    {t('categoria_lbl')}
                  </label>
                  <span className="text-[10px] text-[#9AA3AD]/70 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#35D0BA]" />
                    {t('categorias_frecuentes')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {categoriasFrecuentes.map((catKey) => {
                    const isSelected = categoria === catKey;
                    const catColor = CATEGORIA_COLOR[catKey] || '#35D0BA';
                    const label = getCategoryLabel(catKey, lang, true);
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategoria(catKey)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#35D0BA]/15 text-[#35D0BA] border-[#35D0BA]/50 shadow-xs'
                            : 'bg-[#272B30] text-[#9AA3AD] border-[#30353B]/70 hover:text-[#F4F6F8] hover:bg-[#2e333a]'
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        <span>{label.split(' ')[1] || label}</span>
                      </button>
                    );
                  })}
                </div>

                <select
                  id="select-categoria-desktop"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer"
                >
                  {todasLasCategorias.map((c) => (
                    <option key={c} value={c} className="bg-[#272B30] text-[#F4F6F8]">
                      {getCategoryLabel(c, lang, true)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#30353B]/50">
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn-gasto-desktop"
                type="button"
                onClick={() => handleSubmit('gasto')}
                className={`flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-lg text-sm transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                  feedbackTipo === 'gasto'
                    ? 'bg-[#2BC77B] text-[#07150D] ring-2 ring-[#2BC77B]/50'
                    : 'bg-[#F0525D] hover:bg-[#D94450] text-white'
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
                id="btn-ingreso-desktop"
                type="button"
                onClick={() => handleSubmit('ingreso')}
                className={`flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-lg text-sm transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                  feedbackTipo === 'ingreso'
                    ? 'bg-[#35D0BA] text-[#07150D] ring-2 ring-[#35D0BA]/50'
                    : 'bg-[#2BC77B] hover:bg-[#20AD69] text-[#07150D]'
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

            <p className="text-[11px] text-[#9AA3AD] text-center mt-3 font-mono">
              {t('enter_hint')}
            </p>
          </div>
        </section>

        {/* Right Column: Category Budgets */}
        <section
          id="card-grafico-desktop"
          className="col-span-7 bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#30353B]/50 gap-2">
            <h3 className="text-base font-bold text-[#F4F6F8] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#35D0BA]" />
              {t('grafico_titulo')}
            </h3>

            <div className="flex items-center gap-3">
              {totalGastos > 0 && (
                <span className="text-xs font-semibold text-[#9AA3AD]">
                  Total: <span className="text-[#F4F6F8] font-mono">{formatColones(totalGastos)}</span>
                </span>
              )}

              <button
                id="btn-abrir-presupuestos-desktop"
                onClick={() => setMostrarModalPresupuestos(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#272B30] hover:bg-[#30353B] text-xs font-semibold text-[#35D0BA] border border-[#30353B] transition-colors cursor-pointer"
                title={t('tit_presupuestos')}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t('btn_presupuestos')}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[260px] flex flex-col justify-center">
            {categoryTotals.length === 0 ? (
              <div className="text-center py-12 text-[#9AA3AD] text-sm">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-[#9AA3AD]/40" />
                <p>{t('grafico_vacio')}</p>
              </div>
            ) : (
              <div className="space-y-4 py-1">
                {categoryTotals.map(([cat, val]) => {
                  const color = CATEGORIA_COLOR[cat] || '#35D0BA';
                  const label = getCategoryLabel(cat, lang, true);
                  const percentOfTotal = Math.round((val / totalGastos) * 100);
                  const barWidthPercent = Math.max(3, Math.min(100, (val / maxVal) * 100));

                  const budgetCap = presupuestos[cat];
                  const hasBudget = typeof budgetCap === 'number' && budgetCap > 0;
                  const budgetPercent = hasBudget ? Math.round((val / budgetCap) * 100) : null;
                  const isOverBudget = hasBudget && val > budgetCap;
                  const isNearBudget = hasBudget && !isOverBudget && budgetPercent! >= 80;

                  return (
                    <div key={cat} className="group">
                      <div className="flex items-center justify-between text-xs mb-1 gap-2">
                        <span className="font-medium text-[#F4F6F8] flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate">{label}</span>
                        </span>

                        <div className="flex items-center gap-2 font-mono shrink-0">
                          {hasBudget && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isOverBudget
                                  ? 'bg-[#F0525D]/20 text-[#F0525D] border border-[#F0525D]/30'
                                  : isNearBudget
                                  ? 'bg-[#F4C95D]/20 text-[#F4C95D] border border-[#F4C95D]/30'
                                  : 'bg-[#272B30] text-[#9AA3AD]'
                              }`}
                            >
                              {budgetPercent}% de ₡{budgetCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                          )}

                          <span className="text-[#9AA3AD] text-[11px]">({percentOfTotal}%)</span>
                          <span className="font-bold text-[#F4F6F8]">
                            ₡{val.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`h-3.5 w-full bg-[#17191C] rounded-full overflow-hidden border p-0.5 relative transition-colors ${
                          isOverBudget
                            ? 'border-[#F0525D]/70'
                            : isNearBudget
                            ? 'border-[#F4C95D]/60'
                            : 'border-[#30353B]/50'
                        }`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
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
          </div>
        </section>
      </div>

      {/* 3. Recent Transactions (Laptop 2-Column Grid) */}
      <section
        id="card-ultimos-movimientos-desktop"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#30353B]/50">
          <h3 className="text-sm font-bold text-[#F4F6F8] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#35D0BA]" />
            <span>{t('ultimos_movimientos')}</span>
          </h3>

          {onNavigateToHistorial && (
            <button
              type="button"
              onClick={onNavigateToHistorial}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#35D0BA] hover:text-[#2EB39E] transition-colors cursor-pointer"
            >
              <span>{t('ver_todo_historial')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {ultimosMovimientos.length === 0 ? (
          <p className="text-xs text-[#9AA3AD] py-3 text-center">
            {t('sin_mov')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ultimosMovimientos.map((mov, idx) => {
              const isGasto = mov.tipo === 'gasto';
              const isIngreso = mov.tipo === 'ingreso';
              const isBase = mov.tipo === 'base';

              const colorClass = isGasto
                ? 'text-[#F0525D]'
                : isIngreso
                ? 'text-[#2BC77B]'
                : 'text-[#4D9DE0]';

              const badgeBg = isGasto
                ? 'bg-[#F0525D]/10 border-[#F0525D]/25 text-[#F0525D]'
                : isIngreso
                ? 'bg-[#2BC77B]/10 border-[#2BC77B]/25 text-[#2BC77B]'
                : 'bg-[#4D9DE0]/10 border-[#4D9DE0]/25 text-[#4D9DE0]';

              const sign = isGasto ? '-' : isIngreso ? '+' : '';
              const categoryLabel = mov.categoria
                ? getCategoryLabel(mov.categoria, lang, true)
                : null;

              return (
                <div
                  key={`${mov.id || idx}-${mov.fecha}-${mov.hora}`}
                  className="bg-[#272B30] border border-[#30353B]/70 rounded-lg p-3 flex items-center justify-between gap-3 text-xs hover:border-[#35D0BA]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${badgeBg}`}>
                      {isGasto && <ArrowDownLeft className="w-4 h-4" />}
                      {isIngreso && <ArrowUpRight className="w-4 h-4" />}
                      {isBase && <ShieldCheck className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-[#F4F6F8] truncate text-xs">
                        {mov.desc}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#9AA3AD]">
                        {categoryLabel && (
                          <span className="truncate">{categoryLabel}</span>
                        )}
                        <span>· {mov.fecha}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`font-mono font-bold shrink-0 text-sm ${colorClass}`}>
                    {sign}{formatColones(mov.monto)}
                  </span>
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
