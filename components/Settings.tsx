
import React, { useState } from 'react';
import { OfficeLocation, Employee } from '../types';
import { 
  Trash2, Building2, Smartphone, LogOut,
  UserPlus, Github, Plus, Cloud, Info, X, AlertCircle
} from 'lucide-react';

interface SettingsProps {
  office: OfficeLocation;
  employee: Employee;
  employees: Employee[];
  companyName: string;
  companyLogo: string;
  onUpdateOffice: (loc: OfficeLocation) => void;
  onUpdateUser: (user: Employee) => void;
  onUpdateBrand: (name: string, logo: string) => void;
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onLogout: () => void;
  onClearData: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  installPrompt: any;
}

const Settings: React.FC<SettingsProps> = ({ 
  office, employee, employees, companyName, companyLogo,
  onUpdateOffice, onUpdateUser, onUpdateBrand, onAddEmployee, onDeleteEmployee, onLogout, onClearData,
  showToast
}) => {
  const [cName, setCName] = useState(companyName);
  const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || '');
  
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  
  // Estado para confirmación de eliminación local (evita window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleCreateEmployee = () => {
    if(!newEmpName || !newEmpRole) return showToast("Completa los campos", "error");
    const newEmp: Employee = {
      id: `EMP-${Date.now()}`,
      name: newEmpName,
      role: newEmpRole,
      photo: `https://i.pravatar.cc/150?u=${Date.now()}`
    };
    onAddEmployee(newEmp);
    setNewEmpName('');
    setNewEmpRole('');
    showToast("Empleado añadido con éxito");
  };

  const handleSaveGitHub = () => {
    if (!ghRepo.includes('/')) {
      showToast("Formato inválido. Usa: usuario/repositorio", "error");
      return;
    }
    localStorage.setItem('gh_token', ghToken);
    localStorage.setItem('gh_repo', ghRepo);
    showToast("Configuración de GitHub guardada");
  };

  const startDelete = (id: string) => {
    setConfirmDeleteId(id);
    // Auto-cancelar después de 3 segundos si no confirma
    setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000);
  };

  return (
    <div className="space-y-8 pb-32 max-w-2xl mx-auto">
      <h2 className="text-3xl font-black text-slate-900 tracking-tighter">AJUSTES</h2>

      {/* DIRECTORIO DE EMPLEADOS */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <UserPlus size={20} className="mr-3 text-indigo-600" />
          Directorio de Empleados
        </h3>
        
        <div className="space-y-4 mb-8">
          {employees.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-4">No hay empleados registrados.</p>
          ) : (
            employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
                <div className="flex items-center space-x-3">
                  <img src={emp.photo} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {confirmDeleteId === emp.id ? (
                    <button 
                      onClick={() => { onDeleteEmployee(emp.id); setConfirmDeleteId(null); }}
                      className="bg-red-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase animate-pulse"
                    >
                      Confirmar
                    </button>
                  ) : (
                    <button 
                      onClick={() => startDelete(emp.id)}
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                      title="Eliminar empleado"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-50 p-6 rounded-[30px] border-2 border-dashed border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Añadir al Directorio</p>
          <div className="space-y-3">
            <input 
              placeholder="Nombre Completo" 
              value={newEmpName} onChange={e => setNewEmpName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/20 placeholder:text-slate-400"
            />
            <input 
              placeholder="Cargo / Puesto" 
              value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500/20 placeholder:text-slate-400"
            />
            <button 
              onClick={handleCreateEmployee}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
            >
              <Plus size={16} /> <span>Registrar en Empresa</span>
            </button>
          </div>
        </div>
      </section>

      {/* GITHUB SYNC */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center">
            <Github size={20} className="mr-3 text-slate-900" />
            Respaldo en GitHub
          </h3>
          <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-full">
            <Info size={14} />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
          Sincroniza los registros en la nube. Formato: <code className="bg-slate-100 px-1 rounded text-slate-900 font-bold">usuario/repositorio</code>
        </p>
        <div className="space-y-3">
          <input 
            type="password"
            placeholder="GitHub Personal Token" 
            value={ghToken} onChange={e => setGhToken(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400"
          />
          <input 
            placeholder="tu-usuario/nombre-repo" 
            value={ghRepo} onChange={e => setGhRepo(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSaveGitHub}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2 active:scale-95 transition-transform"
          >
            <Cloud size={16} /> <span>Activar Sincronización</span>
          </button>
        </div>
      </section>

      {/* VÍNCULO DISPOSITIVO */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <Smartphone size={20} className="mr-3 text-indigo-600" />
          Perfil en este Móvil
        </h3>
        <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          {employee.photo ? (
             <img src={employee.photo} className="w-14 h-14 rounded-2xl border-2 border-white object-cover shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-200 flex items-center justify-center font-black text-indigo-700">{employee.name.charAt(0)}</div>
          )}
          <div>
            <p className="font-black text-slate-900">{employee.name}</p>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{employee.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full mt-6 bg-slate-50 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2 hover:bg-red-50 hover:text-red-600 transition-all border border-slate-100"
        >
          <LogOut size={16} /> <span>Cambiar de perfil</span>
        </button>
      </section>

      {/* MARCA EMPRESA */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <Building2 size={20} className="mr-3 text-indigo-600" />
          Empresa
        </h3>
        <div className="space-y-4">
          <input 
            value={cName} 
            onChange={e => setCName(e.target.value)} 
            placeholder="Nombre Empresa" 
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900" 
          />
          <button onClick={() => onUpdateBrand(cName, companyLogo)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase active:scale-95 transition-transform">Guardar</button>
        </div>
      </section>

      <div className="pt-8">
        {confirmReset ? (
          <div className="bg-red-500 p-6 rounded-[35px] text-white flex flex-col items-center animate-in zoom-in-95 duration-200">
            <AlertCircle size={32} className="mb-2" />
            <p className="font-bold text-sm mb-4">¿Borrar TODO permanentemente?</p>
            <div className="flex space-x-3 w-full">
              <button 
                onClick={() => setConfirmReset(false)} 
                className="flex-1 bg-white/20 py-4 rounded-2xl font-bold text-xs uppercase"
              >
                Cancelar
              </button>
              <button 
                onClick={onClearData} 
                className="flex-1 bg-white text-red-600 py-4 rounded-2xl font-black text-xs uppercase shadow-xl"
              >
                Sí, Borrar
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setConfirmReset(true)} 
            className="w-full bg-red-50 text-red-600 py-6 rounded-[35px] font-black text-xs uppercase tracking-widest border border-red-100 flex items-center justify-center space-x-3 active:scale-95 transition-transform"
          >
            <Trash2 size={18} /> <span>Resetear Aplicación</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
