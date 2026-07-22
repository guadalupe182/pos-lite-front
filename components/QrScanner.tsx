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
  const [simulatedCode, setSimulatedCode] = useState('');

  useEffect(() => {
    let isMounted = true;
    const currentContainerId = containerId.current;

    const checkCameraPermissions = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setCameraError('Tu navegador no soporta el acceso a la cámara.');
          return false;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        if (!hasCamera) {
          setCameraError('No se detectó cámara activa en este dispositivo.');
          return false;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionDenied(false);
        setCameraError(null);
        return true;
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionDenied(true);
            setCameraError('Permiso de cámara denegado.');
          } else if (err.name === 'NotFoundError') {
            setCameraError('No se encontró cámara disponible.');
          } else {
            setCameraError('Error de acceso a la cámara: ' + err.message);
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
      if (!container) return;

      container.innerHTML = '';

      scannerRef.current = new Html5QrcodeScanner(
          currentContainerId,
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
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
    };

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

  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (simulatedCode.trim()) {
      onScan(simulatedCode.trim());
    }
  };

  // UI si no hay permiso o no hay cámara detectada
  if (permissionDenied || cameraError) {
    return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
          <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
            ⚠️ {cameraError || 'Permiso de cámara denegado.'}
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              💡 ¿Estás en PC/Demo? Simula un escaneo ingresando el código manualmente:
            </p>
            <form onSubmit={handleSimulateScan} className="flex gap-2 justify-center">
              <input
                  type="text"
                  placeholder="Ej. 123456"
                  value={simulatedCode}
                  onChange={(e) => setSimulatedCode(e.target.value)}
                  className="p-2 text-xs border rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-[200px]"
              />
              <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Simular Lectura
              </button>
            </form>
          </div>

          {permissionDenied && (
              <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-blue-600 hover:underline pt-2 block mx-auto cursor-pointer"
              >
                Reintentar permisos de cámara
              </button>
          )}
        </div>
    );
  }

  return (
      <div className="w-full flex flex-col items-center">
        <div id={containerId.current} className="w-full max-w-sm rounded-lg overflow-hidden border border-gray-200 shadow-inner" />
      </div>
  );
}