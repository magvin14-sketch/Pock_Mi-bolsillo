import { useCallback } from 'react';
import { AppData, CycleHistoryEntry, FixedExpense, Movement } from '../types';
import { getCurrentTimestamp, createBaseMovement, generateId } from '../utils';

interface UseMonthCutParams {
  /** Shared state updater from App.tsx — merges the returned partial AppData and stamps updated_at. */
  commitData: (updater: AppData | ((prev: AppData) => AppData)) => void;
  /** Localized label for the "saldo base" movement created on each corte (e.g. t('saldo_base')). */
  saldoBaseLabel: string;
}

/**
 * Encapsulates the "Corte de Mes" (month-end close) workflow together with
 * the recurring fixed-expense (gastos fijos) logic it depends on:
 *  - updating the fixed-expense templates,
 *  - applying the currently-active ones on demand,
 *  - and running a full month cut: snapshotting the closing cycle into
 *    historial_cortes, resetting the ledger to a new saldo base, and
 *    optionally re-applying active fixed expenses right away.
 *
 * Extracted from App.tsx as part of Fase 3 — Arquitectura (ítem 20).
 */
export function useMonthCut({ commitData, saldoBaseLabel }: UseMonthCutParams) {
  // Update fixed expense templates
  const handleUpdateGastosFijos = useCallback(
    (gastos: FixedExpense[]) => {
      commitData((prev) => ({
        ...prev,
        gastos_fijos: gastos,
      }));
    },
    [commitData]
  );

  // Apply active fixed expenses immediately (outside of a month cut)
  const handleAplicarGastosFijosManual = useCallback(() => {
    commitData((prev) => {
      const activos = (prev.gastos_fijos || []).filter((g) => g.activo);
      if (activos.length === 0) return prev;

      const { fecha, hora } = getCurrentTimestamp();
      let suma = 0;
      const nuevosMovs: Movement[] = activos.map((fijo) => {
        suma += fijo.monto;
        return {
          id: generateId(),
          desc: fijo.desc,
          categoria: fijo.categoria,
          tipo: 'gasto',
          monto: fijo.monto,
          fecha,
          hora,
          updated_at: new Date().toISOString(),
        };
      });

      return {
        ...prev,
        dinero_libre: prev.dinero_libre - suma,
        historial: [...prev.historial, ...nuevosMovs],
      };
    });
  }, [commitData]);

  // Month Cut (Corte de Mes) with snapshot history and optional auto-recurring expenses
  const handleEjecutarCorte = useCallback(
    (nuevoSaldoBase: number, aplicarFijos: boolean) => {
      const primerMov = createBaseMovement(nuevoSaldoBase, saldoBaseLabel);

      commitData((prev) => {
        // Calculate snapshot of closing cycle
        let totalIngresos = 0;
        let totalGastos = 0;
        let saldoInicial = 0;
        for (const m of prev.historial) {
          if (m.tipo === 'base') saldoInicial += m.monto;
          else if (m.tipo === 'ingreso') totalIngresos += m.monto;
          else if (m.tipo === 'gasto') totalGastos += m.monto;
        }

        const { fecha } = getCurrentTimestamp();
        const snapshot: CycleHistoryEntry = {
          id: generateId(),
          fechaCorte: fecha,
          saldoInicial,
          saldoFinal: prev.dinero_libre,
          totalIngresos,
          totalGastos,
          ahorroNeto: saldoInicial + totalIngresos - totalGastos,
          totalMovimientos: prev.historial.length,
        };

        const nuevoHistorial: Movement[] = [primerMov];
        let saldoActualizado = nuevoSaldoBase;

        // Apply active fixed expenses if checked
        if (aplicarFijos) {
          const activos = (prev.gastos_fijos || []).filter((g) => g.activo);
          const { fecha: f, hora: h } = getCurrentTimestamp();
          for (const fijo of activos) {
            saldoActualizado -= fijo.monto;
            nuevoHistorial.push({
              id: generateId(),
              desc: fijo.desc,
              categoria: fijo.categoria,
              tipo: 'gasto',
              monto: fijo.monto,
              fecha: f,
              hora: h,
              updated_at: new Date().toISOString(),
            });
          }
        }

        return {
          ...prev,
          dinero_libre: saldoActualizado,
          historial: nuevoHistorial,
          historial_cortes: [...(prev.historial_cortes || []), snapshot],
        };
      });
    },
    [commitData, saldoBaseLabel]
  );

  return {
    handleUpdateGastosFijos,
    handleAplicarGastosFijosManual,
    handleEjecutarCorte,
  };
}
