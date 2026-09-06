import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const CONFIG_STORAGE_KEY_URL = 'pock_supabase_url';
const CONFIG_STORAGE_KEY_ANON = 'pock_supabase_anon_key';

// Valores por defecto del proyecto de Supabase de Pock.
// La anon key está diseñada para ser pública (la seguridad real la da el
// Row Level Security activado en las tablas), así que es seguro incluirla
// aquí para que cualquier persona que abra la app se conecte automáticamente
// a la misma base de datos, sin tener que configurar nada.
const DEFAULT_SUPABASE_URL = 'https://cmedyjeuzpscevuwfitt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZWR5amV1enBzY2V2dXdmaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzM1NjYsImV4cCI6MjEwNDIwOTU2Nn0.9DwCRF9HatwOOq6OSC1G-Mwlt6_3gELMotMaR7F5VxI';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    (import.meta.env.SUPABASE_URL as string) ||
    (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
    '';

  const envAnonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    (import.meta.env.SUPABASE_ANON_KEY as string) ||
    (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
    '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(CONFIG_STORAGE_KEY_URL) || '' : '';
  const localAnonKey = typeof window !== 'undefined' ? localStorage.getItem(CONFIG_STORAGE_KEY_ANON) || '' : '';

  return {
    url: (localUrl || envUrl || DEFAULT_SUPABASE_URL || '').trim(),
    anonKey: (localAnonKey || envAnonKey || DEFAULT_SUPABASE_ANON_KEY || '').trim(),
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
