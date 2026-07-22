````markdown
# 🛒 POS Lite - Frontend PWA

Sistema **Punto de Venta (POS)** desarrollado con **Next.js 16**, diseñado para pequeñas y medianas empresas que requieren una solución moderna para la administración de inventarios, ventas, clientes, reportes y facturación desde cualquier dispositivo.

La aplicación funciona como una **Progressive Web App (PWA)**, permitiendo una experiencia similar a una aplicación nativa, con instalación en dispositivos móviles y de escritorio, carga rápida y soporte para funcionamiento offline en componentes compatibles.

Desarrollado por **GDEV Software Solutions**.

---

# ✨ Características

- 📱 Aplicación Web Progresiva (PWA)
- ⚡ Alto rendimiento utilizando Next.js App Router
- 📦 Administración completa de inventario
- 🏷️ Gestión de productos y categorías
- 📋 Control de existencias
- 🔔 Alertas automáticas por stock mínimo
- 🛒 Registro de ventas
- 💳 Integración con Mercado Pago
- 📷 Escaneo de códigos QR y códigos de barras
- 📊 Dashboard con métricas en tiempo real
- 📈 Reportes estadísticos
- 📄 Exportación de información a PDF
- 📑 Exportación de reportes a Excel
- 🔐 Autenticación mediante Bearer Token
- 🔄 Manejo automático de expiración de sesión
- 🌙 Diseño responsive adaptable a escritorio, tablet y móvil

---

# 🚀 Tecnologías

## Frontend

- Next.js 16
- React 19
- TypeScript
- App Router

## UI

- Tailwind CSS v4
- Lucide React
- React Icons

## Progressive Web App

- @ducanh2912/next-pwa
- Service Worker
- Manifest Web App

## Reportes

- ExcelJS
- jsPDF
- jspdf-autotable
- html2canvas

## Analítica

- Chart.js
- react-chartjs-2

## Pagos

- Mercado Pago SDK React

## Escáner

- html5-qrcode
- @yudiel/react-qr-scanner

## Comunicación con API

- Fetch API
- Bearer Authentication
- API Wrapper personalizado (`apiFetch`)

---

# 🏗️ Arquitectura

```
src/
│
├── app/
│   ├── dashboard/
│   ├── ventas/
│   ├── inventario/
│   ├── productos/
│   ├── categorias/
│   ├── clientes/
│   ├── reportes/
│   ├── login/
│   └── api/
│
├── components/
│
├── hooks/
│
├── services/
│
├── utils/
│
├── lib/
│
└── styles/
```

La aplicación utiliza el **App Router** de Next.js para dividir cada módulo funcional del sistema, permitiendo una arquitectura escalable y fácil de mantener.

---

# ⚙️ Funcionalidades

## 📦 Inventario

- Alta de productos
- Baja de productos
- Edición
- Consulta
- Control de existencias
- Stock mínimo configurable
- Alertas automáticas
- Ajuste manual de inventario
- Búsqueda por nombre
- Búsqueda por código de barras

---

## 🛒 Ventas

- Registro de ventas
- Cálculo automático de totales
- Descuentos
- Impuestos
- Historial
- Consulta por fecha
- Consulta por cliente

---

## 👥 Clientes

- Registro
- Consulta
- Historial de compras
- Administración de datos

---

## 📊 Dashboard

Visualización de métricas importantes como:

- Ventas del día
- Ventas mensuales
- Productos más vendidos
- Inventario disponible
- Productos con stock bajo
- Ingresos
- Ticket promedio

---

## 📈 Reportes

El sistema permite generar reportes en distintos formatos.

### Excel

Utilizando:

- ExcelJS

Exporta:

- Inventario
- Ventas
- Productos
- Clientes

### PDF

Utilizando:

- jsPDF
- AutoTable
- html2canvas

Permite generar:

- Reportes de ventas
- Inventario
- Gráficas
- Resúmenes

---

## 📷 Escáner QR y Código de Barras

Integración mediante:

- html5-qrcode
- react-qr-scanner

Permite:

- Buscar productos
- Agregar artículos al carrito
- Actualizar inventario

---

## 💳 Mercado Pago

Integración mediante:

```
@mercadopago/sdk-react
```

Características:

- Checkout
- Pago con QR
- Pago con tarjeta
- Pago con Wallet
- Confirmación de transacción

---

# 🔐 Seguridad

La aplicación implementa:

- Bearer Token
- Protección de rutas
- Manejo automático de expiración de sesión
- Redirección automática al Login
- API Wrapper centralizado
- Manejo de errores HTTP
- Validación de respuestas

---

# 📱 Progressive Web App

La aplicación puede instalarse como una aplicación nativa.

Incluye:

- Manifest
- Iconos
- Splash Screen
- Service Worker
- Cache inteligente
- Estrategias de red
- Soporte Offline para recursos estáticos

Las llamadas críticas hacia la API utilizan estrategias de red tipo:

```
NetworkOnly
```

para garantizar siempre información actualizada.

---

# 🛠️ Instalación

## Clonar repositorio

```bash
git clone https://github.com/tu-usuario/pos-lite-front.git

cd pos-lite-front
```

---

## Instalar dependencias

```bash
npm install
```

---

## Variables de entorno

Crear un archivo:

```
.env.local
```

Contenido:

```env
NEXT_PUBLIC_API_URL=https://pos-lite-kj7u.onrender.com
```

---

## Ejecutar proyecto

Modo desarrollo

```bash
npm run dev
```

Producción

```bash
npm run build

npm run start
```

Abrir:

```
http://localhost:3000
```

---

# 📜 Scripts

## Desarrollo

```bash
npm run dev
```

Inicia el servidor de desarrollo.

---

## Producción

```bash
npm run build
```

Compila la aplicación optimizada.

---

```bash
npm run start
```

Ejecuta la aplicación compilada.

---

## Linter

```bash
npm run lint
```

Ejecuta ESLint v9 para detectar errores y mantener un código consistente.

---

# 🌐 Compatibilidad

- Google Chrome
- Microsoft Edge
- Firefox
- Brave
- Opera
- Android
- Windows
- Linux
- macOS

---

# 📊 Rendimiento

El proyecto está optimizado para ofrecer:

- ⚡ Renderizado rápido con React Server Components.
- 📦 División automática del código (*Code Splitting*).
- 🚀 Carga diferida (*Lazy Loading*) de componentes.
- 🧠 Optimización automática de imágenes y recursos.
- 📱 Excelente experiencia en dispositivos móviles.
- 💾 Caché inteligente mediante Service Worker.

---

# 🚧 Próximas Funcionalidades

- [ ] Facturación CFDI
- [ ] Modo Offline completo
- [ ] Sincronización automática al recuperar conexión
- [ ] Múltiples sucursales
- [ ] Gestión de empleados
- [ ] Roles y permisos
- [ ] Notificaciones Push
- [ ] Integración con impresoras térmicas
- [ ] Corte de caja
- [ ] Módulo de compras a proveedores
- [ ] Control de promociones
- [ ] Fidelización de clientes

---

# 🤝 Contribución

Este proyecto es de uso privado.

Las contribuciones se realizan mediante:

1. Crear una rama feature.
2. Desarrollar la funcionalidad.
3. Ejecutar pruebas locales.
4. Crear Pull Request.
5. Revisar código.
6. Fusionar con la rama principal.

---

# 📄 Licencia

**© GDEV Software Solutions**

Todos los derechos reservados.

Este proyecto es de carácter privado y no está autorizado para su redistribución, modificación o comercialización sin autorización expresa del propietario.

---

# 👨‍💻 Desarrollado por

**GDEV Software Solutions**

Soluciones de software modernas enfocadas en automatización, sistemas empresariales, aplicaciones web, microservicios y plataformas de alto rendimiento.

---

> **POS Lite** busca ofrecer una solución ligera, rápida y escalable para negocios que requieren un sistema moderno de punto de venta con capacidades de análisis, administración de inventario y procesamiento de ventas desde cualquier dispositivo.
````

