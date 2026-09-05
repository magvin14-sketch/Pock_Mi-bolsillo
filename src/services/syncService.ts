import { getSupabaseClient } from './supabase';
import { AppData, Movement, Debt, SavingsGoal, FixedExpense, CycleHistoryEntry } from '../types';

export interface RemoteSyncPayload {
  movements: Movement[];
  budgets: Record<string, number>;
  userData: Partial<AppData> | null;
}

export interface SyncResult {
  success: boolean;
  data?: AppData;
  error?: string;
  syncedAt?: string;
}

/**
 * Downloads all remote data from Supabase for the authenticated user_id
 */
export async function fetchRemoteUserData(userId: string): Promise<RemoteSyncPayload | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // 1. Fetch movements filtered strictly by user_id
    const { data: movementsData, error: movError } = await supabase
      .from('movements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (movError) {
      console.warn('Error fetching movements from Supabase:', movError.message);
    }

    // 2. Fetch category budgets filtered strictly by user_id
    const { data: budgetsData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (budgetError) {
      console.warn('Error fetching budgets from Supabase:', budgetError.message);
    }

    // 3. Fetch user settings and state (dinero_libre, deudas, metas)
    const { data: profileData, error: profileError } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Error fetching user_data from Supabase:', profileError.message);
    }

    // Transform movements
    const movements: Movement[] = (movementsData || []).map((row: any) => ({
      id: row.id,
      desc: row.desc,
      categoria: row.categoria || null,
      tipo: row.tipo,
      monto: Number(row.monto) || 0,
      fecha: row.fecha,
      hora: row.hora,
    }));

    // Transform budgets
    const budgets: Record<string, number> = {};
    if (Array.isArray(budgetsData)) {
      budgetsData.forEach((b: any) => {
        if (b.categoria && typeof b.monto !== 'undefined') {
          budgets[b.categoria] = Number(b.monto);
        }
      });
    }

    // Transform user_data
    let userData: Partial<AppData> | null = null;
    if (profileData) {
      userData = {
        dinero_libre: Number(profileData.dinero_libre) || 0,
        limite_alerta: Number(profileData.limite_alerta) || 0,
        idioma_actual: profileData.idioma_actual === 'en' ? 'en' : 'es',
        tema: profileData.tema || 'dark',
        deudas: Array.isArray(profileData.deudas) ? profileData.deudas : [],
        metas_ahorro: Array.isArray(profileData.metas_ahorro) ? profileData.metas_ahorro : [],
        gastos_fijos: Array.isArray(profileData.gastos_fijos) ? profileData.gastos_fijos : [],
        historial_cortes: Array.isArray(profileData.historial_cortes) ? profileData.historial_cortes : [],
        categorias_personalizadas: Array.isArray(profileData.categorias_personalizadas)
          ? profileData.categorias_personalizadas
          : [],
        categorias_ocultas: Array.isArray(profileData.categorias_ocultas)
          ? profileData.categorias_ocultas
          : [],
      };
    }

    return {
      movements,
      budgets,
      userData,
    };
  } catch (err: any) {
    console.error('Fatal error during fetchRemoteUserData:', err);
    return null;
  }
}

/**
 * Intelligent reconciliation of remote cloud data and local client data:
 * - Deduplicates movements by ID.
 * - Handles newly created records on either device.
 * - Preserves user preferences and balances.
 */
export function mergeRemoteWithLocal(local: AppData, remote: RemoteSyncPayload): AppData {
  // If remote has no data yet, keep local
  if (!remote.userData && remote.movements.length === 0) {
    return local;
  }

  // 1. Merge movements: combine unique by id
  const movementMap = new Map<string, Movement>();

  // Add remote movements first
  for (const mov of remote.movements) {
    const key = mov.id || `${mov.fecha}-${mov.hora}-${mov.desc}-${mov.monto}`;
    movementMap.set(key, mov);
  }

  // Add local movements (so any un-synced offline records are retained)
  for (const mov of local.historial) {
    const key = mov.id || `${mov.fecha}-${mov.hora}-${mov.desc}-${mov.monto}`;
    if (!movementMap.has(key)) {
      movementMap.set(key, mov);
    }
  }

  const mergedHistorial = Array.from(movementMap.values());

  // 2. Merge budgets
  const mergedBudgets: Record<string, number> = {
    ...(local.presupuestos_categoria || {}),
    ...(remote.budgets || {}),
  };

  // 3. User data / balance
  // If local is brand new/default or remote has more movements, prioritize remote balance
  const remoteUserData = remote.userData;
  const isLocalDefault = local.historial.length <= 1 && local.dinero_libre === 0;

  const dinero_libre =
    remoteUserData && typeof remoteUserData.dinero_libre === 'number'
      ? remoteUserData.dinero_libre
      : local.dinero_libre;

  const limite_alerta =
    remoteUserData && typeof remoteUserData.limite_alerta === 'number'
      ? remoteUserData.limite_alerta
      : local.limite_alerta;

  // Merge deudas by id
  const debtMap = new Map<string, Debt>();
  if (remoteUserData?.deudas) {
    remoteUserData.deudas.forEach((d) => debtMap.set(d.id, d));
  }
  local.deudas.forEach((d) => {
    if (!debtMap.has(d.id)) {
      debtMap.set(d.id, d);
    }
  });

  // Merge savings goals by id
  const goalMap = new Map<string, SavingsGoal>();
  if (remoteUserData?.metas_ahorro) {
    remoteUserData.metas_ahorro.forEach((g) => goalMap.set(g.id, g));
  }
  (local.metas_ahorro || []).forEach((g) => {
    if (!goalMap.has(g.id)) {
      goalMap.set(g.id, g);
    }
  });

  // Merge custom categories
  const customCatSet = new Set<string>([
    ...(local.categorias_personalizadas || []),
    ...(remoteUserData?.categorias_personalizadas || []),
  ]);

  const hiddenCatSet = new Set<string>([
    ...(local.categorias_ocultas || []),
    ...(remoteUserData?.categorias_ocultas || []),
  ]);

  return {
    ...local,
    dinero_libre,
    limite_alerta,
    idioma_actual: remoteUserData?.idioma_actual || local.idioma_actual,
    tema: remoteUserData?.tema || local.tema,
    historial: mergedHistorial,
    presupuestos_categoria: mergedBudgets,
    deudas: Array.from(debtMap.values()),
    metas_ahorro: Array.from(goalMap.values()),
    gastos_fijos: remoteUserData?.gastos_fijos || local.gastos_fijos,
    historial_cortes: remoteUserData?.historial_cortes || local.historial_cortes,
    categorias_personalizadas: Array.from(customCatSet),
    categorias_ocultas: Array.from(hiddenCatSet),
  };
}

/**
 * Pushes a single movement to Supabase (Add / Edit)
 */
export async function pushMovementToRemote(userId: string, movement: Movement): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;

  try {
    const payload = {
      id: movement.id || `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      desc: movement.desc,
      categoria: movement.categoria,
      tipo: movement.tipo,
      monto: movement.monto,
      fecha: movement.fecha,
      hora: movement.hora,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('movements').upsert(payload);
    if (error) {
      console.warn('Could not push movement to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error pushing movement to Supabase:', err);
    return false;
  }
}

/**
 * Deletes a single movement from remote Supabase
 */
export async function deleteMovementFromRemote(userId: string, movementId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !movementId) return false;

  try {
    const { error } = await supabase
      .from('movements')
      .delete()
      .eq('id', movementId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Could not delete movement from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error deleting movement from Supabase:', err);
    return false;
  }
}

/**
 * Pushes category budgets to Supabase
 */
export async function pushBudgetsToRemote(
  userId: string,
  budgets: Record<string, number>
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;

  try {
    const rows = Object.entries(budgets).map(([categoria, monto]) => ({
      id: `${userId}_${categoria}`,
      user_id: userId,
      categoria,
      monto,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length === 0) return true;

    const { error } = await supabase.from('budgets').upsert(rows);
    if (error) {
      console.warn('Could not push budgets to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error pushing budgets to Supabase:', err);
    return false;
  }
}

/**
 * Pushes general user data (balance, debts, settings, goals) to Supabase
 */
export async function pushUserDataToRemote(userId: string, data: AppData): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;

  try {
    const payload = {
      user_id: userId,
      dinero_libre: data.dinero_libre,
      limite_alerta: data.limite_alerta,
      idioma_actual: data.idioma_actual,
      tema: data.tema || 'dark',
      deudas: data.deudas || [],
      metas_ahorro: data.metas_ahorro || [],
      gastos_fijos: data.gastos_fijos || [],
      historial_cortes: data.historial_cortes || [],
      categorias_personalizadas: data.categorias_personalizadas || [],
      categorias_ocultas: data.categorias_ocultas || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('user_data').upsert(payload);
    if (error) {
      console.warn('Could not push user_data to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error pushing user_data to Supabase:', err);
    return false;
  }
}

/**
 * Executes a full 2-way sync:
 * 1. Pulls remote state.
 * 2. Merges with local data.
 * 3. Uploads merged state back to cloud so both device and cloud are in parity.
 */
export async function synchronizeFullData(
  userId: string,
  localData: AppData
): Promise<SyncResult> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return { success: false, error: 'Supabase no está configurado o no hay sesión activa' };
  }

  try {
    // 1. Fetch remote data
    const remote = await fetchRemoteUserData(userId);

    // 2. Merge remote with local
    const mergedData = remote ? mergeRemoteWithLocal(localData, remote) : localData;

    // 3. Push merged movements to remote
    if (mergedData.historial.length > 0) {
      const movementRows = mergedData.historial.map((m) => ({
        id: m.id || `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        user_id: userId,
        desc: m.desc,
        categoria: m.categoria,
        tipo: m.tipo,
        monto: m.monto,
        fecha: m.fecha,
        hora: m.hora,
        updated_at: new Date().toISOString(),
      }));

      // Batch upsert in chunks of 50
      for (let i = 0; i < movementRows.length; i += 50) {
        const chunk = movementRows.slice(i, i + 50);
        await supabase.from('movements').upsert(chunk);
      }
    }

    // 4. Push budgets
    if (mergedData.presupuestos_categoria) {
      await pushBudgetsToRemote(userId, mergedData.presupuestos_categoria);
    }

    // 5. Push user profile data
    await pushUserDataToRemote(userId, mergedData);

    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      success: true,
      data: mergedData,
      syncedAt: nowFormatted,
    };
  } catch (err: any) {
    console.error('Error during full synchronization:', err);
    return {
      success: false,
      error: err.message || 'Error de conexión durante la sincronización',
    };
  }
}
