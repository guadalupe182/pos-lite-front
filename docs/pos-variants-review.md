# Revisión de variantes POS (Fit / Style)

Rama: `feature/review-pos-variants` (base `dev`)

## Rutas revisadas

- `/dashboard/fit` → `app/dashboard/fit/page.tsx` (gestión de membresías).
- `/dashboard/style` → `app/dashboard/style/page.tsx` (inventario de boutique).

Ambas rutas compilan y se generan como páginas estáticas (`○`).

## Gating por flags

- `middleware.ts` mapea `/dashboard/fit → FIT` y `/dashboard/style → STYLE` en `flagProtectedRoutes`.
- El acceso se concede si el flag requerido está presente en la unión de:
  - `payload.features` del JWT (`access_token`), y
  - los flags de licencia persistidos en la cookie `gdev_license_flags` (JSON `{ "FIT": "<expiration>", ... }`), siempre que no hayan expirado.
- Si falta el flag, redirige a `/upgrade-plan?required=<FLAG>`.
- `FlagContext` expone `hasFlag(name)` fusionando ambas fuentes y filtrando expirados; escucha `storage` y `gdev:license-updated` para actualización en vivo.
- `components/HasFlag.tsx` renderiza sus children solo cuando `hasFlag(name)` es true; `components/Navbar.tsx` lo usa para mostrar/ocultar los enlaces "POS Fit" y "POS Style".

## Hallazgos / placeholders documentados

- `app/page.tsx` (dashboard home) contiene tarjetas demo con datos de ejemplo:
  - "Ingresos del mes (demo)" → `$12,450.00` ("Maqueta visual con datos de ejemplo").
  - "Membresías activas (demo)" → `38` ("Maqueta visual con datos de ejemplo").
- `app/cash/history/page.tsx` es un placeholder: "Próximamente: listado de sesiones de caja."
- Las páginas `/dashboard/fit` y `/dashboard/style` no tienen guard client-side propio; dependen del middleware. Si se accede directamente sin flag, el middleware redirige a `/upgrade-plan`.

## Conclusión

El flujo de flags (JWT + licencia persistida) está conectado correctamente para desbloquear FIT/STYLE. No se detectaron regresiones de compilación. Los placeholders anteriores se mantienen como están (no son parte de esta tarea).
