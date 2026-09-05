import React from 'react';
import { Movement, LanguageCode, MovementType } from '../../types';
import { useDevice } from '../../hooks/useDevice';
import { InicioDesktopView } from './inicio/InicioDesktopView';
import { InicioMobileView } from './inicio/InicioMobileView';

interface InicioViewProps {
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

/**
 * InicioView coordina y despacha automáticamente
 * la vista móvil (InicioMobileView) o la vista de escritorio (InicioDesktopView)
 * según el dispositivo o ancho de pantalla del usuario.
 */
export const InicioView: React.FC<InicioViewProps> = (props) => {
  const { isMobile } = useDevice();

  if (isMobile) {
    return <InicioMobileView {...props} />;
  }

  return <InicioDesktopView {...props} />;
};
