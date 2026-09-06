import { getSupabaseClient } from './supabase';
import { AppData, Movement, Debt, SavingsGoal } from '../types';
import { generateId } from '../utils';

export interface RemoteSyncPayload {
  movements: Movement[];
  budgets: Record<string, number>;
  userData: Partial<AppData> | null;
  deletedMovements: string[];
}

export interface SyncResult {
  success: boolean;
  data?: AppData;
  error?: string;
  syncedAt?: string;
}

const nowIso = () => new Date().toISOString();

function newer<T extends { updated_at?: string }>(local: T, remote: T): T {
  const lt = local.updated_at ? Date.parse(local.updated_at) : 0;
  const rt = remote.updated_at ? Date.parse(remote.updated_at) : 0;
  return lt > rt ? local : remote;
}

export async function fetchRemoteUserData(userId: string): Promise<RemoteSyncPayload | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const [movementsResult, budgetsResult, profileResult] = await Promise.all([
      supabase.from('movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (movementsResult.error) throw new Error(`movements: ${movementsResult.error.message}`);
    if (budgetsResult.error) throw new Error(`budgets: ${budgetsResult.error.message}`);
    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      throw new Error(`user_data: ${profileResult.error.message}`);
    }

    const movements: Movement[] = (movementsResult.data || []).map((row: any) => ({
      id: String(row.id), desc: String(row.desc ?? ''), categoria: row.categoria || null,
      tipo: row.tipo === 'ingreso' || row.tipo === 'base' ? row.tipo : 'gasto',
      monto: Number(row.monto) || 0, fecha: String(row.fecha ?? ''), hora: String(row.hora ?? ''),
      updated_at: typeof row.updated_at === 'string' ? row.updated_at : row.created_at,
    }));

    const budgets: Record<string, number> = {};
    for (const b of budgetsResult.data || []) {
      const cat = b.categoria || b.category;
      const val = b.monto ?? b.amount;
      if (cat && val !== undefined) budgets[String(cat)] = Number(val) || 0;
    }

    let userData: Partial<AppData> | null = null;
    const profile: any = profileResult.data;
    if (profile) {
      const nested = profile.data || {};
      const pick = (key: string, fallback: any) => profile[key] !== undefined && profile[key] !== null ? profile[key] : nested[key] ?? fallback;
      userData = {
        dinero_libre: Number(pick('dinero_libre', 0)) || 0,
        limite_alerta: Number(pick('limite_alerta', 0)) || 0,
        idioma_actual: pick('idioma_actual', 'es') === 'en' ? 'en' : 'es',
        tema: ['dark','light','system'].includes(pick('tema', 'dark')) ? pick('tema', 'dark') : 'dark',
        deudas: Array.isArray(pick('deudas', [])) ? pick('deudas', []) : [],
        metas_ahorro: Array.isArray(pick('metas_ahorro', [])) ? pick('metas_ahorro', []) : [],
        gastos_fijos: Array.isArray(pick('gastos_fijos', [])) ? pick('gastos_fijos', []) : [],
        historial_cortes: Array.isArray(pick('historial_cortes', [])) ? pick('historial_cortes', []) : [],
        categorias_personalizadas: Array.isArray(pick('categorias_personalizadas', [])) ? pick('categorias_personalizadas', []) : [],
        categorias_ocultas: Array.isArray(pick('categorias_ocultas', [])) ? pick('categorias_ocultas', []) : [],
        deleted_movements: Array.isArray(pick('deleted_movements', [])) ? pick('deleted_movements', []) : [],
        updated_at: typeof profile.updated_at === 'string' ? profile.updated_at : undefined,
      };
    }

    return { movements, budgets, userData, deletedMovements: userData?.deleted_movements || [] };
  } catch (err) {
    console.error('Error fetching remote Pock data:', err);
    return null;
  }
}

export function mergeRemoteWithLocal(local: AppData, remote: RemoteSyncPayload): AppData {
  const deleted = new Set([...(local.deleted_movements || []), ...(remote.deletedMovements || [])]);
  const movementMap = new Map<string, Movement>();
  for (const m of remote.movements) if (m.id && !deleted.has(m.id)) movementMap.set(m.id, m);
  for (const m of local.historial) {
    if (!m.id || deleted.has(m.id)) continue;
    const existing = movementMap.get(m.id);
    movementMap.set(m.id, existing ? newer(m, existing) : m);
  }

  const remoteUser = remote.userData;
  const localUpdated = local.updated_at ? Date.parse(local.updated_at) : 0;
  const remoteUpdated = remoteUser?.updated_at ? Date.parse(remoteUser.updated_at) : 0;
  const localHasMeaningfulData = local.historial.length > 0 || local.dinero_libre !== 0 || local.deudas.length > 0 || (local.metas_ahorro || []).length > 0;
  const remoteLooksNew = remote.movements.length === 0 && !!remoteUser && Number(remoteUser.dinero_libre || 0) === 0 && (remoteUser.deudas || []).length === 0 && (remoteUser.metas_ahorro || []).length === 0;
  const useLocalProfile = (localHasMeaningfulData && remoteLooksNew && localUpdated === 0) || localUpdated > remoteUpdated;
  const profile = useLocalProfile ? local : (remoteUser || local);

  const debtMap = new Map<string, Debt>();
  for (const d of remoteUser?.deudas || []) debtMap.set(d.id, d);
  for (const d of local.deudas) if (!debtMap.has(d.id)) debtMap.set(d.id, d);

  const goalMap = new Map<string, SavingsGoal>();
  for (const g of remoteUser?.metas_ahorro || []) goalMap.set(g.id, g);
  for (const g of local.metas_ahorro || []) if (!goalMap.has(g.id)) goalMap.set(g.id, g);

  const merged: AppData = {
    ...local,
    dinero_libre: Number(profile.dinero_libre ?? local.dinero_libre),
    limite_alerta: Number(profile.limite_alerta ?? local.limite_alerta),
    idioma_actual: profile.idioma_actual || local.idioma_actual,
    tema: profile.tema || local.tema,
    historial: Array.from(movementMap.values()),
    presupuestos_categoria: useLocalProfile ? (local.presupuestos_categoria || {}) : (remote.budgets && Object.keys(remote.budgets).length ? remote.budgets : local.presupuestos_categoria || {}),
    deudas: Array.from(debtMap.values()),
    metas_ahorro: Array.from(goalMap.values()),
    gastos_fijos: profile.gastos_fijos || local.gastos_fijos,
    historial_cortes: profile.historial_cortes || local.historial_cortes,
    categorias_personalizadas: Array.from(new Set([...(local.categorias_personalizadas || []), ...(remoteUser?.categorias_personalizadas || [])])),
    categorias_ocultas: Array.from(new Set([...(local.categorias_ocultas || []), ...(remoteUser?.categorias_ocultas || [])])),
    deleted_movements: Array.from(deleted),
    updated_at: useLocalProfile ? local.updated_at : remoteUser?.updated_at,
  };
  return merged;
}

export async function pushMovementToRemote(userId: string, movement: Movement): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !movement.id) return false;
  try {
    const { error } = await supabase.from('movements').upsert({ ...movement, user_id: userId, updated_at: movement.updated_at || nowIso() });
    return !error;
  } catch { return false; }
}

export async function deleteMovementFromRemote(userId: string, movementId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !movementId) return false;
  try {
    const { error } = await supabase.from('movements').delete().eq('id', movementId).eq('user_id', userId);
    return !error;
  } catch { return false; }
}

export async function pushBudgetsToRemote(userId: string, budgets: Record<string, number>): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;
  try {
    const { error: deleteError } = await supabase.from('budgets').delete().eq('user_id', userId);
    if (deleteError) return false;
    const rows = Object.entries(budgets).map(([categoria, monto]) => ({ id: `${userId}_${encodeURIComponent(categoria)}`, user_id: userId, categoria, monto, updated_at: nowIso() }));
    if (!rows.length) return true;
    const { error } = await supabase.from('budgets').insert(rows);
    return !error;
  } catch { return false; }
}

export async function pushUserDataToRemote(userId: string, data: AppData): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;
  try {
    const payload = {
      user_id: userId, dinero_libre: data.dinero_libre, limite_alerta: data.limite_alerta,
      idioma_actual: data.idioma_actual, tema: data.tema || 'dark', deudas: data.deudas || [],
      metas_ahorro: data.metas_ahorro || [], gastos_fijos: data.gastos_fijos || [],
      historial_cortes: data.historial_cortes || [], categorias_personalizadas: data.categorias_personalizadas || [],
      categorias_ocultas: data.categorias_ocultas || [], deleted_movements: data.deleted_movements || [], updated_at: data.updated_at || nowIso(),
    };
    const { error } = await supabase.from('user_data').upsert(payload, { onConflict: 'user_id' });
    return !error;
  } catch { return false; }
}

export async function pushLocalDataToRemote(userId: string, data: AppData): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return false;
  try {
    const deleted = new Set(data.deleted_movements || []);
    for (const id of deleted) await deleteMovementFromRemote(userId, id);
    const rows = data.historial.filter(m => m.id && !deleted.has(m.id)).map(m => ({
      ...m, user_id: userId, updated_at: m.updated_at || nowIso(),
    }));
    for (let i = 0; i < rows.length; i += 50) {
      const { error } = await supabase.from('movements').upsert(rows.slice(i, i + 50));
      if (error) return false;
    }
    if (!(await pushBudgetsToRemote(userId, data.presupuestos_categoria || {}))) return false;
    return await pushUserDataToRemote(userId, { ...data, updated_at: data.updated_at || nowIso() });
  } catch (err) {
    console.warn('Error pushing local Pock state:', err);
    return false;
  }
}

export async function synchronizeFullData(userId: string, localData: AppData): Promise<SyncResult> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return { success: false, error: 'Supabase no está configurado o no hay sesión activa' };
  try {
    const remote = await fetchRemoteUserData(userId);
    if (!remote) return { success: false, error: 'No se pudo leer la información de Supabase.' };
    const merged = mergeRemoteWithLocal(localData, remote);

    const deleted = new Set(merged.deleted_movements || []);
    for (const id of deleted) await deleteMovementFromRemote(userId, id);

    const movements = merged.historial.filter(m => m.id && !deleted.has(m.id));
    for (let i = 0; i < movements.length; i += 50) {
      const rows = movements.slice(i, i + 50).map(m => ({ ...m, user_id: userId, updated_at: m.updated_at || nowIso() }));
      const { error } = await supabase.from('movements').upsert(rows);
      if (error) return { success: false, data: merged, error: `No se pudieron sincronizar movimientos: ${error.message}` };
    }

    if (!(await pushBudgetsToRemote(userId, merged.presupuestos_categoria || {}))) return { success: false, data: merged, error: 'No se pudieron sincronizar los presupuestos.' };
    if (!(await pushUserDataToRemote(userId, { ...merged, updated_at: merged.updated_at || nowIso() }))) return { success: false, data: merged, error: 'No se pudieron sincronizar los datos generales.' };

    const syncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { success: true, data: { ...merged, updated_at: merged.updated_at || nowIso() }, syncedAt };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error durante la sincronización' };
  }
}
