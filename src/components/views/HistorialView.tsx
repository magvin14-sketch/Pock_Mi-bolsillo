import React, { useState, useMemo } from 'react';
import { Movement, LanguageCode, FilterType } from '../../types';
import { CATEGORIAS, TEXTOS } from '../../config';
import { formatColones, exportToCSV, getAllCategories, getCategoryLabel } from '../../utils';
import { Calendar, Trash2, Edit3, ArrowDownLeft, ArrowUpRight, ShieldCheck, Inbox, Search, Download, Filter } from 'lucide-react';
import { EditarMovimientoModal } from '../EditarMovimientoModal';
import { ConfirmModal } from '../ConfirmModal';

interface HistorialViewProps {
  historial: Movement[];
  categoriasPersonalizadas?: string[];
  categoriasOcultas?: string[];
  lang: LanguageCode;
  onDeleteMovement: (movementId: string) => void;
  onEditMovement: (movementId: string, updatedMovement: Movement) => void;
}

export const HistorialView: React.FC<HistorialViewProps> = ({
  historial,
  categoriasPersonalizadas = [],
  categoriasOcultas = [],
  lang,
  onDeleteMovement,
  onEditMovement,
}) => {
  const t = (key: keyof typeof TEXTOS['es']) => TEXTOS[lang][key] || key;

  const todasLasCategorias = useMemo(() => {
    return getAllCategories(categoriasPersonalizadas, categoriasOcultas);
  }, [categoriasPersonalizadas, categoriasOcultas]);

  const [filtro, setFiltro] = useState<FilterType>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [movimientoParaEditar, setMovimientoParaEditar] = useState<{ mov: Movement; id: string } | null>(null);
  const [movimientoParaEliminar, setMovimientoParaEliminar] = useState<{ id: string; desc: string; monto: number } | null>(null);

  // Filter movements
  const filteredMovements = useMemo(() => {
    const term = busqueda.trim().toLowerCase();

    // Map to preserve original array index for mutation operations
    const indexed = historial.map((mov) => ({ mov }));

    return indexed.filter(({ mov }) => {
      // 1. Type filter
      if (filtro === 'gastos' && mov.tipo !== 'gasto') return false;
      if (filtro === 'ingresos' && mov.tipo !== 'ingreso') return false;

      // 2. Category filter
      if (filtroCategoria !== 'todas' && mov.categoria !== filtroCategoria) {
        return false;
      }

      // 3. Search query
      if (term) {
        const matchDesc = (mov.desc || '').toLowerCase().includes(term);
        const matchCat = (mov.categoria || '').toLowerCase().includes(term);
        const matchMonto = mov.monto.toString().includes(term);
        const matchFecha = (mov.fecha || '').includes(term);
        if (!matchDesc && !matchCat && !matchMonto && !matchFecha) {
          return false;
        }
      }

      return true;
    });
  }, [historial, filtro, filtroCategoria, busqueda]);

  // Group by date
  const groupedMovements = useMemo(() => {
    const map = new Map<string, { mov: Movement }[]>();
    for (const item of filteredMovements) {
      const dateKey = item.mov.fecha || 'General';
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(item);
    }

    // Ordena los grupos de fecha del más reciente al más antiguo (fecha en formato DD/MM/YYYY)
    const parseFecha = (fecha: string): number => {
      const [day, month, year] = fecha.split('/').map(Number);
      if (!day || !month || !year) return 0;
      return new Date(year, month - 1, day).getTime();
    };

    return Array.from(map.entries()).sort(
      ([fechaA], [fechaB]) => parseFecha(fechaB) - parseFecha(fechaA)
    );
  }, [filteredMovements]);

  const handleDeleteWithConfirmation = (movementId: string) => {
    const mov = historial.find((item) => item.id === movementId);
    if (mov) {
      setMovimientoParaEliminar({
        id: movementId,
        desc: mov.desc || (lang === 'es' ? 'Movimiento' : 'Movement'),
        monto: mov.monto,
      });
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#30353B]/50">
        <h2 className="text-xl font-bold text-[#F4F6F8] flex items-center gap-2">
          <span>📜</span>
          <span>{t('historial_titulo')}</span>
        </h2>

        {/* Export to CSV Button */}
        <button
          id="btn-exportar-csv"
          type="button"
          onClick={() => exportToCSV(historial)}
          className="inline-flex items-center gap-2 bg-[#272B30] hover:bg-[#343A42] text-[#F4F6F8] font-semibold px-3 py-1.5 rounded-lg text-xs border border-[#30353B] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#35D0BA]" />
          <span>{t('exportar_csv')}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#202328] border border-[#30353B] rounded-xl p-3.5 space-y-3 shadow-sm">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9AA3AD] absolute left-3 top-2.5" />
          <input
            id="input-buscar-historial"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t('buscar_placeholder')}
            className="w-full bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg pl-9 pr-3 py-2 text-xs font-medium placeholder:text-[#9AA3AD]/50 transition-colors"
          />
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#30353B]/40">
          {/* Type Pills */}
          <div className="inline-flex bg-[#121316] p-1 rounded-lg border border-[#30353B]/70">
            <button
              id="filtro-todos"
              onClick={() => setFiltro('todos')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filtro === 'todos'
                  ? 'bg-[#272B30] text-[#F4F6F8] shadow-sm'
                  : 'text-[#9AA3AD] hover:text-[#F4F6F8]'
              }`}
            >
              {t('filtro_todos')}
            </button>
            <button
              id="filtro-gastos"
              onClick={() => setFiltro('gastos')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filtro === 'gastos'
                  ? 'bg-[#272B30] text-[#F0525D] shadow-sm'
                  : 'text-[#9AA3AD] hover:text-[#F4F6F8]'
              }`}
            >
              {t('filtro_gastos')}
            </button>
            <button
              id="filtro-ingresos"
              onClick={() => setFiltro('ingresos')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filtro === 'ingresos'
                  ? 'bg-[#272B30] text-[#2BC77B] shadow-sm'
                  : 'text-[#9AA3AD] hover:text-[#F4F6F8]'
              }`}
            >
              {t('filtro_ingresos')}
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#9AA3AD]" />
            <select
              id="select-filtro-categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-[#17191C] text-[#F4F6F8] border border-[#30353B] focus:border-[#35D0BA] focus:outline-none rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
            >
              <option value="todas">{t('filtro_cat_todas')}</option>
              {todasLasCategorias.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat, lang, true)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Movement List */}
      <div className="space-y-6">
        {groupedMovements.length === 0 ? (
          <div className="bg-[#202328] border border-[#30353B] rounded-xl p-12 text-center text-[#9AA3AD]">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-[#9AA3AD]/40" />
            <p className="text-sm font-medium">{t('sin_mov_filtro')}</p>
          </div>
        ) : (
          groupedMovements.map(([fecha, items]) => (
            <div key={fecha} className="space-y-2">
              {/* Date Header */}
              <div className="flex items-center gap-2 text-xs font-bold text-[#9AA3AD] uppercase tracking-wider pl-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{fecha}</span>
                <span className="text-[10px] text-[#9AA3AD]/60 lowercase">
                  ({items.length} {items.length === 1 ? 'movimiento' : 'movimientos'})
                </span>
              </div>

              {/* Items in that date */}
              <div className="space-y-2">
                {items.map(({ mov }) => {
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
                      key={mov.id}
                      className="bg-[#272B30] hover:bg-[#2c3138] border border-[#30353B] rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon badge */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${badgeBg}`}
                        >
                          {isGasto && <ArrowDownLeft className="w-4 h-4" />}
                          {isIngreso && <ArrowUpRight className="w-4 h-4" />}
                          {isBase && <ShieldCheck className="w-4 h-4" />}
                        </div>

                        {/* Title & Category */}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#F4F6F8] truncate">
                            {mov.desc}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9AA3AD]">
                            {categoryLabel && (
                              <span className="inline-block text-[11px] px-1.5 py-0.2 rounded bg-[#202328] border border-[#30353B]/60 text-[#9AA3AD]">
                                {categoryLabel}
                              </span>
                            )}
                            {mov.hora && <span>{mov.hora}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Amount and actions (Edit & Delete) */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`font-mono text-sm sm:text-base font-bold ${colorClass}`}>
                          {sign}
                          {formatColones(mov.monto)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            title={t('editar')}
                            onClick={() => setMovimientoParaEditar({ mov, id: mov.id })}
                            className="text-[#9AA3AD]/50 hover:text-[#35D0BA] p-1.5 rounded hover:bg-[#202328] transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title={t('eliminar')}
                            onClick={() => handleDeleteWithConfirmation(mov.id)}
                            className="text-[#9AA3AD]/50 hover:text-[#F0525D] p-1.5 rounded hover:bg-[#202328] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Movement Modal */}
      {movimientoParaEditar && (
        <EditarMovimientoModal
          movimiento={movimientoParaEditar.mov}
          movementId={movimientoParaEditar.id}
          categoriasPersonalizadas={categoriasPersonalizadas}
          categoriasOcultas={categoriasOcultas}
          lang={lang}
          onSave={onEditMovement}
          onClose={() => setMovimientoParaEditar(null)}
        />
      )}

      {/* Delete Movement Confirmation Modal */}
      {movimientoParaEliminar && (
        <ConfirmModal
          title={t('eliminar_confirm')}
          message={`${movimientoParaEliminar.desc} • ${formatColones(movimientoParaEliminar.monto)}`}
          confirmText={lang === 'es' ? 'Eliminar' : 'Delete'}
          cancelText={lang === 'es' ? 'Cancelar' : 'Cancel'}
          isDestructive={true}
          onConfirm={() => { onDeleteMovement(movimientoParaEliminar.id); setMovimientoParaEliminar(null); }}
          onClose={() => setMovimientoParaEliminar(null)}
        />
      )}
    </div>
  );
};
