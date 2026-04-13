import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'POS-lite Sistema de Ventas',
    short_name: 'POS-lite',
    description: 'Sistema de punto de venta en la nube',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'portrait',
    theme_color: '#0f172a',
    background_color: '#0f172a',
    icons: [
      {
        src: '/icon/icon-192.png',    // <-- agregado /icon/
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon/icon-512.png',    // <-- agregado /icon/
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon/maskable-icon.png', // <-- agregado /icon/
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}