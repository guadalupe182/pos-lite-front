# CONTEXTO_LOCAL.md — POS Frontend

## Estado actual
- Rama actual: `feature/audit-endpoints` (desde `dev`).
- Árbol de trabajo: limpio.
- `main` HEAD: `6c07357` (Merge PR #28 docs).
- `dev`/`origin/dev`: `a41ee46`.

## Auditoría de endpoints (frontend vs backend pos-lite)
Fuente backend: OpenAPI sandbox `https://pos-sandbox-api.gdevsoftware.com/v3/api-docs` (2026-11-27).

### Resultado
- Todos los endpoints consumidos por el frontend existen en el backend pos-lite con path y método compatibles.
- No se detectaron discrepancias de path (`/api` vs `/api/v1`) en los módulos auditados: auth, boutique-items, cash, categories, memberships, notifications, payments, products, sales.
- Los módulos que sí usan `/api/v1` en backend son `branches` y `restock`; el frontend no los consume actualmente.

### Endpoints frontend no presentes en pos-lite (servicio externo)
- `/api/v1/licenses/activate`
- `/api/v1/licenses/validate`
(Probablemente servicio de licencias/CRM; fuera del alcance de pos-lite.)

### Endpoints backend no consumidos por el frontend (candidatos a revisar)
- `/api/auth/logout`
- `/api/categories/{id}` (GET/DELETE)
- `/api/loyalty/redeem`
- `/api/packs`, `/api/packs/sell`, `/api/packs/{id}`
- `/api/products/adjust-batch`, `/api/products/low-stock`, `/api/products/{id}/decrement`
- `/api/v1/branches*`, `/api/v1/restock*`

### Bugs pendientes
- Decidir si el frontend debe consumir endpoints no usados (logout, packs, loyalty, restock, branches).
- `NotificationController` backend sin guard `@PreAuthorize` (usa email del SecurityContext); revisar si requiere rol.
- Inconsistencia de puertos: frontend default `8080`, backend `8081` (se sobreescribe por env, no bloqueante).
- `public/sw.js` se regenera en build; evitar commits accidentales.

## Últimos 3 commits (main)
1. `6c07357` — Merge pull request #28 from guadalupe182/docs/consolidate-context
2. `eee59f0` — docs: consolidate local rules and context
3. `073c24f` — Revert "docs: consolidate local rules and context"

## Reglas operativas (memoria)
- No hay reglas "en caliente" fuera de archivos físicos. El contexto operativo se deriva de `AGENTS.md`, `next.config.ts`, `lib/api.ts` y los commits recientes.
EOF
echo done