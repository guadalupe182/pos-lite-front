'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const currentContainerId = containerId.current;

    // Función para verificar permisos de cámara
    const checkCameraPermissions = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        if (!hasCamera) {
          setCameraError('No se detectó ninguna cámara en este dispositivo.');
          return false;
        }
        // Solicitar permiso explícito (esto mostrará el diálogo al usuario)
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Liberar la cámara inmediatamente
        setPermissionDenied(false);
        setCameraError(null);
        return true;
      } catch (err: unknown) {
        // Tipamos err como unknown
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionDenied(true);
            setCameraError('Permiso de cámara denegado. Por favor, permite el acceso en la configuración de tu navegador.');
          } else if (err.name === 'NotFoundError') {
            setCameraError('No se encontró ninguna cámara en este dispositivo.');
          } else {
            setCameraError('Error al acceder a la cámara: ' + err.message);
          }
        } else {
          setCameraError('Error desconocido al acceder a la cámara.');
        }
        return false;
      }
    };

    const initScanner = async () => {
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission || !isMounted) return;

      const container = document.getElementById(currentContainerId);
      if (!container) {
        console.error('Contenedor no encontrado');
        return;
      }

      // Limpiar cualquier residuo
      container.innerHTML = '';

      scannerRef.current = new Html5QrcodeScanner(
        currentContainerId,
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
          // Ignorar errores comunes de "no se encontró código"
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
    };

    // Iniciar el escáner después de un breve retraso para que el DOM esté listo
    const timer = setTimeout(() => {
      initScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScan, onError, facingMode]);

  // Mostrar mensajes de error o de permisos
  if (permissionDenied) {
    return (
      <div className="text-center p-4 bg-red-100 text-red-700 rounded">
        <p>Permiso de cámara denegado.</p>
        <p className="text-sm mt-2">Para usar el escáner, debes permitir el acceso a la cámara en la configuración de tu navegador.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 bg-blue-500 text-white px-3 py-1 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="text-center p-4 bg-red-100 text-red-700 rounded">
        <p>{cameraError}</p>
      </div>
    );
  }

  return <div id={containerId.current} style={{ width: '100%', minHeight: '300px' }} />;
}