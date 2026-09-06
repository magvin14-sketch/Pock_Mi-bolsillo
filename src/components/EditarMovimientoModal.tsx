import React, { useState, useMemo } from 'react';
import { Movement, MovementType, LanguageCode } from '../types';
import { CATEGORIAS, TEXTOS } from '../config';
import { getAllCategories, getCategoryLabel, parseMoneyInput } from '../utils';
import { X, Check } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface EditarMovimientoModalProps {
  movimiento: Movement;
  movementId: string;
  categoriasPersonalizadas?: string[];
  categoriasOcultas?: string[];
  lang: LanguageCode;
  onSave: (movementId: string, updatedMovement: Movement) => void;
  onClose: () => void;
}

export const EditarMovimientoModal: React.FC<EditarMovimientoModalProps> = ({
  movimiento,
  movementId,
  categoriasPersonalizadas = [],
  categoriasOcultas = [],
  lang,
  onSave,
  onClose,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const todasLasCategorias = useMemo(() => {
    return getAllCategories(categoriasPersonalizadas, categoriasOcultas);
  }, [categoriasPersonalizadas, categoriasOcultas]);

  const [desc, setDesc] = useState(movimiento.desc);
  const [monto, setMonto] = useState(String(movimiento.monto));
  const [tipo, setTipo] = useState<MovementType>(movimiento.tipo);
  const [categoria, setCategoria] = useState<string>(movimiento.categoria || 'otros');
  const [fecha, setFecha] = useState(movimiento.fecha);
  const [hora, setHora] = useState(movimiento.hora);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDesc = desc.trim();
    if (!cleanDesc) {
      setError(t('aviso_desc'));
      return;
    }

    const cleanMonto = parseMoneyInput(monto) ?? NaN;
    if (isNaN(cleanMonto) || cleanMonto <= 0) {
      setError(t('aviso_monto'));
      return;
    }

    onSave(movementId, {
      id: movimiento.id,
      desc: cleanDesc,
      monto: cleanMonto,
      tipo,
      categoria: tipo === 'gasto' ? categoria : null,
      fecha: fecha.trim(),
      hora: hora.trim(),
    });
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#202328] border border-[#30353B] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fadeIn my-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#30353B]/50">
            <h4 className="text-base font-bold text-[#F4F6F8]">
              {t('editar_mov')}
            </h4>
            <button
              onClick={onClose}
              className="text-[#9AA3AD] hover:text-[#F4F6F8] p-1.5 rounded-lg hover:bg-[#272B30] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-[#F0525D]/15 border border-[#F0525D]/30 text-[#F0525D] text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-[#9AA3AD] mb-1">
                {t('desc')}
              </label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#9AA3AD] mb-1">
                  {t('monto')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#9AA3AD] font-bold">₡</span>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-7 pr-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#9AA3AD] mb-1">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as MovementType)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 font-semibold"
                >
                  <option value="gasto">{t('gasto_btn')}</option>
                  <option value="ingreso">{t('ingreso_btn')}</option>
                  <option value="base">{t('saldo_base')}</option>
                </select>
              </div>
            </div>

            {tipo === 'gasto' && (
              <div>
                <label className="block font-bold text-[#9AA3AD] mb-1">
                  {t('categoria_lbl')}
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 font-semibold"
                >
                  {todasLasCategorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat, lang, true)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#9AA3AD] mb-1">
                  Fecha (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[#9AA3AD] mb-1">
                  Hora (HH:MM:SS)
                </label>
                <input
                  type="text"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full bg-[#272B30] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30353B]/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#9AA3AD] hover:text-[#F4F6F8] transition-colors cursor-pointer"
              >
                {t('resumen_cancelar')}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#35D0BA] hover:bg-[#2EB39E] text-[#07150D] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('guardar_cambios')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
