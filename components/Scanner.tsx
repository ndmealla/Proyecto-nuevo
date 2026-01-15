
import React, { useEffect, useRef, useState } from 'react';
import { calculateDistance, getCurrentPosition } from '../utils/geoUtils';
import { OfficeLocation } from '../types';
import { Shield, MapPin, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  office: OfficeLocation;
  onScan: (data: string) => void;
  isProcessing: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ office, onScan, isProcessing }) => {
  const [error, setError] = useState<string | null>(null);
  const [locationVerified, setLocationVerified] = useState<boolean | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const scannerRef = useRef<any>(null);

  const verifyLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      const dist = calculateDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        office.lat,
        office.lng
      );
      setDistance(dist);
      const isOk = dist <= office.radius;
      setLocationVerified(isOk);
      if (!isOk) {
        setError(`Fuera de rango. Estás a ${Math.round(dist)}m de la oficina.`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError("No se pudo obtener la ubicación. Por favor, activa el GPS.");
      setLocationVerified(false);
    }
  };

  useEffect(() => {
    verifyLocation();
    
    // Configuración del scanner
    // Usando el ID único para asegurar que el DOM esté listo
    const scannerId = "reader";
    const scanner = new Html5QrcodeScanner(
      scannerId,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      // Verificamos de nuevo la ubicación al escanear por seguridad extra
      if (locationVerified) {
        onScan(decodedText);
      } else {
        setError("Escaneo bloqueado: No te encuentras en la ubicación permitida.");
      }
    };

    const onScanFailure = (error: any) => {
        // Ignoramos errores de escaneo continuos (son ruidosos)
    };

    // Pequeño delay para asegurar que el elemento DOM 'reader' existe
    const timer = setTimeout(() => {
      try {
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
      } catch (e) {
        console.error("Scanner render error:", e);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => console.error("Failed to clear scanner", error));
      }
    };
  }, [locationVerified]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto p-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden w-full border border-slate-100">
        <div className="p-4 bg-indigo-600 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Camera size={20} />
            <h2 className="font-semibold">Escanear QR de Asistencia</h2>
          </div>
          {locationVerified && (
            <div className="flex items-center space-x-1 text-xs bg-green-500 px-2 py-1 rounded-full">
              <CheckCircle size={12} />
              <span>Ubicación OK</span>
            </div>
          )}
        </div>

        <div className="p-6">
          <div id="reader" className="w-full overflow-hidden rounded-xl bg-slate-100 min-h-[250px]"></div>
          
          <div className="mt-6 space-y-4">
            <div className={`p-4 rounded-xl flex items-start space-x-3 ${locationVerified ? 'bg-green-50' : 'bg-red-50'}`}>
              <MapPin size={24} className={locationVerified ? 'text-green-600' : 'text-red-600'} />
              <div>
                <p className={`font-medium ${locationVerified ? 'text-green-800' : 'text-red-800'}`}>
                  {locationVerified ? '¡Estás en la oficina!' : 'Ubicación no autorizada'}
                </p>
                <p className="text-sm opacity-80">
                  {office.address}
                  {distance !== null && <span className="block mt-1 font-bold">Distancia: {Math.round(distance)}m</span>}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            <button 
              onClick={verifyLocation}
              className="w-full py-2 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
            >
              Recalcular ubicación
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-3 w-full">
        <div className="p-2 bg-slate-100 rounded-full">
          <Shield size={20} className="text-slate-600" />
        </div>
        <p className="text-xs text-slate-500">
          Tu seguridad es nuestra prioridad. Solo registramos tu ubicación al momento de escanear el código.
        </p>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-semibold text-indigo-900">Registrando asistencia...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
