
import React, { useState, useEffect } from 'react';
import { ViewType, AttendanceRecord, OfficeLocation, Employee } from './types';
import { DEFAULT_OFFICE, STORAGE_KEYS } from './constants';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { getCurrentPosition } from './utils/geoUtils';
import { syncRecordsToGitHub } from './services/githubService';
import { LayoutGrid, Camera, History, Settings as SettingsIcon, CheckCircle2, UserPlus, ArrowRight, Cloud } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>(DEFAULT_OFFICE);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companyName, setCompanyName] = useState('CheckIn Pro');
  const [companyLogo, setCompanyLogo] = useState('https://cdn-icons-png.flaticon.com/512/2913/2913444.png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error', icon?: React.ReactNode} | null>(null);

  useEffect(() => {
    const savedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedEmployees = localStorage.getItem('company_employees');
    const emps = savedEmployees ? JSON.parse(savedEmployees) : [];
    setEmployees(emps);

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      setActiveView('onboarding');
    }

    const savedCompany = localStorage.getItem('company_name');
    if (savedCompany) setCompanyName(savedCompany);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success', icon?: React.ReactNode) => {
    setToast({ message, type, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectEmployee = (emp: Employee) => {
    setCurrentUser(emp);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(emp));
    setActiveView('dashboard');
    showToast(`Bienvenido, ${emp.name}`);
  };

  const handleAddEmployee = (emp: Employee) => {
    const newList = [...employees, emp];
    setEmployees(newList);
    localStorage.setItem('company_employees', JSON.stringify(newList));
  };

  const handleQRScan = async (qrData: string) => {
    if (isProcessing || !currentUser) return;
    setIsProcessing(true);
    try {
      if (!qrData.includes("CHECKIN_PRO")) {
        showToast("QR no válido", "error");
        return;
      }
      const pos = await getCurrentPosition();
      const today = new Date().toISOString().split('T')[0];
      const lastRecord = [...records].reverse().find(r => r.employeeId === currentUser.id);
      const isCheckOut = lastRecord && lastRecord.type === 'ENTRADA';

      const newRecord: AttendanceRecord = {
        id: `REC-${Date.now()}`,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        date: today,
        timestamp: new Date().toISOString(),
        type: isCheckOut ? 'SALIDA' : 'ENTRADA',
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      };

      const updatedRecords = [...records, newRecord];
      setRecords(updatedRecords);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updatedRecords));
      showToast(`${newRecord.type} registrada`);

      // Intentar sincronizar con GitHub
      const syncOk = await syncRecordsToGitHub(updatedRecords);
      if (syncOk) {
        showToast("Sincronizado con la nube", "success", <Cloud size={16} />);
      }

      setActiveView('dashboard');
    } catch (e) {
      showToast("Error de validación", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (activeView === 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl mb-6">
          <UserPlus size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">CheckIn Pro</h1>
        <p className="text-slate-500 text-sm mb-10 max-w-xs">Registra tu nombre para vincular este dispositivo o configura la empresa si eres administrador.</p>
        
        <div className="w-full max-w-sm space-y-3">
          {employees.length > 0 ? (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selecciona tu Perfil</p>
              {employees.map(emp => (
                <button 
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className="w-full bg-white p-5 rounded-3xl border border-slate-200 flex items-center justify-between hover:border-indigo-500 transition-all text-left shadow-sm group"
                >
                  <div className="flex items-center space-x-4">
                    <img src={emp.photo} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.role}</p>
                    </div>
                  </div>
                  <ArrowRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={20} />
                </button>
              ))}
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] text-amber-800">
              <p className="text-sm font-bold mb-4">No hay empleados registrados todavía.</p>
              <p className="text-xs opacity-70 mb-4">Si eres el administrador, inicia sesión para configurar el directorio.</p>
            </div>
          )}
          
          <button 
            onClick={() => {
              setCurrentUser({id:'ADMIN', name:'Administrador', role:'Configuración', photo:''});
              setActiveView('settings');
            }}
            className="w-full py-4 text-xs font-black text-indigo-600 uppercase tracking-widest mt-4"
          >
            Configuración de Empresa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <LayoutGrid size={18} />
          </div>
          <span className="font-black text-slate-800 tracking-tight">{companyName}</span>
        </div>
        {currentUser && currentUser.id !== 'ADMIN' && (
          <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate max-w-[80px]">{currentUser.name.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
          {toast.icon || <CheckCircle2 size={18} className="text-indigo-400" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-6">
        {activeView === 'dashboard' && currentUser && (
          <Dashboard 
            records={records.filter(r => r.employeeId === currentUser.id)} 
            employee={currentUser} 
            onNavigateToSettings={() => setActiveView('settings')}
          />
        )}
        {activeView === 'scanner' && <Scanner office={officeLocation} onScan={handleQRScan} isProcessing={isProcessing} />}
        {activeView === 'history' && (
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Mi Actividad</h2>
            <div className="space-y-4">
              {records.filter(r => r.employeeId === currentUser?.id).length > 0 ? (
                records.filter(r => r.employeeId === currentUser?.id).reverse().map(r => (
                  <div key={r.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div>
                      <p className="font-black text-slate-800 text-xs uppercase">{new Date(r.timestamp).toLocaleDateString()}</p>
                      <p className="text-lg font-bold text-indigo-600">{new Date(r.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${r.type === 'ENTRADA' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {r.type}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-10 italic">No tienes registros de asistencia.</p>
              )}
            </div>
          </div>
        )}
        {activeView === 'settings' && currentUser && (
          <Settings 
            office={officeLocation}
            employee={currentUser}
            employees={employees}
            companyName={companyName}
            companyLogo={companyLogo}
            onUpdateOffice={(loc) => { setOfficeLocation(loc); localStorage.setItem(STORAGE_KEYS.OFFICE, JSON.stringify(loc)); showToast("Ubicación guardada"); }}
            onUpdateUser={(u) => { setCurrentUser(u); localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u)); showToast("Perfil actualizado"); }}
            onUpdateBrand={(n, l) => { setCompanyName(n); localStorage.setItem('company_name', n); showToast("Marca actualizada"); }}
            onAddEmployee={handleAddEmployee}
            onClearData={() => { localStorage.clear(); window.location.reload(); }}
            showToast={showToast}
            installPrompt={null}
          />
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-[35px] p-2 flex items-center justify-around z-50">
        <button onClick={() => setActiveView('dashboard')} className={`p-4 rounded-3xl ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
          <LayoutGrid size={22} />
        </button>
        <button onClick={() => setActiveView('scanner')} className={`p-5 rounded-full -mt-12 border-8 border-slate-50 ${activeView === 'scanner' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow-xl'}`}>
          <Camera size={26} />
        </button>
        <button onClick={() => setActiveView('history')} className={`p-4 rounded-3xl ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
          <History size={22} />
        </button>
        <button onClick={() => setActiveView('settings')} className={`p-4 rounded-3xl ${activeView === 'settings' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
          <SettingsIcon size={22} />
        </button>
      </nav>
    </div>
  );
};

export default App;
