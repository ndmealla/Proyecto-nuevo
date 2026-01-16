
import React, { useState } from 'react';
import { OfficeLocation, Employee } from '../types';
import { 
  Trash2, Building2, Smartphone,
  UserPlus, Github, Plus, Cloud, Save, Info
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
  onClearData: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  installPrompt: any;
}

const Settings: React.FC<SettingsProps> = ({ 
  office, employee, employees, companyName, companyLogo,
  onUpdateOffice, onUpdateUser, onUpdateBrand, onAddEmployee, onClearData,
  showToast
}) => {
  const [cName, setCName] = useState(companyName);
  const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || '');
  
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');

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
              <div key={emp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center space-x-3">
                  <img src={emp.photo} className="w-10 h-10 rounded-xl" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.role}</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">ID: {emp.id.split('-')[1]}</div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-50 p-6 rounded-[30px] border-2 border-dashed border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Añadir Nuevo al Directorio</p>
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
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
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
          Sincroniza los registros en la nube. Formato de repositorio: <code className="bg-slate-100 px-1 rounded text-slate-900 font-bold">usuario/repositorio</code>
        </p>
        <div className="space-y-3">
          <input 
            type="password"
            placeholder="GitHub Personal Token (ghp_...)" 
            value={ghToken} onChange={e => setGhToken(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400"
          />
          <div className="relative">
            <input 
              placeholder="tu-usuario/nombre-repo" 
              value={ghRepo} onChange={e => setGhRepo(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={handleSaveGitHub}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2"
          >
            <Cloud size={16} /> <span>Activar Sincronización</span>
          </button>
        </div>
      </section>

      {/* VÍNCULO DISPOSITIVO */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <Smartphone size={20} className="mr-3 text-indigo-600" />
          Este Celular
        </h3>
        <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          {employee.photo ? (
             <img src={employee.photo} className="w-14 h-14 rounded-2xl border-2 border-white" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-200 flex items-center justify-center font-black text-indigo-700">{employee.name.charAt(0)}</div>
          )}
          <div>
            <p className="font-black text-slate-900">{employee.name}</p>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{employee.role}</p>
          </div>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('checkin_pro_user'); window.location.reload(); }}
          className="w-full mt-4 text-[10px] font-black text-slate-400 uppercase hover:text-red-500 transition-colors"
        >
          Desvincular para cambiar de empleado
        </button>
      </section>

      {/* MARCA EMPRESA */}
      <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
          <Building2 size={20} className="mr-3 text-indigo-600" />
          Personalización
        </h3>
        <div className="space-y-4">
          <input 
            value={cName} 
            onChange={e => setCName(e.target.value)} 
            placeholder="Nombre Empresa" 
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 placeholder:text-slate-400" 
          />
          <button onClick={() => onUpdateBrand(cName, companyLogo)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase">Guardar Marca</button>
        </div>
      </section>

      <button onClick={onClearData} className="w-full bg-red-50 text-red-600 py-6 rounded-[35px] font-black text-xs uppercase tracking-widest border border-red-100">
        <Trash2 size={18} className="inline mr-2" /> Resetear Aplicación
      </button>
    </div>
  );
};

export default Settings;
