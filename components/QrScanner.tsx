'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  facingMode?: 'environment' | 'user';
}

let uniqueIdCounter = 0;

export default function QrScanner({ onScan, onError, facingMode = 'environment' }: QrScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = useRef(`qr-reader-${uniqueIdCounter++}`);

  useEffect(() => {
    // Pequeña pausa para asegurar que el contenedor existe en el DOM
    const timer = setTimeout(() => {
      const container = document.getElementById(containerId.current);
      if (!container) {
        console.error('Contenedor no encontrado');
        return;
      }

      // Limpiar cualquier residuo previo
      container.innerHTML = '';

      scannerRef.current = new Html5QrcodeScanner(
        containerId.current,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          videoConstraints: { facingMode },
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
          }
        },
        (errorMessage) => {
          if (
            onError &&
            !errorMessage.includes('No MultiFormat Readers') &&
            !errorMessage.includes('NotFound') &&
            !errorMessage.includes('Camera access')
          ) {
            onError(errorMessage);
          }
        }
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScan, onError, facingMode]);

  return (
    <div
      id={containerId.current}
      style={{
        width: '100%',
        minHeight: '300px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
      }}
    />
  );
}