export type MovementType = 'gasto' | 'ingreso' | 'base';

export interface Movement {
  id?: string;
  desc: string;
  categoria: string | null;
  tipo: MovementType;
  monto: number;
  fecha: string; // DD/MM/YYYY
  hora: string;  // HH:MM:SS
}

export type DebtType = 'tarjeta' | 'prestamo' | 'prestado';

export interface Debt {
  id: string;
  tipo: DebtType;
  acreedor: string;
  monto_total: number;
  monto_pagado: number;
  fecha_limite: string;
  pagada: boolean;
}

export interface FixedExpense {
  id: string;
  desc: string;
  categoria: string;
  monto: number;
  activo: boolean;
}

export interface CycleHistoryEntry {
  id: string;
  fechaCorte: string;
  saldoInicial: number;
  saldoFinal: number;
  totalIngresos: number;
  totalGastos: number;
  ahorroNeto: number;
  totalMovimientos: number;
}

export type LanguageCode = 'es' | 'en';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface SavingsGoal {
  id: string;
  nombre: string;
  meta: number;
  ahorrado: number;
  fecha_limite?: string;
  color?: string;
  completada?: boolean;
}

export interface AppData {
  dinero_libre: number;
  limite_alerta: number;
  idioma_actual: LanguageCode;
  tema?: ThemeMode;
  historial: Movement[];
  deudas: Debt[];
  metas_ahorro?: SavingsGoal[];
  categorias_personalizadas?: string[];
  categorias_ocultas?: string[];
  presupuestos_categoria?: Record<string, number>;
  gastos_fijos?: FixedExpense[];
  historial_cortes?: CycleHistoryEntry[];
}

export type ViewType = 'inicio' | 'historial' | 'deudas' | 'ahorros' | 'resumen' | 'ajustes';
export type FilterType = 'todos' | 'gastos' | 'ingresos';
