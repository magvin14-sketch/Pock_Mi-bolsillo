export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SCHEMA CENTRALIZADO PARA "MY POCKET" (POCK FINANZAS)
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase (dashboard.supabase.com)
-- ==============================================================================

-- 1. TABLA: movements (Gastos, Ingresos y Balances)
CREATE TABLE IF NOT EXISTS public.movements (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "desc" TEXT NOT NULL,
  categoria TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso', 'base')),
  monto NUMERIC NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas ultra rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON public.movements(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON public.movements(created_at DESC);

-- 2. TABLA: budgets (Presupuestos Mensuales por Categoría)
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_categoria UNIQUE (user_id, categoria)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- 3. TABLA: user_data (Preferencias, Deudas, Metas y Estado General)
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dinero_libre NUMERIC NOT NULL DEFAULT 0,
  limite_alerta NUMERIC NOT NULL DEFAULT 0,
  idioma_actual TEXT NOT NULL DEFAULT 'es',
  tema TEXT NOT NULL DEFAULT 'dark',
  deudas JSONB NOT NULL DEFAULT '[]'::jsonb,
  metas_ahorro JSONB NOT NULL DEFAULT '[]'::jsonb,
  gastos_fijos JSONB NOT NULL DEFAULT '[]'::jsonb,
  historial_cortes JSONB NOT NULL DEFAULT '[]'::jsonb,
  categorias_personalizadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  categorias_ocultas JSONB NOT NULL DEFAULT '[]'::jsonb,
  deleted_movements JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migraciones seguras para instalaciones existentes
ALTER TABLE public.user_data ADD COLUMN IF NOT EXISTS deleted_movements JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Trigger para mantener updated_at actualizado
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS movements_set_updated_at ON public.movements;
CREATE TRIGGER movements_set_updated_at BEFORE UPDATE ON public.movements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS budgets_set_updated_at ON public.budgets;
CREATE TRIGGER budgets_set_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS user_data_set_updated_at ON public.user_data;
CREATE TRIGGER user_data_set_updated_at BEFORE UPDATE ON public.user_data FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- Cada usuario SOLO puede leer, insertar, modificar y eliminar sus propios registros.
-- ==============================================================================

-- RLS en movements
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "movements_user_isolation" ON public.movements;
CREATE POLICY "movements_user_isolation"
  ON public.movements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS en budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_user_isolation" ON public.budgets;
CREATE POLICY "budgets_user_isolation"
  ON public.budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS en user_data
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_data_isolation" ON public.user_data;
CREATE POLICY "user_data_isolation"
  ON public.user_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- DISPARADOR AUTOMÁTICO: Crear perfil user_data al registrarse
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_data (user_id, dinero_libre, limite_alerta)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
