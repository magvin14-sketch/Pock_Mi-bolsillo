import React, { useState, useMemo } from 'react';
import { SavingsGoal, LanguageCode } from '../../types';
import { TEXTOS } from '../../config';
import { formatColones, generateId } from '../../utils';
import { PiggyBank, Plus, CheckCircle2, TrendingUp, Calendar, Trash2, ArrowUpRight, ArrowDownLeft, X, Sparkles } from 'lucide-react';
import { ModalPortal } from '../ModalPortal';
import { ConfirmModal } from '../ConfirmModal';

interface AhorrosViewProps {
  metas: SavingsGoal[];
  dineroLibreActual: number;
  lang: LanguageCode;
  onSaveGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onDepositToGoal: (goalId: string, amount: number, deductFromFreeMoney: boolean) => void;
  onWithdrawFromGoal: (goalId: string, amount: number, returnToFreeMoney: boolean) => void;
}

export const AhorrosView: React.FC<AhorrosViewProps> = ({
  metas,
  dineroLibreActual,
  lang,
  onSaveGoal,
  onDeleteGoal,
  onDepositToGoal,
  onWithdrawFromGoal,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [montoMeta, setMontoMeta] = useState('');
  const [montoInicial, setMontoInicial] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  // Modals for Deposit and Withdraw
  const [modalAbono, setModalAbono] = useState<SavingsGoal | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [descontarLibre, setDescontarLibre] = useState(true);

  const [modalRetiro, setModalRetiro] = useState<SavingsGoal | null>(null);
  const [montoRetiro, setMontoRetiro] = useState('');
  const [devolverLibre, setDevolverLibre] = useState(true);
  const [metaParaEliminar, setMetaParaEliminar] = useState<SavingsGoal | null>(null);

  // Metrics
  const totalAhorrado = useMemo(() => {
    return metas.reduce((acc, m) => acc + (m.ahorrado || 0), 0);
  }, [metas]);

  const metasCompletadas = useMemo(() => {
    return metas.filter((m) => m.ahorrado >= m.meta).length;
  }, [metas]);

  const handleCrearMeta = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      setErrorMsg(lang === 'es' ? 'Ingresa el nombre de la meta.' : 'Please enter a goal name.');
      return;
    }

    const valMeta = parseFloat(montoMeta.replace(/,/g, ''));
    if (isNaN(valMeta) || valMeta <= 0) {
      setErrorMsg(lang === 'es' ? 'Ingresa un monto objetivo mayor a 0.' : 'Enter a target amount greater than 0.');
      return;
    }

    const valInicial = montoInicial.trim() ? parseFloat(montoInicial.replace(/,/g, '')) : 0;
    if (isNaN(valInicial) || valInicial < 0) {
      setErrorMsg(lang === 'es' ? 'Monto inicial no válido.' : 'Invalid initial amount.');
      return;
    }

    const nuevaMeta: SavingsGoal = {
      id: generateId(),
      nombre: cleanNombre,
      meta: valMeta,
      ahorrado: valInicial,
      fecha_limite: fechaLimite || undefined,
      completada: valInicial >= valMeta,
    };

    onSaveGoal(nuevaMeta);
    setNombre('');
    setMontoMeta('');
    setMontoInicial('');
    setFechaLimite('');
    setMostrarForm(false);
    setExitoMsg(t('ahorro_guardada'));
    setTimeout(() => setExitoMsg(null), 3000);
  };

  const handleConfirmarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAbono) return;

    const val = parseFloat(montoAbono.replace(/,/g, ''));
    if (isNaN(val) || val <= 0) return;

    onDepositToGoal(modalAbono.id, val, descontarLibre);
    setModalAbono(null);
    setMontoAbono('');
  };

  const handleConfirmarRetiro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRetiro) return;

    const val = parseFloat(montoRetiro.replace(/,/g, ''));
    if (isNaN(val) || val <= 0) return;

    onWithdrawFromGoal(modalRetiro.id, val, devolverLibre);
    setModalRetiro(null);
    setMontoRetiro('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#30353B]/50">
        <div>
          <h2 className="text-xl font-bold text-[#F4F6F8] flex items-center gap-2">
            <span>🐖</span>
            <span>{t('ahorros_titulo')}</span>
          </h2>
          <p className="text-xs text-[#9AA3AD] mt-0.5">
            {lang === 'es'
              ? 'Organiza tus alcancías, objetivos financieros y fondos de reserva.'
              : 'Organize your piggy banks, financial targets, and reserve funds.'}
          </p>
        </div>

        <button
          id="btn-nueva-meta"
          type="button"
          onClick={() => setMostrarForm(!mostrarForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#35D0BA] hover:bg-[#35D0BA]/90 text-[#07150D] font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('ahorro_nueva_meta')}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ahorrado */}
        <div className="bg-[#202328] border border-[#30353B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#9AA3AD] mb-1">
            <span>{t('ahorro_total_ahorrado')}</span>
            <PiggyBank className="w-4 h-4 text-[#35D0BA]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#35D0BA]">
            {formatColones(totalAhorrado)}
          </div>
        </div>

        {/* Metas Activas */}
        <div className="bg-[#202328] border border-[#30353B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#9AA3AD] mb-1">
            <span>{lang === 'es' ? 'Metas en progreso' : 'Active goals'}</span>
            <TrendingUp className="w-4 h-4 text-[#4D9DE0]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#F4F6F8]">
            {metas.length}
          </div>
        </div>

        {/* Metas Cumplidas */}
        <div className="bg-[#202328] border border-[#30353B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#9AA3AD] mb-1">
            <span>{lang === 'es' ? 'Alcanzadas al 100%' : 'Achieved goals'}</span>
            <CheckCircle2 className="w-4 h-4 text-[#2BC77B]" />
          </div>
          <div className="text-2xl font-black font-mono text-[#2BC77B]">
            {metasCompletadas} / {metas.length}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {exitoMsg && (
        <div className="p-3 rounded-lg bg-[#2BC77B]/15 border border-[#2BC77B]/30 text-[#2BC77B] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{exitoMsg}</span>
        </div>
      )}

      {/* New Goal Form */}
      {mostrarForm && (
        <form
          id="form-nueva-meta"
          onSubmit={handleCrearMeta}
          className="bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#30353B]/50 pb-2">
            <h3 className="text-sm font-bold text-[#F4F6F8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#35D0BA]" />
              <span>{t('ahorro_nueva_meta')}</span>
            </h3>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-[#F0525D]/15 border border-[#F0525D]/30 text-[#F0525D] text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                {t('ahorro_nombre')}
              </label>
              <input
                id="input-nombre-meta"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Fondo de emergencia, Marchamo, Vacaciones..."
                className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-xs font-medium placeholder:text-[#9AA3AD]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                {t('ahorro_meta')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#9AA3AD] font-bold text-xs">₡</span>
                <input
                  id="input-monto-meta"
                  type="number"
                  step="any"
                  value={montoMeta}
                  onChange={(e) => setMontoMeta(e.target.value)}
                  placeholder="100000"
                  className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 text-xs font-medium placeholder:text-[#9AA3AD]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                {t('ahorro_ahorrado')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#9AA3AD] font-bold text-xs">₡</span>
                <input
                  id="input-inicial-meta"
                  type="number"
                  step="any"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 text-xs font-medium placeholder:text-[#9AA3AD]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                {t('ahorro_fecha_limite')}
              </label>
              <input
                id="input-fecha-meta"
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 rounded-lg bg-[#272B30] hover:bg-[#343A42] text-[#9AA3AD] hover:text-[#F4F6F8] text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#35D0BA] hover:bg-[#35D0BA]/90 text-[#07150D] text-xs font-bold transition-colors cursor-pointer"
            >
              {t('ahorro_btn_guardar')}
            </button>
          </div>
        </form>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#F4F6F8] flex items-center justify-between">
          <span>{t('ahorro_lista_tit')}</span>
          <span className="text-xs text-[#9AA3AD] font-normal font-mono">
            {metas.length} {metas.length === 1 ? 'meta' : 'metas'}
          </span>
        </h3>

        {metas.length === 0 ? (
          <div className="bg-[#202328] border border-[#30353B] rounded-xl p-10 text-center text-[#9AA3AD]">
            <PiggyBank className="w-10 h-10 mx-auto mb-2 text-[#9AA3AD]/40" />
            <p className="text-sm font-medium">{t('ahorro_sin_metas')}</p>
            <p className="text-xs text-[#9AA3AD]/60 mt-1">
              {lang === 'es'
                ? 'Define tus metas de viaje, ahorro o fondo de emergencia.'
                : 'Set your savings, travel, or emergency goals.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metas.map((m) => {
              const porcentaje = Math.min(100, Math.round((m.ahorrado / m.meta) * 100));
              const isCompletada = m.ahorrado >= m.meta;
              const restante = Math.max(0, m.meta - m.ahorrado);

              return (
                <div
                  key={m.id}
                  className={`bg-[#202328] border rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between ${
                    isCompletada
                      ? 'border-[#2BC77B]/40 bg-[#2BC77B]/5'
                      : 'border-[#30353B] hover:border-[#35D0BA]/40'
                  }`}
                >
                  {/* Top line: Name and Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#F4F6F8] truncate flex items-center gap-1.5">
                          <span>{m.nombre}</span>
                          {isCompletada && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2BC77B]/20 text-[#2BC77B] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('ahorro_completada')}
                            </span>
                          )}
                        </h4>
                        {m.fecha_limite && (
                          <div className="flex items-center gap-1 text-[11px] text-[#9AA3AD] mt-0.5">
                            <Calendar className="w-3 h-3 text-[#9AA3AD]/70" />
                            <span>Meta: {m.fecha_limite}</span>
                          </div>
                        )}
                      </div>

                      <button
                        title={lang === 'es' ? 'Eliminar meta' : 'Delete goal'}
                        type="button"
                        onClick={() => setMetaParaEliminar(m)}
                        className="text-[#9AA3AD]/40 hover:text-[#F0525D] p-1.5 rounded-lg hover:bg-[#272B30] transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold font-mono text-[#35D0BA]">
                          {formatColones(m.ahorrado)}
                        </span>
                        <span className="text-[#9AA3AD] font-mono">
                          de {formatColones(m.meta)}
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-[#17191C] overflow-hidden border border-[#30353B]/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompletada
                              ? 'bg-[#2BC77B]'
                              : porcentaje > 60
                              ? 'bg-[#35D0BA]'
                              : 'bg-[#4D9DE0]'
                          }`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#9AA3AD]">
                        <span>{porcentaje}% completado</span>
                        {!isCompletada ? (
                          <span>Faltan {formatColones(restante)}</span>
                        ) : (
                          <span className="text-[#2BC77B] font-semibold">¡Completado!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#30353B]/40 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModalAbono(m);
                        setMontoAbono('');
                        setDescontarLibre(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272B30] hover:bg-[#343A42] text-[#35D0BA] text-xs font-bold border border-[#35D0BA]/30 transition-colors cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>{t('ahorro_btn_abonar')}</span>
                    </button>

                    {m.ahorrado > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalRetiro(m);
                          setMontoRetiro('');
                          setDevolverLibre(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272B30] hover:bg-[#343A42] text-[#9AA3AD] hover:text-[#F4F6F8] text-xs font-semibold border border-[#30353B] transition-colors cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#F2994A]" />
                        <span>{t('ahorro_btn_retirar')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Abonar a Meta */}
      {modalAbono && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-sm rounded-2xl bg-[#202328] border border-[#30353B] p-5 shadow-2xl text-[#F4F6F8] space-y-4 my-auto animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#30353B]/50 pb-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-[#35D0BA]" />
                  <span>{t('ahorro_prompt_abono_tit')}: {modalAbono.nombre}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setModalAbono(null)}
                  className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1 rounded hover:bg-[#272B30] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmarAbono} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                    {t('ahorro_prompt_abono')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#9AA3AD] font-bold text-xs">₡</span>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      autoFocus
                      required
                      value={montoAbono}
                      onChange={(e) => setMontoAbono(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Checkbox: Descontar de dinero libre */}
                <label className="flex items-start gap-2 text-xs text-[#9AA3AD] cursor-pointer p-2.5 rounded-lg bg-[#17191C] border border-[#30353B]/40 hover:bg-[#17191C]/80">
                  <input
                    type="checkbox"
                    checked={descontarLibre}
                    onChange={(e) => setDescontarLibre(e.target.checked)}
                    className="rounded border-[#30353B] text-[#35D0BA] focus:ring-[#35D0BA] mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-[#F4F6F8] block">
                      {t('ahorro_descontar_libre')}
                    </span>
                    <span className="text-[11px] text-[#9AA3AD]">
                      {lang === 'es'
                        ? `Registrará un gasto y restará del saldo disponible (${formatColones(dineroLibreActual)}).`
                        : `Will record an expense and subtract from available balance (${formatColones(dineroLibreActual)}).`}
                    </span>
                  </div>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAbono(null)}
                    className="px-3.5 py-2 rounded-lg bg-[#272B30] text-xs font-bold text-[#9AA3AD] hover:text-[#F4F6F8] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#35D0BA] text-[#07150D] text-xs font-bold cursor-pointer hover:bg-[#2EB39E] transition-colors"
                  >
                    {t('ahorro_abono_btn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal: Retirar de Meta */}
      {modalRetiro && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-sm rounded-2xl bg-[#202328] border border-[#30353B] p-5 shadow-2xl text-[#F4F6F8] space-y-4 my-auto animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#30353B]/50 pb-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-[#F2994A]" />
                  <span>{t('ahorro_prompt_retiro_tit')}: {modalRetiro.nombre}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setModalRetiro(null)}
                  className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1 rounded hover:bg-[#272B30] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmarRetiro} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                    {t('ahorro_prompt_retiro')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#9AA3AD] font-bold text-xs">₡</span>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      max={modalRetiro.ahorrado}
                      autoFocus
                      required
                      value={montoRetiro}
                      onChange={(e) => setMontoRetiro(e.target.value)}
                      placeholder={modalRetiro.ahorrado.toString()}
                      className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 text-sm font-medium"
                    />
                  </div>
                  <span className="text-[11px] text-[#9AA3AD] mt-1 block">
                    Disponible para retirar: {formatColones(modalRetiro.ahorrado)}
                  </span>
                </div>

                {/* Checkbox: Devolver a dinero libre */}
                <label className="flex items-start gap-2 text-xs text-[#9AA3AD] cursor-pointer p-2.5 rounded-lg bg-[#17191C] border border-[#30353B]/40 hover:bg-[#17191C]/80">
                  <input
                    type="checkbox"
                    checked={devolverLibre}
                    onChange={(e) => setDevolverLibre(e.target.checked)}
                    className="rounded border-[#30353B] text-[#35D0BA] focus:ring-[#35D0BA] mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-[#F4F6F8] block">
                      {lang === 'es' ? 'Devolver al dinero libre actual' : 'Return to free money'}
                    </span>
                    <span className="text-[11px] text-[#9AA3AD]">
                      {lang === 'es'
                        ? 'Registrará un ingreso que sumará a tu saldo disponible.'
                        : 'Will record an income adding to your available balance.'}
                    </span>
                  </div>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalRetiro(null)}
                    className="px-3.5 py-2 rounded-lg bg-[#272B30] text-xs font-bold text-[#9AA3AD] hover:text-[#F4F6F8] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#F2994A] text-[#07150D] text-xs font-bold cursor-pointer hover:bg-[#e0893a] transition-colors"
                  >
                    {t('ahorro_retiro_btn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {metaParaEliminar && (
        <ConfirmModal
          title={lang === 'es' ? 'Eliminar meta de ahorro' : 'Delete savings goal'}
          message={
            lang === 'es'
              ? `¿Seguro que deseas eliminar "${metaParaEliminar.nombre}"? Ahorrado: ${formatColones(metaParaEliminar.ahorrado)} de ${formatColones(metaParaEliminar.meta)}.`
              : `Are you sure you want to delete "${metaParaEliminar.nombre}"? Saved: ${formatColones(metaParaEliminar.ahorrado)} of ${formatColones(metaParaEliminar.meta)}.`
          }
          confirmText={lang === 'es' ? 'Eliminar meta' : 'Delete goal'}
          cancelText={lang === 'es' ? 'Cancelar' : 'Cancel'}
          isDestructive={true}
          onConfirm={() => {
            onDeleteGoal(metaParaEliminar.id);
            setMetaParaEliminar(null);
          }}
          onClose={() => setMetaParaEliminar(null)}
        />
      )}
    </div>
  );
};
