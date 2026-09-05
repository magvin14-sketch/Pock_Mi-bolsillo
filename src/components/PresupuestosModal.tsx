import React, { useState, useMemo } from 'react';
import { LanguageCode } from '../types';
import { CATEGORIAS, CATEGORIA_COLOR, TEXTOS } from '../config';
import { formatColones, getAllCategories, getCategoryLabel } from '../utils';
import { X, Check, SlidersHorizontal } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface PresupuestosModalProps {
  presupuestos: Record<string, number>;
  gastosPorCategoria: Record<string, number>;
  categoriasPersonalizadas?: string[];
  categoriasOcultas?: string[];
  lang: LanguageCode;
  onSave: (nuevosPresupuestos: Record<string, number>) => void;
  onClose: () => void;
}

export const PresupuestosModal: React.FC<PresupuestosModalProps> = ({
  presupuestos,
  gastosPorCategoria,
  categoriasPersonalizadas = [],
  categoriasOcultas = [],
  lang,
  onSave,
  onClose,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const todasLasCategorias = useMemo(() => {
    return getAllCategories(categoriasPersonalizadas, categoriasOcultas).filter((c) => c !== 'salario');
  }, [categoriasPersonalizadas, categoriasOcultas]);

  // Local state for each category's budget input
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const cats = getAllCategories(categoriasPersonalizadas, categoriasOcultas);
    for (const cat of cats) {
      if (cat !== 'salario') {
        initial[cat] = presupuestos[cat] ? String(presupuestos[cat]) : '';
      }
    }
    return initial;
  });

  const handleChange = (cat: string, val: string) => {
    setValores((prev) => ({ ...prev, [cat]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const result: Record<string, number> = {};
    for (const [cat, valStr] of Object.entries(valores)) {
      const stringVal = typeof valStr === 'string' ? valStr : String(valStr);
      const parsed = parseFloat(stringVal.replace(/,/g, '.'));
      if (!isNaN(parsed) && parsed > 0) {
        result[cat] = parsed;
      }
    }
    onSave(result);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-[#202328] border border-[#30353B] rounded-2xl max-w-xl w-full p-0 shadow-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn my-auto">
          {/* Header without top save button so title and description never get cut off */}
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[#30353B]/60 shrink-0 gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#35D0BA]/15 text-[#35D0BA] shrink-0 mt-0.5">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#F4F6F8] leading-tight">
                  {t('tit_presupuestos')}
                </h3>
                <p className="text-xs text-[#9AA3AD] leading-normal mt-1">
                  {t('desc_presupuestos')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-[#9AA3AD] hover:text-[#F4F6F8] p-2 rounded-xl hover:bg-[#272B30] active:bg-[#30353B] transition-colors cursor-pointer shrink-0 mt-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-2.5 overscroll-contain no-scrollbar">
              {todasLasCategorias.map((cat) => {
                const color = CATEGORIA_COLOR[cat] || '#35D0BA';
                const label = getCategoryLabel(cat, lang, true);
                const gastoActual = gastosPorCategoria[cat] || 0;
                const val = valores[cat] || '';
                const numVal = parseFloat(val);
                const tieneTope = !isNaN(numVal) && numVal > 0;
                const porcentaje = tieneTope ? Math.round((gastoActual / numVal) * 100) : 0;
                const excede = tieneTope && gastoActual > numVal;
                const alerta = tieneTope && !excede && porcentaje >= 80;

                return (
                  <div
                    key={cat}
                    className="bg-[#272B30] border border-[#30353B]/70 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-sm text-[#F4F6F8]">
                          {label}
                        </span>
                      </div>
                      <div className="text-xs text-[#9AA3AD] mt-1 flex items-center gap-2">
                        <span>Gastado este mes: <strong className="text-[#F4F6F8] font-mono">{formatColones(gastoActual)}</strong></span>
                        {tieneTope && (
                          <span
                            className={`text-[11px] font-semibold px-1.5 py-0.2 rounded ${
                              excede
                                ? 'bg-[#F0525D]/20 text-[#F0525D]'
                                : alerta
                                ? 'bg-[#F4C95D]/20 text-[#F4C95D]'
                                : 'bg-[#2BC77B]/20 text-[#2BC77B]'
                            }`}
                          >
                            {porcentaje}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-full sm:w-36">
                        <span className="absolute left-3 top-2.5 text-[#9AA3AD] text-xs font-bold">
                          ₡
                        </span>
                        <input
                          type="number"
                          step="any"
                          placeholder="Sin tope"
                          value={val}
                          onChange={(e) => handleChange(cat, e.target.value)}
                          className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-2.5 py-2 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Fixed Bottom Action Bar */}
            <div className="p-4 sm:p-5 border-t border-[#30353B]/70 bg-[#202328] shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] shadow-[0_-8px_16px_rgba(0,0,0,0.25)]">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:py-2.5 bg-[#35D0BA] active:bg-[#2EB39E] hover:bg-[#2EB39E] text-[#07150D] text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer w-full sm:w-auto order-1 sm:order-2 active:scale-[0.99]"
              >
                <Check className="w-4 h-4" />
                <span>{t('guardar_topes')}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#9AA3AD] hover:text-[#F4F6F8] active:text-[#F4F6F8] text-center transition-colors cursor-pointer order-2 sm:order-1"
              >
                {t('resumen_cancelar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
