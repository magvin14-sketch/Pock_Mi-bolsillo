# Pock - Organizador Financiero

Pock es una aplicación PWA para controlar gastos, ingresos, presupuestos, deudas, metas de ahorro y ciclos mensuales.

## Arquitectura

- React + TypeScript + Vite
- Supabase Auth + PostgreSQL
- PWA con soporte offline
- Persistencia local en `localStorage`
- Sincronización bidireccional con resolución por `updated_at`
- Tombstones para eliminaciones offline

## Desarrollo

```bash
npm install
npm run dev
```

Para producción:

```bash
npm run build
npm run preview
```

## Supabase

La app necesita las tablas definidas en `src/services/supabaseSchema.ts`.

Si ya tienes una instalación anterior de Pock, vuelve a ejecutar el SQL del esquema. Incluye migraciones seguras con `ADD COLUMN IF NOT EXISTS` para `deleted_movements` y triggers de `updated_at`.

### Seguridad

Las tablas utilizan Row Level Security (RLS) y cada consulta está filtrada por el usuario autenticado. Nunca pongas una `service_role` key en variables `VITE_*` ni en el frontend.

## Sincronización offline

Los cambios se guardan primero localmente. Cuando no hay conexión, Pock conserva el estado local y las eliminaciones se registran en `deleted_movements`. Al recuperar conexión, la sincronización:

1. Descarga el estado remoto.
2. Fusiona movimientos por ID y `updated_at`.
3. Aplica las eliminaciones pendientes.
4. Sube movimientos, presupuestos y datos generales.
5. Actualiza la hora de última sincronización.

## Importación y exportación

La importación JSON valida y conserva categorías ocultas, eliminaciones pendientes y metadatos de sincronización.

## Notas

El proyecto conserva algunas dependencias y scripts históricos de versiones anteriores para mantener compatibilidad con el entorno original. Se pueden eliminar en una limpieza posterior cuando confirmemos que ninguna integración los necesita.
