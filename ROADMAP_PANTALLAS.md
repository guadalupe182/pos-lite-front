# Roadmap de pantallas pendientes — POS Frontend

Mapeo de endpoints backend no consumidos por el frontend a pantallas/funcionalidades futuras.

## Autenticación
- `POST /api/auth/logout` → Botón "Cerrar sesión" con limpieza de token y redirección.

## Categorías
- `GET/DELETE /api/categories/{id}` → Gestión de categorías (editar/eliminar) en `app/products` o nueva `app/categories`.

## Lealtad
- `POST /api/loyalty/redeem` → Pantalla de canje de puntos en `app/loyalty`.

## Packs
- `GET/POST /api/packs`, `POST /api/packs/sell`, `GET /api/packs/{id}` → Módulo de packs (crear, vender, detalle) en `app/packs`.

## Inventario avanzado
- `POST /api/products/adjust-batch` → Ajuste masivo de stock.
- `GET /api/products/low-stock` → Vista de productos con stock bajo.
- `PATCH /api/products/{id}/decrement` → Decremento rápido de stock desde POS.

## Sucursales
- `/api/v1/branches*` → Administración de sucursales y activación/desactivación.

## Restock
- `/api/v1/restock*` → Reportes de restock (listado, detalle, creación).

## Notas
- Priorizar según valor de negocio. Cada pantalla nueva debe seguir patrones de `app/dashboard/*` (paginación, búsqueda, modal CRUD, Toast).
