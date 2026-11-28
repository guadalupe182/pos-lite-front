# Inventario de estados de carga — POS Frontend

Documento de auditoría: botones, formularios y acciones asíncronas que deberían mostrar estado de carga mientras procesan.

## Convención actual
- `loading`/`saving`/`processing` con `disabled` + texto "Guardando..."/"Cargando..." en la mayoría de modales CRUD.
- Listados muestran texto "Cargando..." en tabla.
- Algunas acciones no bloquean la UI ni muestran feedback.

## Acciones con carga implementada (referencia)
| Ubicación | Acción | Estado |
|---|---|---|
| `app/dashboard/fit/page.tsx` | Crear/editar membresía (submit) | `saving` + disabled |
| `app/dashboard/fit/page.tsx` | Eliminar membresía | `deletingId` + disabled |
| `app/dashboard/style/page.tsx` | Crear/editar artículo (submit) | `saving` + disabled |
| `app/dashboard/style/page.tsx` | Eliminar artículo | `deletingId` + disabled |
| `app/products/page.tsx` | Crear/editar producto (handleSave) | pendiente verificar |
| `components/CheckoutButton.tsx` | Pago MP / efectivo | `loading` + disabled |
| `components/CloseCashModal.tsx` | Cerrar caja | `loading` + disabled |
| `components/OpenCashModal.tsx` | Abrir caja | `loading` + disabled |
| `components/DashboardContent.tsx` | Carga inicial dashboard | `loading` |

## Acciones sin estado de carga (pendiente)
| Ubicación | Acción | Observación |
|---|---|---|
| `app/sales-report/page.tsx` | Generar reporte (submit) | Botón submit no muestra "Generando..." |
| `app/sales-report/page.tsx` | Exportar Excel/PDF | Botones sin disabled durante exportación |
| `app/inventory/page.tsx` | Ajustar stock (handleAdjustStock) | Verificar disabled del botón |
| `app/inventory/page.tsx` | Exportar Excel/PDF | Sin feedback de carga |
| `app/notifications/page.tsx` | Marcar como leída / eliminar | `processingId` existe pero botón no muestra spinner |
| `app/sales/page.tsx` | Agregar al carrito por código | Sin indicador mientras busca producto |
| `app/sales/page.tsx` | Crear categoría rápida | Sin estado de carga |
| `app/register/page.tsx` | Registro (submit) | Verificar disabled + texto |
| `app/login/LoginForm.tsx` | Login (submit) | Verificar disabled + texto |
| `app/activate/page.tsx` | Activar licencia (submit) | Verificar disabled + texto |
| `components/Navbar.tsx` | Abrir/cerrar caja (modales) | Botones sin spinner |
| `components/QrScanner.tsx` | Inicialización de cámara | Sin indicador de permisos |

## Listados sin skeleton/spinner
- `app/dashboard/fit/page.tsx`: tabla muestra texto "Cargando membresías..." (OK).
- `app/dashboard/style/page.tsx`: "Cargando artículos..." (OK).
- `app/products/page.tsx`: verificar texto de carga.
- `app/notifications/page.tsx`: "Cargando notificaciones..." (OK).

## Recomendación
- Estandarizar un componente `LoadingButton` o usar `disabled` + texto "Procesando..." en todos los botones asíncronos.
- Añadir `aria-busy` y spinner mínimo en acciones >500ms.
EOF
git add INVENTARIO_CARGA.md && git commit -m "docs: add loading states inventory" && git push -u origin docs/loading-inventory 2>&1 | tail -4