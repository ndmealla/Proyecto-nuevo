
import React, { useState, useEffect } from 'react';
import { AttendanceRecord, OfficeLocation } from '../types';
import { 
  Trash2, MapPin, MonitorSmartphone, Building2, Save, 
  QrCode, CheckCircle2, Download, Share, PlusSquare, MoreVertical, X,
  ExternalLink, Info, Laptop, Globe, Code2
} from 'lucide-react';

interface SettingsProps {
  office: OfficeLocation;
  records: AttendanceRecord[];
  onUpdateOffice: (loc: OfficeLocation) => void;
  onImportRecords: (records: AttendanceRecord[]) => void;
  onClearData: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  installPrompt: any;
  setInstallPrompt: (val: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  office, 
  onUpdateOffice, 
  onClearData,
  showToast,
  installPrompt
}) => {
  const [companyName, setCompanyName] = useState(localStorage.getItem('company_name') || 'CheckIn Pro');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');
  }, []);

  const saveCompany = () => {
    localStorage.setItem('company_name', companyName);
    showToast("Nombre de empresa actualizado");
    setTimeout(() => window.location.reload(), 600);
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Terminal</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Configuración de Estación</p>
        </div>
        {isStandalone && (
          <div className="bg-green-600 text-white px-4 py-2 rounded-2xl flex items-center space-x-2 text-[10px] font-black shadow-xl shadow-green-100">
            <CheckCircle2 size={14} />
            <span>MODO APP ACTIVO</span>
          </div>
        )}
      </header>

      {/* GUÍA DE DESPLIEGUE TÉCNICO */}
      <section className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-white/20 rounded-xl">
              <Laptop size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Exportar a otra PC</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/10 p-5 rounded-3xl border border-white/20">
              <p className="text-sm leading-relaxed mb-4 text-indigo-50">
                Para instalar <strong>"{companyName}"</strong> de forma oficial en otra computadora, debes descargar los archivos y subirlos a tu propio dominio (ej. GitHub Pages).
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl">
                  <h4 className="font-bold text-xs uppercase mb-2 flex items-center"><Code2 size={14} className="mr-2" /> Paso 1</h4>
                  <p className="text-[11px] opacity-70">Haz clic en <strong>"Code"</strong> (arriba) y guarda el archivo <code className="bg-indigo-900/40 px-1 rounded">App.tsx</code> y <code className="bg-indigo-900/40 px-1 rounded">sw.js</code>.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl">
                  <h4 className="font-bold text-xs uppercase mb-2 flex items-center"><Globe size={14} className="mr-2" /> Paso 2</h4>
                  <p className="text-[11px] opacity-70">Usa un hosting como <strong>Vercel</strong> o <strong>Netlify</strong> para que el navegador reconozca el nombre real.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.open('https://pages.github.com/', '_blank', 'noopener,noreferrer')}
              className="w-full bg-white text-indigo-600 py-4 rounded-3xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2"
            >
              <span>GUÍA DE HOSTING GRATUITO</span>
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
        {/* Decoración */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </section>

      {/* INSTALACIÓN RÁPIDA */}
      {!isStandalone && (
        <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
            <MonitorSmartphone size={20} className="mr-3 text-indigo-600" />
            Prueba PWA en este equipo
          </h3>
          
          {!showGuide ? (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black text-sm flex items-center justify-center space-x-3 transition-all hover:bg-black shadow-lg"
            >
              <Download size={20} />
              <span>{installPrompt ? 'LANZAR INSTALACIÓN' : 'MOSTRAR GUÍA RÁPIDA'}</span>
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase text-slate-400">Instrucciones para Chrome</span>
                  <button onClick={() => setShowGuide(false)} className="p-1 hover:bg-slate-200 rounded-lg"><X size={16}/></button>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center space-x-3"><div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</div> <span>Tres puntos (superior derecha)</span></li>
                  <li className="flex items-center space-x-3"><div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</div> <span>"Enviar, guardar y compartir"</span></li>
                  <li className="flex items-center space-x-3"><div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</div> <span>"Instalar como aplicación"</span></li>
                </ul>
              </div>
            </div>
          )}
        </section>
      )}

      {/* IDENTIDAD */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <Building2 size={20} className="mr-3 text-indigo-600" />
          Identidad Corporativa
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de la Empresa</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
              <button 
                onClick={saveCompany}
                className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center"
              >
                <Save size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ACCIONES RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-indigo-50 p-4 rounded-3xl w-fit mb-6 text-indigo-600">
            <QrCode size={28} />
          </div>
          <h4 className="text-lg font-black text-slate-900 mb-2">Imprimir QR</h4>
          <p className="text-sm text-slate-400 mb-6">Genera el código único para pegar en la entrada de la oficina.</p>
          <button 
            onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=CHECKIN_PRO_STATION_${companyName}`, '_blank', 'noopener,noreferrer')}
            className="w-full bg-slate-100 text-indigo-600 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors"
          >
            Generar Código QR
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-green-50 p-4 rounded-3xl w-fit mb-6 text-green-600">
            <MapPin size={28} />
          </div>
          <h4 className="text-lg font-black text-slate-900 mb-2">Ubicación GPS</h4>
          <p className="text-sm text-slate-400 mb-6">Establece las coordenadas actuales como el centro de fichaje.</p>
          <button 
            onClick={async () => {
              try {
                const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                onUpdateOffice({ ...office, lat: pos.coords.latitude, lng: pos.coords.longitude });
                showToast("Coordenadas actualizadas");
              } catch (e) {
                showToast("Error al obtener GPS", "error");
              }
            }}
            className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
          >
            Fijar Punto Central
          </button>
        </div>
      </div>

      {/* ELIMINACIÓN */}
      <section className="bg-red-50 rounded-[40px] p-8 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5 text-center md:text-left">
          <div className="p-4 bg-white rounded-3xl text-red-500 shadow-sm">
            <Trash2 size={24} />
          </div>
          <div>
            <h4 className="font-black text-red-900">Limpiar registros</h4>
            <p className="text-[11px] font-bold text-red-700/60 uppercase tracking-tighter">Acción irreversible para este dispositivo</p>
          </div>
        </div>
        <button 
          onClick={() => confirm("¿Seguro que deseas borrar el historial?") && onClearData()}
          className="bg-red-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
        >
          BORRAR TODO
        </button>
      </section>
    </div>
  );
};

export default Settings;
