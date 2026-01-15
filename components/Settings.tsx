
import React, { useState } from 'react';
import { AttendanceRecord, OfficeLocation, Employee } from '../types';
import { 
  Trash2, MapPin, MonitorSmartphone, Building2, Save, 
  QrCode, User, Link, Laptop, Globe, CheckCircle2, X, Smartphone,
  CloudLightning, ExternalLink, HelpCircle
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
  const [showHostingGuide, setShowHostingGuide] = useState(false);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Panel de Control</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sin servidores • 100% Local</p>
        </div>
        <button 
          onClick={() => setShowHostingGuide(!showHostingGuide)}
          className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest border border-indigo-100"
        >
          <CloudLightning size={16} />
          <span>Ayuda Despliegue</span>
        </button>
      </header>

      {/* GUIA DE DESPLIEGUE (HIDDEN BY DEFAULT) */}
      {showHostingGuide && (
        <section className="bg-indigo-600 rounded-[40px] p-8 text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <Globe size={24} />
            <h3 className="text-xl font-bold">Cómo usar sin Node.js</h3>
          </div>
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>Esta aplicación es <strong>estática</strong>, lo que significa que no necesita Node.js para funcionar una vez publicada.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 p-5 rounded-3xl border border-white/20">
                <span className="font-black text-white block mb-2">1. GitHub Pages (Recomendado)</span>
                Ve a tu repo en GitHub > <strong>Settings</strong> > <strong>Pages</strong>. En "Branch", selecciona <strong>main</strong> y dale a <strong>Save</strong>. ¡Listo!
              </div>
              <div className="bg-white/10 p-5 rounded-3xl border border-white/20">
                <span className="font-black text-white block mb-2">2. Uso Offline</span>
                Una vez abras el link, ve a los ajustes de tu móvil e instálala como "Web App". Funcionará sin internet.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MI PERFIL */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <User size={20} className="mr-3 text-indigo-600" />
          Perfil del Administrador
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tu Nombre</label>
            <input 
              type="text" value={uName} onChange={e => setUName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Puesto</label>
            <input 
              type="text" value={uRole} onChange={e => setURole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/20"
            />
          </div>
        </div>
        <button 
          onClick={() => onUpdateUser({ ...employee, name: uName, role: uRole })}
          className="w-full mt-6 bg-slate-900 text-white py-4 rounded-3xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-transform"
        >
          <Save size={18} /> <span>Guardar Cambios</span>
        </button>
      </section>

      {/* MARCA DE LA EMPRESA */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <Building2 size={20} className="mr-3 text-indigo-600" />
          Tu Empresa
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre Comercial</label>
            <input 
              type="text" value={cName} onChange={e => setCName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Imagen del Logo (URL)</label>
            <input 
              type="text" value={cLogo} onChange={e => setCLogo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
        <button 
          onClick={() => onUpdateBrand(cName, cLogo)}
          className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-3xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg"
        >
          <Save size={18} /> <span>Aplicar Identidad</span>
        </button>
      </section>

      {/* ESTACIÓN DE TRABAJO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="bg-indigo-50 p-4 rounded-3xl w-fit mb-6 text-indigo-600"><QrCode size={28} /></div>
          <h4 className="text-lg font-black text-slate-900 mb-2 text-center md:text-left">QR de Acceso</h4>
          <p className="text-sm text-slate-400 mb-6 text-center md:text-left">Imprime este código y colócalo en la entrada.</p>
          <button 
            onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=CHECKIN_PRO_STATION_${cName}`, '_blank')}
            className="w-full bg-slate-100 text-indigo-600 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50"
          >
            Abrir QR para Imprimir
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="bg-green-50 p-4 rounded-3xl w-fit mb-6 text-green-600"><MapPin size={28} /></div>
          <h4 className="text-lg font-black text-slate-900 mb-2 text-center md:text-left">Zona de Oficina</h4>
          <p className="text-sm text-slate-400 mb-6 text-center md:text-left">Usa tu ubicación actual para el centro de control.</p>
          <button 
            onClick={async () => {
              try {
                const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                onUpdateOffice({ ...office, lat: pos.coords.latitude, lng: pos.coords.longitude });
              } catch (e) { showToast("Error GPS", "error"); }
            }}
            className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black"
          >
            Fijar Coordenadas
          </button>
        </div>
      </div>

      {/* APP MOVIL */}
      <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <Smartphone size={24} className="text-indigo-400" />
            <h3 className="text-xl font-bold">Instalar en el móvil</h3>
          </div>
          
          {showGuide ? (
            <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black uppercase text-indigo-300">Pasos</span>
                 <button onClick={() => setShowGuide(false)} className="p-1 hover:bg-white/10 rounded-lg"><X size={16}/></button>
               </div>
               <div className="space-y-4 text-sm text-slate-300">
                 <p>1. Pulsa el botón de <strong>Compartir</strong> (Safari) o <strong>Opciones</strong> (Chrome).</p>
                 <p>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong>.</p>
               </div>
            </div>
          ) : (
            <button 
              onClick={() => installPrompt ? installPrompt.prompt() : setShowGuide(true)}
              className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm flex items-center justify-center space-x-3 shadow-xl"
            >
              <Smartphone size={20} />
              <span>{installPrompt ? 'INSTALAR APP' : 'CÓMO INSTALAR'}</span>
            </button>
          )}
        </div>
      </section>

      {/* PELIGRO */}
      <section className="bg-red-50 rounded-[40px] p-8 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="p-4 bg-white rounded-3xl text-red-500 shadow-sm"><Trash2 size={24} /></div>
          <div>
            <h4 className="font-black text-red-900">Reset de Datos</h4>
            <p className="text-[10px] font-bold text-red-700/60 uppercase">Cuidado: No se puede deshacer</p>
          </div>
        </div>
        <button 
          onClick={() => confirm("¿Deseas borrar todos los registros y volver a cero?") && onClearData()}
          className="bg-red-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest"
        >
          Limpiar Todo
        </button>
      </section>
    </div>
  );
};

export default Settings;
