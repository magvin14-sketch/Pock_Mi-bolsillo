import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  AlertCircle,
  Database,
  Laptop,
  Smartphone,
  Shield,
  KeyRound,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '../services/supabase';
import { LanguageCode, AppData } from '../types';
import { formatColones } from '../utils';

interface AuthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  appData?: AppData;
  onSignIn: (email: string, pass: string) => Promise<{ error?: string }>;
  onSignUp: (email: string, pass: string) => Promise<{ error?: string }>;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  lang: LanguageCode;
}

export const AuthSyncModal: React.FC<AuthSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  isSyncing,
  lastSyncTime,
  syncError,
  appData,
  onSignIn,
  onSignUp,
  onSignOut,
  onSyncNow,
  lang,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const configured = isSupabaseConfigured();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage(
        lang === 'es'
          ? 'Por favor completa todos los campos'
          : 'Please complete all required fields'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        lang === 'es'
          ? 'La contraseña debe tener al menos 6 caracteres'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    if (authMode === 'register' && password !== confirmPassword) {
      setErrorMessage(
        lang === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const res = await onSignIn(email, password);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage(
            lang === 'es'
              ? '¡Sesión iniciada correctamente!'
              : 'Successfully signed in!'
          );
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const res = await onSignUp(email, password);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage(
            lang === 'es'
              ? '¡Cuenta creada! Tu sesión se ha iniciado y tus datos se sincronizarán automáticamente.'
              : 'Account created! Your session is active and data will sync automatically.'
          );
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-[#17191C] border border-[#30353B] rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl text-[#F4F6F8] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30353B]/60 bg-[#121316]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35D0BA]/15 text-[#35D0BA] flex items-center justify-center border border-[#35D0BA]/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F4F6F8]">
                {lang === 'es'
                  ? 'Sincronización Multidispositivo'
                  : 'Multi-Device Sync'}
              </h2>
              <p className="text-xs text-[#9AA3AD]">
                {lang === 'es'
                  ? 'Comparte datos entre laptop y celular'
                  : 'Share data across laptop & mobile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9AA3AD] hover:text-[#F4F6F8] hover:bg-[#202328] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {syncError && (
            <div className="p-3 bg-amber-950/40 border border-[#E5A93C]/40 text-amber-200 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />
              <span>{syncError}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-[#35D0BA]/30 text-[#E1FBF6] rounded-xl flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#35D0BA] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* User is authenticated */}
          {user ? (
            <div className="space-y-4">
              {/* Account Card */}
              <div className="p-4 rounded-xl bg-[#202328]/80 border border-[#30353B]/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#9AA3AD]">
                    {lang === 'es' ? 'Cuenta activa' : 'Active Account'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#35D0BA]/15 text-[#35D0BA] border border-[#35D0BA]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35D0BA] animate-pulse" />
                    {lang === 'es' ? 'Conectado' : 'Connected'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0E2E2B] to-[#1F544D] text-[#35D0BA] font-bold flex items-center justify-center text-sm border border-[#35D0BA]/40 shadow-xs">
                    {user.email ? user.email.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#F4F6F8] truncate text-sm">
                      {user.email}
                    </p>
                    <p className="text-xs text-[#9AA3AD] flex items-center gap-1.5 mt-0.5">
                      <Shield className="w-3 h-3 text-[#35D0BA]" />
                      <span>
                        {lang === 'es'
                          ? 'Token seguro persistente'
                          : 'Persistent secure token'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#30353B]/50 flex items-center justify-between text-xs text-[#9AA3AD]">
                  <span>
                    {lang === 'es' ? 'Última sincronización:' : 'Last sync:'}
                  </span>
                  <span className="font-mono text-[#F4F6F8]">
                    {lastSyncTime || (lang === 'es' ? 'Al abrir la app' : 'On app launch')}
                  </span>
                </div>
              </div>

              {/* Live Sync Status Summary */}
              {appData && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-[#202328] border border-[#30353B]/60">
                    <p className="text-[10px] text-[#9AA3AD] uppercase tracking-wider font-semibold">
                      {lang === 'es' ? 'Movimientos' : 'Movements'}
                    </p>
                    <p className="text-sm font-bold text-[#F4F6F8] font-mono mt-0.5">
                      {appData.historial?.length || 0}
                    </p>
                    <p className="text-[9px] text-[#35D0BA]">
                      {lang === 'es' ? 'en movements' : 'in movements'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#202328] border border-[#30353B]/60">
                    <p className="text-[10px] text-[#9AA3AD] uppercase tracking-wider font-semibold">
                      {lang === 'es' ? 'Presupuestos' : 'Budgets'}
                    </p>
                    <p className="text-sm font-bold text-[#F4F6F8] font-mono mt-0.5">
                      {Object.keys(appData.presupuestos_categoria || {}).length}
                    </p>
                    <p className="text-[9px] text-[#35D0BA]">
                      {lang === 'es' ? 'en budgets' : 'in budgets'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#202328] border border-[#30353B]/60">
                    <p className="text-[10px] text-[#9AA3AD] uppercase tracking-wider font-semibold">
                      {lang === 'es' ? 'Saldo Libre' : 'Free Cash'}
                    </p>
                    <p className="text-sm font-bold text-[#35D0BA] font-mono mt-0.5 truncate">
                      {formatColones(appData.dinero_libre)}
                    </p>
                    <p className="text-[9px] text-[#35D0BA]">
                      {lang === 'es' ? 'en user_data' : 'in user_data'}
                    </p>
                  </div>
                </div>
              )}

              {/* Devices Sync Explanation */}
              <div className="p-3.5 rounded-xl bg-[#121316] border border-[#30353B]/50 flex items-center gap-3">
                <div className="flex items-center gap-1 text-[#35D0BA] shrink-0">
                  <Laptop className="w-5 h-5" />
                  <span className="text-xs font-mono">⇄</span>
                  <Smartphone className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#9AA3AD] leading-relaxed">
                  {lang === 'es'
                    ? 'Inicia sesión con este mismo correo en tu teléfono o laptop para que todos los movimientos, deudas y presupuestos se sincronicen en vivo.'
                    : 'Log in with this same email on your phone or laptop to keep all transactions, debts and budgets live in sync.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSyncNow()}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 bg-[#35D0BA] text-[#07150D] font-semibold rounded-xl hover:bg-[#2EB39E] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isSyncing
                      ? lang === 'es'
                        ? 'Sincronizando con la nube...'
                        : 'Syncing with cloud...'
                      : lang === 'es'
                      ? 'Sincronizar ahora'
                      : 'Sync now'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onSignOut()}
                  className="w-full py-2.5 px-4 bg-[#202328] hover:bg-red-950/30 hover:border-red-500/40 text-[#9AA3AD] hover:text-red-400 border border-[#30353B] font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>
                    {lang === 'es'
                      ? 'Cerrar sesión en este dispositivo'
                      : 'Sign out of this device'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* User is NOT authenticated */
            <div className="space-y-4">
              {/* Not configured banner */}
              {!configured && (
                <div className="p-3.5 bg-[#202328] border border-[#E5A93C]/40 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#E5A93C] font-semibold">
                    <Database className="w-4 h-4 shrink-0" />
                    <span>
                      {lang === 'es'
                        ? 'Configuración de Supabase requerida'
                        : 'Supabase configuration required'}
                    </span>
                  </div>
                  <p className="text-[#9AA3AD] leading-relaxed">
                    {lang === 'es'
                      ? 'Para sincronizar entre laptop y celular, configura SUPABASE_URL y SUPABASE_ANON_KEY en las variables de entorno del proyecto.'
                      : 'To sync across laptop & mobile, set SUPABASE_URL and SUPABASE_ANON_KEY in the project environment variables.'}
                  </p>
                </div>
              )}

              {/* Mode switch tabs */}
              <div className="flex rounded-xl bg-[#202328] p-1 border border-[#30353B]/60">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#35D0BA] text-[#07150D] shadow-xs'
                      : 'text-[#9AA3AD] hover:text-[#F4F6F8]'
                  }`}
                >
                  {lang === 'es' ? 'Iniciar Sesión' : 'Log In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[#35D0BA] text-[#07150D] shadow-xs'
                      : 'text-[#9AA3AD] hover:text-[#F4F6F8]'
                  }`}
                >
                  {lang === 'es' ? 'Crear Cuenta' : 'Create Account'}
                </button>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#9AA3AD] mb-1.5">
                    {lang === 'es' ? 'Correo Electrónico' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AD]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@ejemplo.com"
                      className="w-full bg-[#121316] border border-[#30353B] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F4F6F8] placeholder-[#9AA3AD]/50 focus:border-[#35D0BA] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9AA3AD] mb-1.5">
                    {lang === 'es' ? 'Contraseña' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AD]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#121316] border border-[#30353B] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F4F6F8] placeholder-[#9AA3AD]/50 focus:border-[#35D0BA] focus:outline-hidden"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-[#9AA3AD] mb-1.5">
                      {lang === 'es'
                        ? 'Confirmar Contraseña'
                        : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AD]" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#121316] border border-[#30353B] rounded-xl pl-9 pr-3 py-2 text-sm text-[#F4F6F8] placeholder-[#9AA3AD]/50 focus:border-[#35D0BA] focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-[#35D0BA] text-[#07150D] font-semibold rounded-xl hover:bg-[#2EB39E] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 text-sm shadow-md"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : authMode === 'login' ? (
                    <KeyRound className="w-4 h-4" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? lang === 'es'
                        ? 'Conectando...'
                        : 'Connecting...'
                      : authMode === 'login'
                      ? lang === 'es'
                        ? 'Entrar y Sincronizar'
                        : 'Sign In & Sync'
                      : lang === 'es'
                      ? 'Registrarme y Sincronizar'
                      : 'Register & Sync'}
                  </span>
                </button>
              </form>

              {/* Devices note */}
              <div className="p-3 bg-[#121316]/60 rounded-xl border border-[#30353B]/40 text-xs text-[#9AA3AD] flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-[#35D0BA] shrink-0" />
                <span>
                  {lang === 'es'
                    ? 'Tu sesión permanece guardada en este equipo para que no tengas que ingresar credenciales cada vez.'
                    : 'Your session token is persisted locally so you stay signed in seamlessly.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
