import { AppData, Movement, LanguageCode } from './types';
import { INITIAL_DATA, TEXTOS } from './config';

const STORAGE_KEY = 'my_pocket_finance_data';

export function formatColones(amount: number): string {
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-₡${absFormatted}` : `₡${absFormatted}`;
}

export function getCurrentTimestamp(): { fecha: string; hora: string } {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return {
    fecha: `${day}/${month}/${year}`,
    hora: `${hours}:${minutes}:${seconds}`,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function loadStoredData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.dinero_libre === 'number' && !isNaN(parsed.dinero_libre)) {
      return {
        dinero_libre: parsed.dinero_libre,
        limite_alerta:
          typeof parsed.limite_alerta === 'number' && !isNaN(parsed.limite_alerta)
            ? parsed.limite_alerta
            : 0,
        idioma_actual: parsed.idioma_actual === 'en' ? 'en' : 'es',
        tema:
          parsed.tema === 'light' || parsed.tema === 'dark' || parsed.tema === 'system'
            ? parsed.tema
            : 'dark',
        historial: Array.isArray(parsed.historial)
          ? parsed.historial
              .filter((m: any) => m && typeof m === 'object')
              .map((m: any, idx: number) => ({
                id: m.id || `mov-${idx}-${Date.now()}`,
                desc: String(m.desc || ''),
                categoria: m.categoria || null,
                tipo: m.tipo === 'ingreso' || m.tipo === 'base' ? m.tipo : 'gasto',
                monto: typeof m.monto === 'number' && !isNaN(m.monto) ? m.monto : 0,
                fecha: m.fecha || getCurrentTimestamp().fecha,
                hora: m.hora || getCurrentTimestamp().hora,
              }))
          : INITIAL_DATA.historial,
        deudas: Array.isArray(parsed.deudas)
          ? parsed.deudas
              .filter((d: any) => d && typeof d === 'object')
              .map((d: any, idx: number) => ({
                id: d.id || `deuda-${idx}-${Date.now()}`,
                tipo: d.tipo || 'prestamo',
                acreedor: String(d.acreedor || ''),
                monto_total: typeof d.monto_total === 'number' && !isNaN(d.monto_total) ? d.monto_total : 0,
                monto_pagado: typeof d.monto_pagado === 'number' && !isNaN(d.monto_pagado) ? d.monto_pagado : 0,
                fecha_limite: String(d.fecha_limite || ''),
                pagada: Boolean(d.pagada),
              }))
          : INITIAL_DATA.deudas,
        presupuestos_categoria:
          parsed.presupuestos_categoria && typeof parsed.presupuestos_categoria === 'object'
            ? parsed.presupuestos_categoria
            : INITIAL_DATA.presupuestos_categoria || {},
        gastos_fijos:
          Array.isArray(parsed.gastos_fijos) && parsed.gastos_fijos.length > 0
            ? parsed.gastos_fijos
            : INITIAL_DATA.gastos_fijos,
        historial_cortes: Array.isArray(parsed.historial_cortes) ? parsed.historial_cortes : [],
        metas_ahorro: Array.isArray(parsed.metas_ahorro)
          ? parsed.metas_ahorro
              .filter((g: any) => g && typeof g === 'object')
              .map((g: any, idx: number) => ({
                id: g.id || `meta-${idx}-${Date.now()}`,
                nombre: String(g.nombre || ''),
                meta: typeof g.meta === 'number' && !isNaN(g.meta) ? g.meta : 0,
                ahorrado: typeof g.ahorrado === 'number' && !isNaN(g.ahorrado) ? g.ahorrado : 0,
                fecha_limite: g.fecha_limite ? String(g.fecha_limite) : undefined,
                color: g.color ? String(g.color) : undefined,
                completada: Boolean(g.completada),
              }))
          : [],
        categorias_personalizadas: Array.isArray(parsed.categorias_personalizadas)
          ? parsed.categorias_personalizadas.filter((c: any) => typeof c === 'string')
          : [],
        categorias_ocultas: Array.isArray(parsed.categorias_ocultas)
          ? parsed.categorias_ocultas.filter((c: any) => typeof c === 'string')
          : [],
      };
    }
  } catch (e) {
    console.error('Error loading data from localStorage, falling back to initial data', e);
  }
  return INITIAL_DATA;
}

export const BASE_CATEGORIES = [
  'comida',
  'transporte',
  'vivienda',
  'salud',
  'entretenimiento',
  'servicios',
  'salario',
  'deuda',
  'otros',
];

export function getAllCategories(
  customCategories: string[] = [],
  hiddenCategories: string[] = []
): string[] {
  const hiddenSet = new Set((hiddenCategories || []).map((c) => c.toLowerCase()));
  const base = BASE_CATEGORIES.filter((c) => !hiddenSet.has(c.toLowerCase()));
  const custom = (customCategories || []).filter((c) => !hiddenSet.has(c.toLowerCase()));
  const unique = new Set([...base, ...custom]);
  const list = Array.from(unique);
  if (list.length === 0) return ['otros'];
  return list;
}

export function getCategoryLabel(
  cat: string | null | undefined,
  lang: LanguageCode = 'es',
  withEmoji: boolean = true
): string {
  if (!cat) return '';
  const normalizedKey = `cat_${cat.toLowerCase().trim()}` as keyof typeof TEXTOS['es'];
  const textDict = TEXTOS[lang] || TEXTOS['es'];
  if (textDict && textDict[normalizedKey]) {
    const translated = textDict[normalizedKey];
    if (!withEmoji) {
      return translated.replace(/^[\p{Emoji}\u200B-\u3300\s]+/u, '').trim() || translated;
    }
    return translated;
  }

  // If the category was saved with a prefix like "cat_Perro" by error previously, sanitize it
  const cleanName = cat.startsWith('cat_') ? cat.substring(4) : cat;
  return withEmoji ? `🏷️ ${cleanName}` : cleanName;
}

export function saveStoredData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving data to localStorage', e);
  }
}

export function createBaseMovement(monto: number, baseLabel: string): Movement {
  const { fecha, hora } = getCurrentTimestamp();
  return {
    id: generateId(),
    desc: baseLabel,
    categoria: null,
    tipo: 'base',
    monto,
    fecha,
    hora,
  };
}

export function exportToCSV(historial: Movement[]): void {
  // UTF-8 BOM to ensure symbols and accents open accurately in Microsoft Excel and Numbers
  const bom = '\uFEFF';
  const header = ['Fecha', 'Hora', 'Tipo', 'Descripción', 'Categoría', 'Monto_Colones'];
  const rows = historial.map((m) => [
    m.fecha,
    m.hora,
    m.tipo.toUpperCase(),
    `"${(m.desc || '').replace(/"/g, '""')}"`,
    `"${(m.categoria || 'Sin categoría').replace(/"/g, '""')}"`,
    m.monto.toFixed(2),
  ]);

  const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MyPocket_Historial_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
