import React, { useState } from 'react';
import { Debt, LanguageCode } from '../types';
import { TEXTOS } from '../config';
import { formatColones, parseMoneyInput } from '../utils';
import { X, Check } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface AbonoModalProps {
  deuda: Debt;
  dineroLibre: number;
  lang: LanguageCode;
  onConfirm: (deudaId: string, montoAbono: number) => void;
  onClose: () => void;
}

export const AbonoModal: React.FC<AbonoModalProps> = ({
  deuda,
  dineroLibre,
  lang,
  onConfirm,
  onClose,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const pendiente = Math.max(0, deuda.monto_total - deuda.monto_pagado);
  const [monto, setMonto] = useState(pendiente > 0 ? String(pendiente) : '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseMoneyInput(monto) ?? NaN;
    if (isNaN(val) || val <= 0 || val > pendiente || val > dineroLibre) {
      setError(t('aviso_monto'));
      return;
    }

    onConfirm(deuda.id, val);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#202328] border border-[#30353B] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fadeIn my-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#30353B]/50">
            <h4 className="text-base font-bold text-[#F4F6F8]">
              {t('deuda_prompt_abono_tit')}: <span className="text-[#35D0BA]">{deuda.acreedor}</span>
            </h4>
            <button
              onClick={onClose}
              className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1.5 rounded-lg hover:bg-[#272B30] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs text-[#9AA3AD] bg-[#17191C] p-3 rounded-lg border border-[#30353B]/50">
            <div className="flex justify-between">
              <span>Saldo pendiente de la deuda:</span>
              <span className="font-bold text-[#F4F6F8] font-mono">{formatColones(pendiente)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dinero libre actual:</span>
              <span className={`font-bold font-mono ${dineroLibre < 0 ? 'text-[#F0525D]' : 'text-[#35D0BA]'}`}>
                {formatColones(dineroLibre)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#9AA3AD] mb-1.5">
                {t('deuda_prompt_abono')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#9AA3AD] font-bold">₡</span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  autoFocus
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-8 pr-3 py-2 text-sm font-semibold transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-[#F0525D]">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-[#9AA3AD] hover:text-[#F4F6F8] transition-colors cursor-pointer"
              >
                {t('deuda_cancelar')}
              </button>
              <button
                id="btn-confirmar-abono-modal"
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold bg-[#35D0BA] hover:bg-[#2EB39E] text-[#07150D] transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t('deuda_abono_btn')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
