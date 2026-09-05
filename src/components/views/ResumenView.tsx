import React, { useState, useMemo } from 'react';
import { Movement, FixedExpense, CycleHistoryEntry, LanguageCode } from '../../types';
import { CATEGORIAS, TEXTOS } from '../../config';
import { formatColones, generateId, getCategoryLabel } from '../../utils';
import { RotateCcw, Check, AlertTriangle, TrendingUp, TrendingDown, PiggyBank, PieChart, Repeat, Plus, Trash2, CalendarCheck2 } from 'lucide-react';
import { FinanceCharts } from '../FinanceCharts';
import { ModalPortal } from '../ModalPortal';

interface ResumenViewProps {
  dineroLibreActual: number;
  historial: Movement[];
  gastosFijos: FixedExpense[];
  historialCortes: CycleHistoryEntry[];
  presupuestos?: Record<string, number>;
  lang: LanguageCode;
  onEjecutarCorte: (nuevoSaldoBase: number, aplicarFijos: boolean) => void;
  onUpdateGastosFijos: (gastos: FixedExpense[]) => void;
  onAplicarGastosFijosManual: () => void;
}

export const ResumenView: React.FC<ResumenViewProps> = ({
  dineroLibreActual,
  historial,
  gastosFijos,
  historialCortes,
  presupuestos = {},
  lang,
  onEjecutarCorte,
  onUpdateGastosFijos,
  onAplicarGastosFijosManual,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoSaldo, setNuevoSaldo] = useState('');
  const [aplicarFijosEnCorte, setAplicarFijosEnCorte] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mostrarModalConfirm, setMostrarModalConfirm] = useState(false);

  // New fixed expense form state
  const [nuevoFijoDesc, setNuevoFijoDesc] = useState('');
  const [nuevoFijoMonto, setNuevoFijoMonto] = useState('');
  const [nuevoFijoCat, setNuevoFijoCat] = useState<string>('vivienda');
  const [mostrarFormFijo, setMostrarFormFijo] = useState(false);

  // Compute Cycle Metrics
  const metricas = useMemo(() => {
    let totalIngresos = 0;
    let totalGastos = 0;
    let saldoBase = 0;
    const catTotals: Record<string, number> = {};

    for (const mov of historial) {
      if (mov.tipo === 'base') {
        saldoBase += mov.monto;
      } else if (mov.tipo === 'ingreso') {
        totalIngresos += mov.monto;
      } else if (mov.tipo === 'gasto') {
        totalGastos += mov.monto;
        const cat = mov.categoria || 'otros';
        catTotals[cat] = (catTotals[cat] || 0) + mov.monto;
      }
    }

    const totalEntradas = saldoBase + totalIngresos;
    const ahorroNeto = totalEntradas - totalGastos;
    const tasaAhorro = totalEntradas > 0 ? Math.max(0, Math.round((ahorroNeto / totalEntradas) * 100)) : 0;

    // Highest spending category
    let topCat = '-';
    let topCatMonto = 0;
    for (const [cat, val] of Object.entries(catTotals)) {
      if (val > topCatMonto) {
        topCatMonto = val;
        topCat = cat;
      }
    }

    return {
      saldoBase,
      totalIngresos,
      totalGastos,
      ahorroNeto,
      tasaAhorro,
      topCat,
      topCatMonto,
      totalMovimientos: historial.length,
    };
  }, [historial]);

  const handleValidarYPedirConfirmacion = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(nuevoSaldo.replace(/,/g, ''));
    if (isNaN(val) || val < 0) {
      setError(t('corte_error'));
      return;
    }

    setMostrarModalConfirm(true);
  };

  const handleConfirmarCorte = () => {
    const val = parseFloat(nuevoSaldo.replace(/,/g, ''));
    onEjecutarCorte(val, aplicarFijosEnCorte);
    setMostrarModalConfirm(false);
    setMostrarForm(false);
    setNuevoSaldo('');
    setMensajeExito(t('corte_exito'));
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Fixed expenses handlers
  const handleToggleFijo = (id: string) => {
    const updated = gastosFijos.map((g) => (g.id === id ? { ...g, activo: !g.activo } : g));
    onUpdateGastosFijos(updated);
  };

  const handleEliminarFijo = (id: string) => {
    const updated = gastosFijos.filter((g) => g.id !== id);
    onUpdateGastosFijos(updated);
  };

  const handleAgregarFijo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDesc = nuevoFijoDesc.trim();
    const num = parseFloat(nuevoFijoMonto.replace(/,/g, '.'));
    if (!cleanDesc || isNaN(num) || num <= 0) return;

    const nuevo: FixedExpense = {
      id: generateId(),
      desc: cleanDesc,
      categoria: nuevoFijoCat,
      monto: num,
      activo: true,
    };

    onUpdateGastosFijos([...gastosFijos, nuevo]);
    setNuevoFijoDesc('');
    setNuevoFijoMonto('');
    setMostrarFormFijo(false);
  };

  const totalFijosActivos = useMemo(() => {
    return gastosFijos.filter((g) => g.activo).reduce((acc, g) => acc + g.monto, 0);
  }, [gastosFijos]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* View Title */}
      <div className="pb-3 border-b border-[#30353B]/50">
        <h2 className="text-xl font-bold text-[#F4F6F8] flex items-center gap-2">
          <span>📊</span>
          <span>{t('resumen_titulo')}</span>
        </h2>
      </div>

      {/* Success Notification */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-[#2BC77B]/15 border border-[#2BC77B]/40 text-[#2BC77B] text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-5 h-5" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* 1. Métricas del Ciclo Actual */}
      <section
        id="card-metricas-ciclo"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#F4F6F8] flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#35D0BA]" />
            {t('metricas_ciclo_tit')}
          </h3>
          <span className="text-xs text-[#9AA3AD] font-mono">
            {metricas.totalMovimientos} movimientos registrados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Ingresos */}
          <div className="bg-[#272B30] border border-[#30353B]/70 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#9AA3AD] mb-1">
              <span>{t('metricas_ingresos')}</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#2BC77B]" />
            </div>
            <div className="text-lg font-bold font-mono text-[#2BC77B]">
              {formatColones(metricas.totalIngresos)}
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-[#272B30] border border-[#30353B]/70 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#9AA3AD] mb-1">
              <span>{t('metricas_gastos')}</span>
              <TrendingDown className="w-3.5 h-3.5 text-[#F0525D]" />
            </div>
            <div className="text-lg font-bold font-mono text-[#F0525D]">
              {formatColones(metricas.totalGastos)}
            </div>
          </div>

          {/* Excedente / Ahorro */}
          <div className="bg-[#272B30] border border-[#30353B]/70 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#9AA3AD] mb-1">
              <span>{t('metricas_ahorro')}</span>
              <PiggyBank className="w-3.5 h-3.5 text-[#35D0BA]" />
            </div>
            <div
              className={`text-lg font-bold font-mono ${
                metricas.ahorroNeto < 0 ? 'text-[#F0525D]' : 'text-[#35D0BA]'
              }`}
            >
              {formatColones(metricas.ahorroNeto)}
            </div>
          </div>

          {/* Mayor Categoría */}
          <div className="bg-[#272B30] border border-[#30353B]/70 rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#9AA3AD] mb-1">
              <span>{t('metricas_mayor_gasto')}</span>
              <span className="text-[11px] font-bold text-[#F4F6F8]">{metricas.tasaAhorro}% tasa ahorro</span>
            </div>
            <div className="text-sm font-bold text-[#F4F6F8] truncate">
              {metricas.topCat !== '-' ? getCategoryLabel(metricas.topCat, lang, true) : 'Ninguno'}
              {metricas.topCatMonto > 0 && (
                <span className="text-xs font-mono font-normal text-[#9AA3AD] block">
                  ({formatColones(metricas.topCatMonto)})
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Charts: Daily Trend & Category Comparison */}
      <FinanceCharts historial={historial} presupuestos={presupuestos} lang={lang} />

      {/* 2. Month Cut Action Card */}
      <section
        id="card-corte-mes"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-6 shadow-sm space-y-5"
      >
        <div>
          <h3 className="text-lg font-bold text-[#F4F6F8] mb-1">
            {t('resumen_card_tit')}
          </h3>
          <p className="text-sm text-[#9AA3AD] leading-relaxed">
            {t('resumen_card_sub')}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#17191C] border border-[#30353B]/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#9AA3AD] uppercase tracking-wide">
            Saldo libre registrado actual
          </span>
          <span className="text-base font-bold font-mono text-[#35D0BA]">
            {formatColones(dineroLibreActual)}
          </span>
        </div>

        {!mostrarForm ? (
          <div>
            <button
              id="btn-iniciar-corte"
              type="button"
              onClick={() => {
                setMostrarForm(true);
                setError(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#272B30] hover:bg-[#343A42] text-[#F4F6F8] font-bold text-sm border border-[#30353B] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#35D0BA]" />
              <span>{t('resumen_btn')}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleValidarYPedirConfirmacion} className="space-y-4 pt-2 border-t border-[#30353B]/50">
            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1.5">
                {t('resumen_ingreso_lbl')}
              </label>
              <div className="relative max-w-sm">
                <span className="absolute left-3.5 top-2.5 text-[#9AA3AD] font-bold">
                  ₡
                </span>
                <input
                  id="input-saldo-corte"
                  type="number"
                  step="any"
                  autoFocus
                  value={nuevoSaldo}
                  onChange={(e) => setNuevoSaldo(e.target.value)}
                  placeholder="85000"
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-8 pr-3 py-2 text-sm font-semibold transition-colors"
                />
              </div>
            </div>

            {/* Apply recurring expenses toggle */}
            {gastosFijos.length > 0 && (
              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="check-aplicar-fijos-corte"
                  checked={aplicarFijosEnCorte}
                  onChange={(e) => setAplicarFijosEnCorte(e.target.checked)}
                  className="rounded border-[#30353B] text-[#35D0BA] focus:ring-[#35D0BA] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="check-aplicar-fijos-corte" className="text-xs text-[#F4F6F8] cursor-pointer">
                  {t('btn_aplicar_fijos')} ({formatColones(totalFijosActivos)})
                </label>
              </div>
            )}

            {error && (
              <p className="text-xs font-semibold text-[#F0525D]">{error}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                id="btn-confirmar-corte"
                type="submit"
                className="inline-flex items-center gap-2 bg-[#2BC77B] hover:bg-[#20AD69] text-[#07150D] font-bold px-5 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t('resumen_btn_ejecutar')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMostrarForm(false);
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg text-sm text-[#9AA3AD] hover:text-[#F4F6F8] transition-colors cursor-pointer"
              >
                {t('resumen_cancelar')}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 3. Gastos Fijos Recurrentes (Plantillas) */}
      <section
        id="card-gastos-fijos"
        className="bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#F4F6F8] flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#35D0BA]" />
              {t('gastos_fijos_tit')}
            </h3>
            <p className="text-xs text-[#9AA3AD] mt-0.5">
              {t('gastos_fijos_sub')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {gastosFijos.length > 0 && (
              <button
                type="button"
                onClick={onAplicarGastosFijosManual}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35D0BA]/15 hover:bg-[#35D0BA]/25 text-[#35D0BA] text-xs font-semibold border border-[#35D0BA]/30 transition-colors cursor-pointer"
                title="Añadir gastos fijos activos como movimientos de gasto al historial ahora mismo"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar ahora</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMostrarFormFijo(!mostrarFormFijo)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272B30] hover:bg-[#343A42] text-[#F4F6F8] text-xs font-semibold border border-[#30353B] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#35D0BA]" />
              <span>{t('agregar_fijo')}</span>
            </button>
          </div>
        </div>

        {/* Add new fixed expense form */}
        {mostrarFormFijo && (
          <form onSubmit={handleAgregarFijo} className="bg-[#17191C] border border-[#30353B] rounded-lg p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#9AA3AD] mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Gimnasio, Spotify..."
                  value={nuevoFijoDesc}
                  onChange={(e) => setNuevoFijoDesc(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] rounded-md px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9AA3AD] mb-1">Monto (₡)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="15000"
                  value={nuevoFijoMonto}
                  onChange={(e) => setNuevoFijoMonto(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] rounded-md px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9AA3AD] mb-1">Categoría</label>
                <select
                  value={nuevoFijoCat}
                  onChange={(e) => setNuevoFijoCat(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] rounded-md px-2.5 py-1.5 text-xs"
                >
                  {CATEGORIAS.filter((c) => c !== 'salario').map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat, lang, true)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrarFormFijo(false)}
                className="px-3 py-1 text-xs text-[#9AA3AD] hover:text-[#F4F6F8]"
              >
                {t('resumen_cancelar')}
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-[#35D0BA] text-[#07150D] text-xs font-bold rounded-md"
              >
                Guardar plantilla
              </button>
            </div>
          </form>
        )}

        {/* Fixed Expenses List */}
        {gastosFijos.length === 0 ? (
          <p className="text-xs text-[#9AA3AD] italic py-2">
            No tienes gastos fijos configurados todavía.
          </p>
        ) : (
          <div className="space-y-2">
            {gastosFijos.map((fijo) => (
              <div
                key={fijo.id}
                className="bg-[#272B30] border border-[#30353B]/70 rounded-lg p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={fijo.activo}
                    onChange={() => handleToggleFijo(fijo.id)}
                    className="rounded border-[#30353B] text-[#35D0BA] focus:ring-[#35D0BA] w-4 h-4 cursor-pointer shrink-0"
                    title={t('fijo_activo')}
                  />
                  <div className="min-w-0">
                    <span className="font-semibold text-[#F4F6F8] block truncate">
                      {fijo.desc}
                    </span>
                    <span className="text-[11px] text-[#9AA3AD]">
                      {getCategoryLabel(fijo.categoria, lang, true)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-[#F4F6F8]">
                    {formatColones(fijo.monto)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEliminarFijo(fijo.id)}
                    className="text-[#9AA3AD]/50 hover:text-[#F0525D] p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Historial de Cortes Pasados */}
      {historialCortes && historialCortes.length > 0 && (
        <section
          id="card-historial-cortes"
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm space-y-4"
        >
          <h3 className="text-base font-bold text-[#F4F6F8] flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-[#35D0BA]" />
            {t('historial_cortes_tit')}
          </h3>

          <div className="space-y-2">
            {historialCortes.slice().reverse().map((corte) => (
              <div
                key={corte.id}
                className="bg-[#272B30] border border-[#30353B]/70 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#F4F6F8]">
                    Cierre del {corte.fechaCorte}
                  </span>
                  <div className="text-[#9AA3AD] text-[11px] mt-0.5">
                    Gastos: {formatColones(corte.totalGastos)} · Ingresos: {formatColones(corte.totalIngresos)}
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-[#9AA3AD]">Saldo final:</span>
                  <span className="font-bold text-[#35D0BA]">
                    {formatColones(corte.saldoFinal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirmation Modal */}
      {mostrarModalConfirm && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-[#202328] border border-[#30353B] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-auto animate-fadeIn">
              <div className="flex items-center gap-3 text-[#F4C95D]">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-base font-bold text-[#F4F6F8]">
                  {t('resumen_titulo')}
                </h4>
              </div>

              <p className="text-sm text-[#9AA3AD] leading-relaxed">
                {t('corte_msj')}
              </p>

              <div className="p-3 bg-[#17191C] rounded-lg border border-[#30353B]/50 text-xs space-y-1">
                <div>
                  Nuevo saldo base inicial: <strong className="text-[#2BC77B] font-mono font-bold text-sm">₡{parseFloat(nuevoSaldo || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
                {aplicarFijosEnCorte && totalFijosActivos > 0 && (
                  <div className="text-[#9AA3AD]">
                    Se aplicarán {gastosFijos.filter((g) => g.activo).length} gastos fijos por un total de <span className="text-[#F0525D] font-mono font-semibold">-{formatColones(totalFijosActivos)}</span>.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#9AA3AD] hover:text-[#F4F6F8] transition-colors cursor-pointer"
                >
                  {t('resumen_cancelar')}
                </button>
                <button
                  id="btn-dialog-confirmar"
                  type="button"
                  onClick={handleConfirmarCorte}
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-[#2BC77B] hover:bg-[#20AD69] text-[#07150D] transition-colors cursor-pointer"
                >
                  {t('resumen_btn_ejecutar')}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
