import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  User,
  Session,
} from '../services/supabase';
import {
  synchronizeFullData,
  pushMovementToRemote,
  deleteMovementFromRemote,
  pushBudgetsToRemote,
  pushUserDataToRemote,
} from '../services/syncService';
import { AppData, Movement } from '../types';

export interface UseAuthSyncReturn {
  user: User | null;
  session: Session | null;
  isConfigured: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  signUp: (email: string, pass: string) => Promise<{ error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  notifyMovementAdded: (movement: Movement) => void;
  notifyMovementDeleted: (movementId: string) => void;
  notifyBudgetsChanged: (budgets: Record<string, number>) => void;
  notifyUserDataChanged: (data: AppData) => void;
}

export function useAuthSync(
  appData: AppData,
  onDataUpdatedFromCloud: (newData: AppData) => void
): UseAuthSyncReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(isSupabaseConfigured);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('pock_last_sync_time') : null;
  });
  const [syncError, setSyncError] = useState<string | null>(null);

  // Keep latest appData in a ref for callbacks
  const appDataRef = useRef<AppData>(appData);
  appDataRef.current = appData;

  const onDataUpdatedRef = useRef(onDataUpdatedFromCloud);
  onDataUpdatedRef.current = onDataUpdatedFromCloud;

  // Initialize session and listen to auth changes
  useEffect(() => {
    const supabase = getSupabaseClient();
    setIsConfigured(isSupabaseConfigured());

    if (!supabase) return;

    // Get current session (persisted automatically in storage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsConfigured(isSupabaseConfigured());
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initial cloud fetch when user is detected or switches devices
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function initialFetch() {
      if (!user) return;
      setIsSyncing(true);
      setSyncError(null);

      const result = await synchronizeFullData(user.id, appDataRef.current);
      if (!isMounted) return;

      setIsSyncing(false);
      if (result.success && result.data) {
        onDataUpdatedRef.current(result.data);
        if (result.syncedAt) {
          setLastSyncTime(result.syncedAt);
          localStorage.setItem('pock_last_sync_time', result.syncedAt);
        }
      } else if (result.error) {
        setSyncError(result.error);
      }
    }

    initialFetch();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Sign Up
  const signUp = useCallback(
    async (email: string, pass: string): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { error: 'Supabase no está configurado. Revisa tus credenciales.' };
      }

      setSyncError(null);
      setIsSyncing(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
        });

        setIsSyncing(false);
        if (error) {
          return { error: error.message };
        }

        if (data.user && !data.session) {
          return {
            error: '¡Cuenta creada! Revisa tu correo electrónico para confirmar tu cuenta.',
          };
        }

        return {};
      } catch (err: any) {
        setIsSyncing(false);
        return { error: err.message || 'Error al crear cuenta' };
      }
    },
    []
  );

  // Sign In
  const signIn = useCallback(
    async (email: string, pass: string): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { error: 'Supabase no está configurado. Revisa tus credenciales.' };
      }

      setSyncError(null);
      setIsSyncing(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        setIsSyncing(false);
        if (error) {
          return { error: error.message };
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }

        return {};
      } catch (err: any) {
        setIsSyncing(false);
        return { error: err.message || 'Error al iniciar sesión' };
      }
    },
    []
  );

  // Sign Out
  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setSyncError(null);
  }, []);

  // Manual Trigger Sync
  const syncNow = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncError(null);

    const result = await synchronizeFullData(user.id, appDataRef.current);
    setIsSyncing(false);

    if (result.success && result.data) {
      onDataUpdatedRef.current(result.data);
      if (result.syncedAt) {
        setLastSyncTime(result.syncedAt);
        localStorage.setItem('pock_last_sync_time', result.syncedAt);
      }
    } else if (result.error) {
      setSyncError(result.error);
    }
  }, [user]);

  // Offline-First Push Notifications:
  // When a movement is added in the app while user is logged in
  const notifyMovementAdded = useCallback(
    (movement: Movement) => {
      if (!user) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      pushMovementToRemote(user.id, movement).then((ok) => {
        if (ok) {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(now);
          localStorage.setItem('pock_last_sync_time', now);
        } else {
          setSyncError(
            'No se pudo guardar este movimiento en la nube. Revisa tu conexión o la configuración de Supabase.'
          );
        }
      });
    },
    [user]
  );

  // When a movement is deleted
  const notifyMovementDeleted = useCallback(
    (movementId: string) => {
      if (!user || !movementId) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      deleteMovementFromRemote(user.id, movementId).catch((err) =>
        console.warn('Error syncing deleted movement:', err)
      );
    },
    [user]
  );

  // When budgets are updated
  const notifyBudgetsChanged = useCallback(
    (budgets: Record<string, number>) => {
      if (!user) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      pushBudgetsToRemote(user.id, budgets).then((ok) => {
        if (!ok) {
          setSyncError(
            'No se pudieron guardar los presupuestos en la nube. Revisa la configuración de Supabase.'
          );
        }
      });
    },
    [user]
  );

  // When user preferences, balances or debts change
  const notifyUserDataChanged = useCallback(
    (data: AppData) => {
      if (!user) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      pushUserDataToRemote(user.id, data).then((ok) => {
        if (!ok) {
          setSyncError(
            'No se pudieron guardar tus datos (saldo, deudas, metas) en la nube. Revisa la configuración de Supabase.'
          );
        }
      });
    },
    [user]
  );

  // Auto-sync when reconnecting back online
  useEffect(() => {
    if (!user) return;

    const handleBackOnline = () => {
      syncNow();
    };

    window.addEventListener('online', handleBackOnline);
    return () => {
      window.removeEventListener('online', handleBackOnline);
    };
  }, [user, syncNow]);

  return {
    user,
    session,
    isConfigured,
    isSyncing,
    lastSyncTime,
    syncError,
    signUp,
    signIn,
    signOut,
    syncNow,
    notifyMovementAdded,
    notifyMovementDeleted,
    notifyBudgetsChanged,
    notifyUserDataChanged,
  };
}
