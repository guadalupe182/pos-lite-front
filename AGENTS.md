# AGENTS.md — POS Frontend (Next.js)

## 🚨 REGLAS DE ORO DE GIT
- **NUNCA** trabajes sobre `main`, `dev` o `sipovad` directamente.
- **SIEMPRE** crea una rama `feature/` o `fix/`.
- **NO** hagas Merge ni PRs. Eso lo hace el humano.
- Si un ticket no requiere cambios reales, avísalo en lugar de crear ramas vacías.

## 🎨 UI/UX
- Usa Tailwind CSS.
- Respeta la paleta de colores corporativa.

## 🧪 Validación
- Corre `npm run build` y `npm run lint` antes de decir que terminaste.

## 🧱 Stack y comandos
- Framework: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4.
- PWA: `@ducanh2912/next-pwa` (service worker en `public/sw.js`, regenerado en build).
- Comandos:
  - `npm run dev` (webpack)
  - `npm run build` (webpack)
  - `npm run lint` (eslint)
  - `npm run start`
- Backend objetivo: `pos-lite` (Spring Boot), API base por env `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).

## 🔌 Notas críticas de API
- El backend expone la mayoría de endpoints bajo `/api/...` (sin `v1`); solo `branches` y `restock` usan `/api/v1/...`.
- El rewrite de `next.config.ts` es pass-through de `/api/:path*` → `${apiOrigin}/api/:path*` (no reescribe prefijo).
- `lib/api.ts` centraliza `apiFetch` + wrappers. Usar `parseJsonResponse` para evitar errores con `204 No Content`.
- `markNotificationAsRead` / `deleteNotification` no deben parsear body (backend responde vacío).
- IDs de backend son `Long` (int64); en frontend se envían como `number` en la URL.

## 📌 Estado de ramas
- `main`: integración (no trabajar directo).
- `dev`: rama de desarrollo/sandbox.
- Crear siempre `feature/` o `fix/` desde `dev`.
