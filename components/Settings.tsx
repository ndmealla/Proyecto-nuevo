
import React, { useState } from 'react';
import { AttendanceRecord, OfficeLocation, Employee } from '../types';
import { 
  Trash2, MapPin, MonitorSmartphone, Building2, Save, 
  QrCode, User, Link, Laptop, Globe, CheckCircle2, X, Smartphone
} from 'lucide-react';

interface SettingsProps {
  office: OfficeLocation;
  employee: Employee;
  companyName: string;
  companyLogo: string;
  onUpdateOffice: (loc: OfficeLocation) => void;
  onUpdateUser: (user: Employee) => void;
  onUpdateBrand: (name: string, logo: string) => void;
  onClearData: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  installPrompt: any;
}

const Settings: React.FC<SettingsProps> = ({ 
  office, employee, companyName, companyLogo,
  onUpdateOffice, onUpdateUser, onUpdateBrand, onClearData,
  showToast, installPrompt
}) => {
  const [uName, setUName] = useState(employee.name);
  const [uRole, setURole] = useState(employee.role);
  const [cName, setCName] = useState(companyName);
  const [cLogo, setCLogo] = useState(companyLogo);
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Configuración</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Personalización del Terminal</p>
      </header>

      {/* MI PERFIL */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <User size={20} className="mr-3 text-indigo-600" />
          Mi Perfil de Empleado
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre Completo</label>
            <input 
              type="text" value={uName} onChange={e => setUName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Cargo / Rol</label>
            <input 
              type="text" value={uRole} onChange={e => setURole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
            />
          </div>
        </div>
        <button 
          onClick={() => onUpdateUser({ ...employee, name: uName, role: uRole })}
          className="w-full mt-6 bg-slate-900 text-white py-4 rounded-3xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg"
        >
          <Save size={18} /> <span>Guardar Mi Perfil</span>
        </button>
      </section>

      {/* MARCA DE LA EMPRESA */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <Building2 size={20} className="mr-3 text-indigo-600" />
          Personalización de Empresa
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de la Organización</label>
            <input 
              type="text" value={cName} onChange={e => setCName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">URL del Logo (Icono)</label>
            <input 
              type="text" value={cLogo} onChange={e => setCLogo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>
        </div>
        <button 
          onClick={() => onUpdateBrand(cName, cLogo)}
          className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-3xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg"
        >
          <Save size={18} /> <span>Actualizar Marca</span>
        </button>
      </section>

      {/* UBICACIÓN Y QR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="bg-indigo-50 p-4 rounded-3xl w-fit mb-6 text-indigo-600"><QrCode size={28} /></div>
          <h4 className="text-lg font-black text-slate-900 mb-2">QR de Puerta</h4>
          <p className="text-sm text-slate-400 mb-6">Genera el código único para este centro de trabajo.</p>
          <button 
            onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=CHECKIN_PRO_STATION_${cName}`, '_blank')}
            className="w-full bg-slate-100 text-indigo-600 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors"
          >
            Obtener Código QR
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="bg-green-50 p-4 rounded-3xl w-fit mb-6 text-green-600"><MapPin size={28} /></div>
          <h4 className="text-lg font-black text-slate-900 mb-2">Punto GPS</h4>
          <p className="text-sm text-slate-400 mb-6">Fija la ubicación actual como la oficial de la oficina.</p>
          <button 
            onClick={async () => {
              try {
                const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                onUpdateOffice({ ...office, lat: pos.coords.latitude, lng: pos.coords.longitude });
              } catch (e) { showToast("Error GPS", "error"); }
            }}
            className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
          >
            Fijar Aquí
          </button>
        </div>
      </div>

      {/* DESPLIEGUE PWA */}
      <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <MonitorSmartphone size={24} className="text-indigo-400" />
            <h3 className="text-xl font-bold">Instalar en Pantalla Inicio</h3>
          </div>
          
          {showGuide ? (
            <div className="bg-white/10 p-6 rounded-3xl border border-white/20 animate-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black uppercase text-indigo-300">Guía de Instalación</span>
                 <button onClick={() => setShowGuide(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16}/></button>
               </div>
               <div className="space-y-4 text-sm text-slate-300">
                 <div className="flex items-start space-x-4">
                   <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">1</div>
                   <p>Abre el menú de tu navegador (3 puntos en Android o icono "Compartir" en iOS).</p>
                 </div>
                 <div className="flex items-start space-x-4">
                   <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">2</div>
                   <p>Busca la opción <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar App"</strong>.</p>
                 </div>
               </div>
            </div>
          ) : (
            <button 
              onClick={() => installPrompt ? installPrompt.prompt() : setShowGuide(true)}
              className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm flex items-center justify-center space-x-3 shadow-xl hover:bg-indigo-700"
            >
              {/* Fix: Added missing Smartphone icon import */}
              <Smartphone size={20} />
              <span>{installPrompt ? 'INSTALAR AHORA' : 'VER CÓMO INSTALAR'}</span>
            </button>
          )}
        </div>
      </section>

      {/* ELIMINACIÓN */}
      <section className="bg-red-50 rounded-[40px] p-8 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="p-4 bg-white rounded-3xl text-red-500 shadow-sm"><Trash2 size={24} /></div>
          <div>
            <h4 className="font-black text-red-900">Historial</h4>
            <p className="text-[10px] font-bold text-red-700/60 uppercase">Borrar datos locales</p>
          </div>
        </div>
        <button 
          onClick={() => confirm("¿Borrar todo?") && onClearData()}
          className="bg-red-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200"
        >
          Borrar Datos
        </button>
      </section>
    </div>
  );
};

export default Settings;
