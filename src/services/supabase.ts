import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const CONFIG_STORAGE_KEY_URL = 'pock_supabase_url';
const CONFIG_STORAGE_KEY_ANON = 'pock_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    (import.meta.env.SUPABASE_URL as string) ||
    '';

  const envAnonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    (import.meta.env.SUPABASE_ANON_KEY as string) ||
    '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(CONFIG_STORAGE_KEY_URL) || '' : '';
  const localAnonKey = typeof window !== 'undefined' ? localStorage.getItem(CONFIG_STORAGE_KEY_ANON) || '' : '';

  return {
    url: (localUrl || envUrl || '').trim(),
    anonKey: (localAnonKey || envAnonKey || '').trim(),
  };
}

let clientInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  // Validate standard URL format
  if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    return null;
  }

  if (
    !clientInstance ||
    currentClientUrl !== config.url ||
    currentClientKey !== config.anonKey
  ) {
    try {
      clientInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      });
      currentClientUrl = config.url;
      currentClientKey = config.anonKey;
    } catch (err) {
      console.error('Error initializing Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
}

export function isSupabaseConfigured(): boolean {
  const config = getStoredSupabaseConfig();
  return Boolean(
    config.url &&
    config.anonKey &&
    (config.url.startsWith('https://') || config.url.startsWith('http://'))
  );
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_STORAGE_KEY_URL, url.trim());
    localStorage.setItem(CONFIG_STORAGE_KEY_ANON, anonKey.trim());
  }
  // Reset instance to force re-creation
  clientInstance = null;
  currentClientUrl = '';
  currentClientKey = '';
}

export function clearCustomSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONFIG_STORAGE_KEY_URL);
    localStorage.removeItem(CONFIG_STORAGE_KEY_ANON);
  }
  clientInstance = null;
  currentClientUrl = '';
  currentClientKey = '';
}

export type { User, Session };
