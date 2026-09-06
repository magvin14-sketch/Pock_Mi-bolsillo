import { useState, useCallback } from 'react';
import { AppData, Movement, MovementType } from '../types';
import { getCurrentTimestamp, generateId } from '../utils';

interface DeletedMovementState {
  movement: Movement;
  originalIndex: number;
}

interface UseMovementsParams {
  /** Current movement list, used to locate a movement synchronously before it's removed (undo support). */
  historial: Movement[];
  /** Shared state updater from App.tsx — merges the returned partial AppData and stamps updated_at. */
  commitData: (updater: AppData | ((prev: AppData) => AppData)) => void;
  /** Cloud-sync notifiers from useAuthSync, forwarded so remote data stays in sync with local edits. */
  notifyMovementAdded: (movement: Movement) => void;
  notifyMovementDeleted: (movementId: string) => void;
}

/**
 * Encapsulates all CRUD logic for individual movements (gastos/ingresos):
 * add, edit, delete (with undo support), and undo itself.
 *
 * Extracted from App.tsx as part of Fase 3 — Arquitectura (ítem 17).
 */
export function useMovements({
  historial,
  commitData,
  notifyMovementAdded,
  notifyMovementDeleted,
}: UseMovementsParams) {
  const [deletedMovement, setDeletedMovement] = useState<DeletedMovementState | null>(null);

  // Add movement (Gasto o Ingreso)
  const handleAddMovement = useCallback(
    (desc: string, monto: number, categoria: string, tipo: MovementType) => {
      const { fecha, hora } = getCurrentTimestamp();
      const nuevoMovimiento: Movement = {
        id: generateId(),
        desc,
        categoria: tipo === 'gasto' ? categoria : null,
        tipo,
        monto,
        fecha,
        hora,
        updated_at: new Date().toISOString(),
      };

      commitData((prev) => {
        const delta = tipo === 'gasto' ? -monto : monto;
        return {
          ...prev,
          dinero_libre: prev.dinero_libre + delta,
          historial: [...prev.historial, nuevoMovimiento],
        };
      });

      notifyMovementAdded(nuevoMovimiento);
    },
    [commitData, notifyMovementAdded]
  );

  // Edit movement
  const handleEditMovement = useCallback(
    (movementId: string, updatedMovement: Movement) => {
      commitData((prev) => {
        const indexToEdit = prev.historial.findIndex((m) => m.id === movementId);
        const oldMov = indexToEdit >= 0 ? prev.historial[indexToEdit] : undefined;
        if (!oldMov) return prev;
        const savedMovement = { ...updatedMovement, id: oldMov.id, updated_at: new Date().toISOString() };

        // Calculate delta to adjust dinero_libre
        let delta = 0;
        // Undo old movement
        if (oldMov.tipo === 'gasto') delta += oldMov.monto;
        else if (oldMov.tipo === 'ingreso') delta -= oldMov.monto;
        else if (oldMov.tipo === 'base') delta -= oldMov.monto;

        // Apply new movement
        if (updatedMovement.tipo === 'gasto') delta -= updatedMovement.monto;
        else if (updatedMovement.tipo === 'ingreso') delta += updatedMovement.monto;
        else if (updatedMovement.tipo === 'base') delta += updatedMovement.monto;

        const updatedHistorial = [...prev.historial];
        updatedHistorial[indexToEdit] = savedMovement;

        return {
          ...prev,
          dinero_libre: prev.dinero_libre + delta,
          historial: updatedHistorial,
        };
      });

      notifyMovementAdded({ ...updatedMovement, updated_at: new Date().toISOString() });
    },
    [commitData, notifyMovementAdded]
  );

  // Delete movement (keeps a snapshot in local state so it can be restored via undo)
  const handleDeleteMovement = useCallback(
    (movementId: string) => {
      const indexToDelete = historial.findIndex((m) => m.id === movementId);
      const mov = indexToDelete >= 0 ? historial[indexToDelete] : undefined;
      if (!mov) return;
      setDeletedMovement({ movement: mov, originalIndex: indexToDelete });
      commitData((prev) => {
        const current = prev.historial.find((m) => m.id === movementId);
        if (!current) return prev;
        let adjustedBalance = prev.dinero_libre;
        if (current.tipo === 'gasto') adjustedBalance += current.monto;
        else if (current.tipo === 'ingreso') adjustedBalance -= current.monto;
        return {
          ...prev,
          dinero_libre: adjustedBalance,
          historial: prev.historial.filter((m) => m.id !== movementId),
          deleted_movements: current.id
            ? [...new Set([...(prev.deleted_movements || []), current.id])]
            : prev.deleted_movements,
        };
      });
      if (mov.id) notifyMovementDeleted(mov.id);
    },
    [historial, notifyMovementDeleted, commitData]
  );

  // Undo delete movement
  const handleUndoDeleteMovement = useCallback(() => {
    if (!deletedMovement) return;
    const { movement, originalIndex } = deletedMovement;
    commitData((prev) => {
      const nextHistorial = [...prev.historial];
      const insertAt = Math.min(originalIndex, nextHistorial.length);
      nextHistorial.splice(insertAt, 0, movement);

      let adjustedBalance = prev.dinero_libre;
      if (movement.tipo === 'gasto') {
        adjustedBalance -= movement.monto;
      } else if (movement.tipo === 'ingreso') {
        adjustedBalance += movement.monto;
      }

      return {
        ...prev,
        dinero_libre: adjustedBalance,
        historial: nextHistorial,
        deleted_movements: (prev.deleted_movements || []).filter((id) => id !== movement.id),
      };
    });

    notifyMovementAdded(movement);
    setDeletedMovement(null);
  }, [deletedMovement, notifyMovementAdded, commitData]);

  return {
    deletedMovement,
    setDeletedMovement,
    handleAddMovement,
    handleEditMovement,
    handleDeleteMovement,
    handleUndoDeleteMovement,
  };
}
