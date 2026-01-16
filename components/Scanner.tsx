
import React, { useEffect, useRef, useState } from 'react';
import { calculateDistance, getCurrentPosition } from '../utils/geoUtils';
import { OfficeLocation } from '../types';
import { Shield, MapPin, CheckCircle, AlertTriangle, Camera, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
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
  const [isVerifying, setIsVerifying] = useState(false);
  const scannerRef = useRef<any>(null);

  const verifyLocation = async () => {
    setIsVerifying(true);
    setError(null);
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
        setError(`Fuera de rango. Estás a ${Math.round(dist)}m de la oficina autorizada.`);
      }
    } catch (err: any) {
      console.error("Geo error:", err);
      setLocationVerified(false);
      if (err.code === 1) {
        setError("Permiso de ubicación denegado. Por favor, habilítalo en los ajustes de tu navegador.");
      } else if (err.code === 3) {
        setError("Tiempo de espera agotado. Asegúrate de tener buena señal de GPS.");
      } else {
        setError("No se pudo obtener la ubicación. Verifica que el GPS esté encendido.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyLocation();
    
    const scannerId = "reader";
    const scanner = new Html5QrcodeScanner(
      scannerId,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );

    const onScanSuccess = (decodedText: string) => {
      // Usamos el estado más reciente de validación
      if (locationVerified === true) {
        onScan(decodedText);
      } else {
        setError("Acceso denegado: Debes estar en la oficina para registrar asistencia.");
        // Intentar verificar de nuevo automáticamente
        verifyLocation();
      }
    };

    const timer = setTimeout(() => {
      try {
        const element = document.getElementById(scannerId);
        if (element) {
          scanner.render(onScanSuccess, () => {});
          scannerRef.current = scanner;
        }
      } catch (e) {
        console.error("Scanner render error:", e);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err: any) => console.debug("Scanner clear skipped", err));
      }
    };
  }, [locationVerified]); // Re-vincular éxito de escaneo si cambia la verificación

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto p-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden w-full border border-slate-100">
        <div className={`p-5 flex items-center justify-between text-white transition-colors duration-500 ${locationVerified ? 'bg-indigo-600' : 'bg-slate-800'}`}>
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Camera size={20} />
            </div>
            <h2 className="font-bold text-sm uppercase tracking-wider">Escáner QR</h2>
          </div>
          {locationVerified && (
            <div className="flex items-center space-x-1 text-[10px] font-black uppercase bg-green-500 px-3 py-1.5 rounded-full animate-bounce">
              <CheckCircle size={12} />
              <span>Zona Segura</span>
            </div>
          )}
        </div>

        <div className="p-8">
          <div id="reader" className="w-full overflow-hidden rounded-[2rem] bg-slate-50 min-h-[250px] border-2 border-slate-100"></div>
          
          <div className="mt-8 space-y-4">
            <div className={`p-5 rounded-[2rem] flex items-start space-x-4 transition-all ${locationVerified ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
              <div className={`p-3 rounded-2xl ${locationVerified ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <MapPin size={24} />
              </div>
              <div className="flex-1">
                <p className={`font-black text-sm uppercase tracking-tight ${locationVerified ? 'text-green-800' : 'text-slate-800'}`}>
                  {locationVerified ? 'Ubicación Verificada' : 'Verificando Ubicación...'}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {office.address}
                  {distance !== null && <span className="block mt-1 font-bold text-indigo-600">Distancia actual: {Math.round(distance)}m</span>}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-start space-x-3 text-red-800 animate-in slide-in-from-top-2">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold leading-tight">{error}</p>
                </div>
              </div>
            )}
            
            <button 
              onClick={verifyLocation}
              disabled={isVerifying}
              className={`w-full py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-lg ${
                isVerifying ? 'bg-slate-100 text-slate-400' : 'bg-white text-indigo-600 border-2 border-indigo-50 shadow-indigo-100/50'
              }`}
            >
              <RefreshCw size={18} className={isVerifying ? 'animate-spin' : ''} />
              <span>{isVerifying ? 'Verificando...' : 'Recalcular ubicación'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-900/5 p-6 rounded-[2rem] border border-indigo-100/50 flex items-center space-x-4 w-full">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
          <Shield size={22} />
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
          Solo puedes registrar tu asistencia si te encuentras dentro del radio de <span className="font-bold text-indigo-600">{office.radius} metros</span> de la oficina.
        </p>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Registrando</p>
              <p className="text-xs text-slate-500 mt-1">Sincronizando con la nube...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
