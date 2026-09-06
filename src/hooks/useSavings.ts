import { useCallback } from 'react';
import { AppData, SavingsGoal } from '../types';
import { getCurrentTimestamp, generateId } from '../utils';

interface UseSavingsParams {
  /** Shared state updater from App.tsx — merges the returned partial AppData and stamps updated_at. */
  commitData: (updater: AppData | ((prev: AppData) => AppData)) => void;
}

/**
 * Encapsulates savings-goal (metas de ahorro) logic: create/update, delete,
 * deposit, and withdraw — including the optional movement it creates when
 * money is moved to/from the user's dinero_libre.
 *
 * Extracted from App.tsx as part of Fase 3 — Arquitectura (ítem 18).
 */
export function useSavings({ commitData }: UseSavingsParams) {
  // Save / Update savings goal
  const handleSaveGoal = useCallback(
    (goal: SavingsGoal) => {
      commitData((prev) => {
        const metas = prev.metas_ahorro || [];
        const idx = metas.findIndex((m) => m.id === goal.id);
        let updatedMetas: SavingsGoal[];
        if (idx >= 0) {
          updatedMetas = [...metas];
          updatedMetas[idx] = goal;
        } else {
          updatedMetas = [...metas, goal];
        }
        return {
          ...prev,
          metas_ahorro: updatedMetas,
        };
      });
    },
    [commitData]
  );

  // Delete savings goal
  const handleDeleteGoal = useCallback(
    (goalId: string) => {
      commitData((prev) => ({
        ...prev,
        metas_ahorro: (prev.metas_ahorro || []).filter((m) => m.id !== goalId),
      }));
    },
    [commitData]
  );

  // Deposit into savings goal
  const handleDepositToGoal = useCallback(
    (goalId: string, requestedAmount: number, deductFromFreeMoney: boolean) => {
      const amount = Math.max(0, requestedAmount);
      if (!amount) return;
      const { fecha, hora } = getCurrentTimestamp();
      commitData((prev) => {
        const goal = (prev.metas_ahorro || []).find((m) => m.id === goalId);
        if (!goal) return prev;
        const actualAmount = deductFromFreeMoney ? Math.min(amount, Math.max(0, prev.dinero_libre)) : amount;
        if (actualAmount <= 0) return prev;
        const nuevoAhorrado = (goal.ahorrado || 0) + actualAmount;
        const updatedMetas = (prev.metas_ahorro || []).map((m) =>
          m.id === goalId ? { ...m, ahorrado: nuevoAhorrado, completada: nuevoAhorrado >= m.meta } : m
        );
        let nuevoDineroLibre = prev.dinero_libre;
        let nuevoHistorial = prev.historial;
        if (deductFromFreeMoney) {
          nuevoDineroLibre -= actualAmount;
          nuevoHistorial = [
            ...prev.historial,
            {
              id: generateId(),
              desc: `${goal.nombre} (Aporte Ahorro)`,
              categoria: 'otros',
              tipo: 'gasto',
              monto: actualAmount,
              fecha,
              hora,
              updated_at: new Date().toISOString(),
            },
          ];
        }
        return { ...prev, dinero_libre: nuevoDineroLibre, historial: nuevoHistorial, metas_ahorro: updatedMetas };
      });
    },
    [commitData]
  );

  // Withdraw from savings goal
  const handleWithdrawFromGoal = useCallback(
    (goalId: string, requestedAmount: number, returnToFreeMoney: boolean) => {
      const amount = Math.max(0, requestedAmount);
      if (!amount) return;
      const { fecha, hora } = getCurrentTimestamp();
      commitData((prev) => {
        const goal = (prev.metas_ahorro || []).find((m) => m.id === goalId);
        if (!goal) return prev;
        const actualAmount = Math.min(amount, Math.max(0, goal.ahorrado || 0));
        if (actualAmount <= 0) return prev;
        const nuevoAhorrado = (goal.ahorrado || 0) - actualAmount;
        const updatedMetas = (prev.metas_ahorro || []).map((m) =>
          m.id === goalId ? { ...m, ahorrado: nuevoAhorrado, completada: nuevoAhorrado >= m.meta } : m
        );
        let nuevoDineroLibre = prev.dinero_libre;
        let nuevoHistorial = prev.historial;
        if (returnToFreeMoney) {
          nuevoDineroLibre += actualAmount;
          nuevoHistorial = [
            ...prev.historial,
            {
              id: generateId(),
              desc: `${goal.nombre} (Retiro Ahorro)`,
              categoria: null,
              tipo: 'ingreso',
              monto: actualAmount,
              fecha,
              hora,
              updated_at: new Date().toISOString(),
            },
          ];
        }
        return { ...prev, dinero_libre: nuevoDineroLibre, historial: nuevoHistorial, metas_ahorro: updatedMetas };
      });
    },
    [commitData]
  );

  return {
    handleSaveGoal,
    handleDeleteGoal,
    handleDepositToGoal,
    handleWithdrawFromGoal,
  };
}
