
import React, { useState } from 'react';
import { AttendanceRecord, OfficeLocation, Employee } from '../types';
import { 
  Trash2, MapPin, MonitorSmartphone, Building2, Save, 
  QrCode, User, Link as LinkIcon, Laptop, Globe, CheckCircle2, X, Smartphone,
  CloudLightning, ExternalLink, HelpCircle, Copy, Share2
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

  const currentUrl = window.location.href;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    showToast("¡Enlace copiado al portapapeles!");
  };

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

      {/* ENLACE PÚBLICO (EL QUE DEBES EJECUTAR) */}
      <section className="bg-white rounded-[40px] p-8 border-2 border-indigo-100 shadow-xl shadow-indigo-50/50">
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center">
          <LinkIcon size={20} className="mr-3 text-indigo-600" />
          Enlace Público para Empleados
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Este es el link que debes enviar a tus empleados. Ellos deberán abrirlo en sus móviles para escanear el QR.
        </p>
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-3xl border border-slate-100">
          <div className="flex-1 px-4 overflow-hidden">
            <code className="text-[11px] font-mono text-indigo-600 truncate block">{currentUrl}</code>
          </div>
          <button 
            onClick={copyToClipboard}
            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <Copy size={18} />
          </button>
        </div>
      </section>

      {/* GUIA DE DESPLIEGUE */}
      {showHostingGuide && (
        <section className="bg-indigo-600 rounded-[40px] p-8 text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <Globe size={24} />
            <h3 className="text-xl font-bold">Cómo activar tu Web</h3>
          </div>
          <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
            <p>Si aún no ves tu página online, sigue estos pasos en tu cuenta de GitHub:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 p-5 rounded-3xl border border-white/20">
                <span className="font-black text-white block mb-2">Paso 1</span>
                Entra en tu repositorio > <strong>Settings</strong> (arriba a la derecha).
              </div>
              <div className="bg-white/10 p-5 rounded-3xl border border-white/20">
                <span className="font-black text-white block mb-2">Paso 2</span>
                Busca <strong>Pages</strong> en el menú lateral. En "Source", elige <strong>Deploy from branch</strong> y selecciona <strong>main</strong>.
              </div>
            </div>
            <p className="mt-4 text-xs bg-black/20 p-4 rounded-2xl italic">
              Una vez hecho esto, GitHub te dará un link que termina en ".github.io/..."
            </p>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Puesto</label>
            <input 
              type="text" value={uRole} onChange={e => setURole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 font-bold text-slate-900 outline-none"
            />
          </div>
        </div>
        <button 
          onClick={() => onUpdateUser({ ...employee, name: uName, role: uRole })}
          className="w-full mt-6 bg-slate-900 text-white py-4 rounded-3xl font-black text-sm flex items-center justify-center space-x-2"
        >
          <Save size={18} /> <span>Guardar Mi Perfil</span>
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
            />
          </div>
        </div>
        <button 
          onClick={() => onUpdateBrand(cName, cLogo)}
          className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-3xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg"
        >
          <Save size={18} /> <span>Aplicar Marca</span>
        </button>
      </section>

      {/* ESTACIÓN DE TRABAJO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="bg-indigo-50 p-4 rounded-3xl w-fit mb-6 text-indigo-600"><QrCode size={28} /></div>
          <h4 className="text-lg font-black text-slate-900 mb-2">QR de Acceso</h4>
          <p className="text-sm text-slate-400 mb-6">Imprime este código y colócalo en la entrada.</p>
          <button 
            onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=CHECKIN_PRO_STATION_${cName}`, '_blank')}
            className="w-full bg-slate-100 text-indigo-600 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors"
          >
            Abrir QR para Imprimir
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="bg-green-50 p-4 rounded-3xl w-fit mb-6 text-green-600"><MapPin size={28} /></div>
          <h4 className="text-lg font-black text-slate-900 mb-2">Zona de Oficina</h4>
          <p className="text-sm text-slate-400 mb-6">Usa tu ubicación actual para el centro de control.</p>
          <button 
            onClick={async () => {
              try {
                const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                onUpdateOffice({ ...office, lat: pos.coords.latitude, lng: pos.coords.longitude });
              } catch (e) { showToast("Error GPS", "error"); }
            }}
            className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest"
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
          onClick={() => confirm("¿Deseas borrar todos los datos?") && onClearData()}
          className="bg-red-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest"
        >
          Limpiar Todo
        </button>
      </section>
    </div>
  );
};

export default Settings;
