# CONTEXTO_LOCAL.md — POS Frontend

## Estado actual
- Rama actual: `main` (sincronizada con `origin/main`).
- Árbol de trabajo: limpio (sin cambios sin commit).
- Último commit en `main`: `c4e39f3` (merge: resolve conflict in api.ts keeping parseJsonResponse fix).
- `dev` y `origin/dev` apuntan a `a41ee46` (fix: safe JSON parsing 204).

## Bugs pendientes
- Auditoría de endpoints `/api/v1` vs `/api` en otros módulos (products, sales, auth, categories, payments, cash) pendiente de validación contra backend.
- `NotificationController` backend no tiene guard `@PreAuthorize` (usa email del SecurityContext); revisar si requiere rol.
- Posible inconsistencia de puertos: frontend default `8080`, backend `8081` (se sobreescribe por env, no bloqueante).
- `public/sw.js` se regenera en build; evitar commits accidentales de ese artefacto.

## Últimos 3 commits
1. `c4e39f3` — merge: resolve conflict in api.ts keeping parseJsonResponse fix
2. `a41ee46` — fix: add safe JSON parsing for 204 No Content responses
3. `5e7f5e1` — Merge pull request #27 from guadalupe182/fix/frontend-api-paths

## Cambios sin mergear
- Rama local sin mergear a `main`: `sipovad`.
- Ramas remotas disponibles: `origin/fix/frontend-api-paths`, `origin/fix/tech-debt-frontend` (ya integradas en `dev`/`main` vía merge).
- Rama local `feature/verify-backend-endpoints` (sin cambios propios, alineada a `main`).

## Reglas operativas (memoria)
- No hay reglas "en caliente" fuera de archivos físicos (`AGENTS.md` global y del proyecto). El contexto operativo se deriva de `AGENTS.md`, `next.config.ts`, `lib/api.ts` y los commits recientes.
EOF
echo done