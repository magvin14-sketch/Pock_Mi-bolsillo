import React, { useState } from 'react';
import { Debt, DebtType, LanguageCode } from '../../types';
import { DEUDA_TIPOS, TEXTOS } from '../../config';
import { formatColones } from '../../utils';
import { CheckCircle2, CreditCard, Banknote, Users, Trash2, Plus, Calendar } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';

interface DeudasViewProps {
  deudas: Debt[];
  lang: LanguageCode;
  onRegistrarDeuda: (nueva: Omit<Debt, 'id' | 'pagada'>) => void;
  onIniciarAbono: (deuda: Debt) => void;
  onEliminarDeuda?: (id: string) => void;
}

export const DeudasView: React.FC<DeudasViewProps> = ({
  deudas,
  lang,
  onRegistrarDeuda,
  onIniciarAbono,
  onEliminarDeuda,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const [tipo, setTipo] = useState<DebtType>('tarjeta');
  const [acreedor, setAcreedor] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);
  const [deudaParaEliminar, setDeudaParaEliminar] = useState<Debt | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setExitoMsg(null);

    const cleanAcreedor = acreedor.trim();
    if (!cleanAcreedor) {
      setErrorMsg(t('aviso_deuda_acreedor'));
      return;
    }

    const totalNum = parseFloat(montoTotal.replace(/,/g, '.'));
    if (isNaN(totalNum) || totalNum <= 0) {
      setErrorMsg(t('aviso_deuda_monto'));
      return;
    }

    let pagadoNum = 0;
    if (montoPagado.trim()) {
      pagadoNum = parseFloat(montoPagado.replace(/,/g, '.'));
      if (isNaN(pagadoNum) || pagadoNum < 0) {
        pagadoNum = 0;
      }
    }

    onRegistrarDeuda({
      tipo,
      acreedor: cleanAcreedor,
      monto_total: totalNum,
      monto_pagado: Math.min(pagadoNum, totalNum),
      fecha_limite: fechaLimite.trim(),
    });

    setAcreedor('');
    setMontoTotal('');
    setMontoPagado('');
    setFechaLimite('');
    setExitoMsg(t('deuda_guardada'));
    setTimeout(() => setExitoMsg(null), 3500);
  };

  const getTipoIcon = (tType: DebtType) => {
    switch (tType) {
      case 'tarjeta':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'prestamo':
        return <Banknote className="w-3.5 h-3.5" />;
      case 'prestado':
        return <Users className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Title */}
      <div className="pb-3 border-b border-[#30353B]/50">
        <h2 className="text-xl font-bold text-[#F4F6F8] flex items-center gap-2">
          <span>💸</span>
          <span>{t('deudas_titulo')}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Card */}
        <section
          id="card-registrar-deuda"
          className="lg:col-span-5 bg-[#202328] border border-[#30353B] rounded-xl p-5 shadow-sm"
        >
          <h3 className="text-base font-bold text-[#F4F6F8] mb-4 pb-2 border-b border-[#30353B]/50 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#35D0BA]" />
            {t('deuda_registrar_tit')}
          </h3>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded bg-[#F0525D]/15 border border-[#F0525D]/30 text-[#F0525D] text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {exitoMsg && (
            <div className="mb-4 p-2.5 rounded bg-[#2BC77B]/15 border border-[#2BC77B]/30 text-[#2BC77B] text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{exitoMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                {t('deuda_tipo_lbl')}
              </label>
              <select
                id="select-deuda-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as DebtType)}
                className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
              >
                {DEUDA_TIPOS.map((dt) => (
                  <option key={dt} value={dt}>
                    {t(`deuda_tipo_${dt}` as keyof typeof TEXTOS['es'])}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                {t('deuda_acreedor')}
              </label>
              <input
                id="input-deuda-acreedor"
                type="text"
                value={acreedor}
                onChange={(e) => setAcreedor(e.target.value)}
                placeholder="Ej. Banco, Amigo, Tarjeta..."
                className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-sm transition-colors placeholder:text-[#9AA3AD]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                  {t('deuda_monto_total')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#9AA3AD] font-bold text-sm">
                    ₡
                  </span>
                  <input
                    id="input-deuda-total"
                    type="number"
                    step="any"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    placeholder="10000"
                    className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 text-sm font-medium transition-colors placeholder:text-[#9AA3AD]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                  {t('deuda_monto_pagado')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#9AA3AD] font-bold text-sm">
                    ₡
                  </span>
                  <input
                    id="input-deuda-pagado"
                    type="number"
                    step="any"
                    value={montoPagado}
                    onChange={(e) => setMontoPagado(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 text-sm font-medium transition-colors placeholder:text-[#9AA3AD]/50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1">
                {t('deuda_fecha_limite')}
              </label>
              <input
                id="input-deuda-fecha"
                type="text"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                placeholder="Ej. 15 de cada mes, o 30/09/2026"
                className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 text-sm transition-colors placeholder:text-[#9AA3AD]/50"
              />
            </div>

            <button
              id="btn-guardar-deuda"
              type="submit"
              className="w-full mt-3 bg-[#35D0BA] hover:bg-[#2EB39E] active:scale-[0.99] text-[#07150D] font-bold py-2.5 px-4 rounded-lg text-sm transition-all cursor-pointer shadow-sm"
            >
              {t('deuda_btn_guardar')}
            </button>
          </form>
        </section>

        {/* Debts List */}
        <section
          id="card-lista-deudas"
          className="lg:col-span-7 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#F4F6F8]">
              {t('deuda_lista_tit')} ({deudas.length})
            </h3>
          </div>

          {deudas.length === 0 ? (
            <div className="bg-[#202328] border border-[#30353B] rounded-xl p-10 text-center text-[#9AA3AD]">
              <Banknote className="w-10 h-10 mx-auto mb-2 text-[#9AA3AD]/40" />
              <p className="text-sm">{t('deuda_sin_deudas')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deudas.map((deuda) => {
                const total = deuda.monto_total || 1;
                const pagado = deuda.monto_pagado || 0;
                const percentage = Math.min(100, Math.round((pagado / total) * 100));
                const estaPagada = deuda.pagada || pagado >= total;

                return (
                  <div
                    key={deuda.id}
                    className="bg-[#272B30] border border-[#30353B] rounded-xl p-4 space-y-3 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#F4F6F8]">
                          {deuda.acreedor}
                        </span>
                        {estaPagada && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2BC77B] bg-[#2BC77B]/15 px-2 py-0.5 rounded-full border border-[#2BC77B]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('deuda_pagada')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-[#9AA3AD] bg-[#202328] px-2 py-1 rounded-md border border-[#30353B]/50">
                          {getTipoIcon(deuda.tipo)}
                          <span>{t(`deuda_tipo_${deuda.tipo}` as keyof typeof TEXTOS['es'])}</span>
                        </span>

                        {onEliminarDeuda && (
                          <button
                            title={t('eliminar')}
                            onClick={() => setDeudaParaEliminar(deuda)}
                            className="text-[#9AA3AD]/40 hover:text-[#F0525D] p-1.5 rounded-lg hover:bg-[#202328] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-full bg-[#17191C] rounded-full overflow-hidden border border-[#30353B]/60 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            estaPagada ? 'bg-[#2BC77B]' : 'bg-[#35D0BA]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#9AA3AD]">
                        <span>
                          <strong className="text-[#F4F6F8] font-mono">
                            {formatColones(pagado)}
                          </strong>{' '}
                          /{' '}
                          <span className="font-mono">{formatColones(total)}</span>
                          <span className="ml-1.5 font-bold text-[#F4F6F8]">
                            ({percentage}%)
                          </span>
                        </span>

                        {deuda.fecha_limite && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3" />
                            <span>{deuda.fecha_limite}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {!estaPagada && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onIniciarAbono(deuda)}
                          className="w-full flex items-center justify-center gap-2 bg-[#202328] hover:bg-[#30353B] text-[#F4F6F8] text-xs font-bold py-2 px-3 rounded-lg border border-[#30353B] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#35D0BA]" />
                          <span>{t('deuda_btn_abonar')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {deudaParaEliminar && (
        <ConfirmModal
          title={lang === 'es' ? 'Eliminar deuda' : 'Delete debt'}
          message={
            lang === 'es'
              ? `¿Seguro que deseas eliminar la deuda con "${deudaParaEliminar.acreedor}" por ${formatColones(deudaParaEliminar.monto_total)}?`
              : `Are you sure you want to delete the debt to "${deudaParaEliminar.acreedor}" of ${formatColones(deudaParaEliminar.monto_total)}?`
          }
          confirmText={lang === 'es' ? 'Eliminar deuda' : 'Delete debt'}
          cancelText={lang === 'es' ? 'Cancelar' : 'Cancel'}
          isDestructive={true}
          onConfirm={() => {
            if (onEliminarDeuda) {
              onEliminarDeuda(deudaParaEliminar.id);
            }
            setDeudaParaEliminar(null);
          }}
          onClose={() => setDeudaParaEliminar(null)}
        />
      )}
    </div>
  );
};
