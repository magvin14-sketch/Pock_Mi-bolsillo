import { Movement, LanguageCode, MovementType } from '../../../types';

export interface InicioComponentProps {
  dineroLibre: number;
  limiteAlerta: number;
  historial: Movement[];
  presupuestos: Record<string, number>;
  categoriasPersonalizadas?: string[];
  categoriasOcultas?: string[];
  lang: LanguageCode;
  onAddMovement: (desc: string, monto: number, categoria: string, tipo: MovementType) => void;
  onSavePresupuestos: (nuevosPresupuestos: Record<string, number>) => void;
  onNavigateToHistorial?: () => void;
}
