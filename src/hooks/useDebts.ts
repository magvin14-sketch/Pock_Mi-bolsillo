import { useState, useCallback } from 'react';
import { AppData, Debt, Movement } from '../types';
import { getCurrentTimestamp, generateId } from '../utils';

interface UseDebtsParams {
  /** Shared state updater from App.tsx — merges the returned partial AppData and stamps updated_at. */
  commitData: (updater: AppData | ((prev: AppData) => AppData)) => void;
}

/**
 * Encapsulates debt (deudas) management: register a debt, confirm a payment
 * (abono) against it — which also records the corresponding expense movement
 * and adjusts dinero_libre — and delete a debt. Also owns the "which debt is
 * currently being paid" modal state (deudaParaAbono).
 *
 * Extracted from App.tsx as part of Fase 3 — Arquitectura (ítem 19).
 */
export function useDebts({ commitData }: UseDebtsParams) {
  const [deudaParaAbono, setDeudaParaAbono] = useState<Debt | null>(null);

  // Register debt
  const handleRegistrarDeuda = useCallback(
    (nueva: Omit<Debt, 'id' | 'pagada'>) => {
      const id = generateId();

      const debtRecord: Debt = {
        ...nueva,
        id,
        pagada: nueva.monto_pagado >= nueva.monto_total,
      };

      commitData((prev) => ({
        ...prev,
        deudas: [...prev.deudas, debtRecord],
      }));
    },
    [commitData]
  );

  // Confirm debt payment (abono)
  const handleConfirmarAbono = useCallback(
    (deudaId: string, montoAbono: number) => {
      const { fecha, hora } = getCurrentTimestamp();

      commitData((prev) => {
        let acreedorName = 'Deuda';
        const deuda = prev.deudas.find((d) => d.id === deudaId);
        if (!deuda) return prev;
        const montoReal = Math.min(
          Math.max(0, montoAbono),
          Math.max(0, deuda.monto_total - deuda.monto_pagado),
          Math.max(0, prev.dinero_libre)
        );
        if (montoReal <= 0) return prev;
        acreedorName = deuda.acreedor;
        const updatedDeudas = prev.deudas.map((d) => {
          if (d.id === deudaId) {
            const nuevoPagado = d.monto_pagado + montoReal;
            return { ...d, monto_pagado: nuevoPagado, pagada: nuevoPagado >= d.monto_total };
          }
          return d;
        });

        // Add expense movement for this payment
        const movimientoAbono: Movement = {
          id: generateId(),
          desc: `${acreedorName} (Abono)`,
          categoria: 'deuda',
          tipo: 'gasto',
          monto: montoReal,
          fecha,
          hora,
          updated_at: new Date().toISOString(),
        };

        return {
          ...prev,
          dinero_libre: prev.dinero_libre - montoReal,
          historial: [...prev.historial, movimientoAbono],
          deudas: updatedDeudas,
        };
      });

      setDeudaParaAbono(null);
    },
    [commitData]
  );

  // Delete debt
  const handleEliminarDeuda = useCallback(
    (id: string) => {
      commitData((prev) => ({
        ...prev,
        deudas: prev.deudas.filter((d) => d.id !== id),
      }));
    },
    [commitData]
  );

  return {
    deudaParaAbono,
    setDeudaParaAbono,
    handleRegistrarDeuda,
    handleConfirmarAbono,
    handleEliminarDeuda,
  };
}
