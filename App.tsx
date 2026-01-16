
import React, { useState, useEffect } from 'react';
import { ViewType, AttendanceRecord, OfficeLocation, Employee } from './types';
import { DEFAULT_OFFICE, STORAGE_KEYS } from './constants';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { getCurrentPosition } from './utils/geoUtils';
import { syncRecordsToGitHub } from './services/githubService';
import { LayoutGrid, Camera, History, Settings as SettingsIcon, CheckCircle2, UserPlus, ArrowRight, Cloud, Download, Building2, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>(DEFAULT_OFFICE);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companyName, setCompanyName] = useState('CheckIn Pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error', icon?: React.ReactNode} | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualImport, setShowManualImport] = useState(false);

  // Función para decodificación segura de Base64 con UTF-8
  const safeAtob = (str: string) => decodeURIComponent(escape(atob(str)));

  const importSetup = (data: string) => {
    try {
      const decoded = JSON.parse(safeAtob(data));
      if (decoded.companyName) {
        setCompanyName(decoded.companyName);
        localStorage.setItem('company_name', decoded.companyName);
      }
      if (decoded.employees && Array.isArray(decoded.employees)) {
        setEmployees(decoded.employees);
        localStorage.setItem('company_employees', JSON.stringify(decoded.employees));
      }
      
      localStorage.removeItem(STORAGE_KEYS.USER);
      setCurrentUser(null);
      setActiveView('onboarding');
      setShowManualImport(false);
      
      showToast(`Empresa "${decoded.companyName}" vinculada`, "success", <Building2 size={16} />);
      return true;
    } catch (e) {
      console.error("Error al importar configuración:", e);
      showToast("El código de configuración es inválido", "error");
      return false;
    }
  };

  useEffect(() => {
    // 1. Detectar importación de configuración vía URL (?setup=...)
    const params = new URLSearchParams(window.location.search);
    const setupData = params.get('setup');

    if (setupData) {
      if (importSetup(setupData)) {
        // Limpiar la URL para evitar re-importaciones
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // 2. Cargar datos locales de persistencia
    const savedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedEmployees = localStorage.getItem('company_employees');
    if (savedEmployees && !setupData) setEmployees(JSON.parse(savedEmployees));

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser && !setupData) {
      setCurrentUser(JSON.parse(savedUser));
    } else if (!setupData) {
      setActiveView('onboarding');
    }

    const savedCompany = localStorage.getItem('company_name');
    if (savedCompany && !setupData) setCompanyName(savedCompany);
    
    const savedOffice = localStorage.getItem(STORAGE_KEYS.OFFICE);
    if (savedOffice) setOfficeLocation(JSON.parse(savedOffice));
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success', icon?: React.ReactNode) => {
    setToast({ message, type, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectEmployee = (emp: Employee) => {
    setCurrentUser(emp);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(emp));
    setActiveView('dashboard');
    showToast(`Hola, ${emp.name.split(' ')[0]}`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    setCurrentUser(null);
    setActiveView('onboarding');
    showToast("Perfil desvinculado");
  };

  const handleAddEmployee = (emp: Employee) => {
    const newList = [...employees, emp];
    setEmployees(newList);
    localStorage.setItem('company_employees', JSON.stringify(newList));
  };

  const handleDeleteEmployee = (id: string) => {
    const newList = employees.filter(emp => emp.id !== id);
    setEmployees(newList);
    localStorage.setItem('company_employees', JSON.stringify(newList));
    showToast("Empleado eliminado");
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setEmployees([]);
    setRecords([]);
    setCurrentUser(null);
    setCompanyName('CheckIn Pro');
    setOfficeLocation(DEFAULT_OFFICE);
    setActiveView('onboarding');
    showToast("Sistema reseteado", "success");
  };

  const handleQRScan = async (qrData: string) => {
    if (isProcessing || !currentUser) return;
    setIsProcessing(true);
    try {
      if (!qrData.includes("CHECKIN_PRO")) {
        showToast("Este código QR no pertenece al sistema", "error");
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
      showToast(`${newRecord.type} confirmada`, "success");

      const syncOk = await syncRecordsToGitHub(updatedRecords);
      if (syncOk) {
        showToast("Sincronizado con la nube", "success", <Cloud size={16} />);
      }

      setActiveView('dashboard');
    } catch (e) {
      showToast("Error al validar marca", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (activeView === 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mb-8">
          <UserPlus size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">{companyName}</h1>
        <p className="text-slate-500 text-sm mb-12 max-w-xs font-medium">Selecciona tu perfil para empezar a registrar tu asistencia.</p>
        
        <div className="w-full max-w-sm space-y-3">
          {employees.length > 0 ? (
            <>
              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 py-2">
                {employees.map(emp => (
                  <button 
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:border-indigo-500 transition-all text-left shadow-sm group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-4">
                      <img src={emp.photo} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                      <div>
                        <p className="font-black text-slate-900">{emp.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.role}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-indigo-50 transition-colors">
                      <ArrowRight className="text-slate-300 group-hover:text-indigo-500" size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-8 rounded-[3rem] text-amber-800 shadow-sm">
              <p className="text-sm font-black mb-6">No hay empleados registrados en esta empresa.</p>
              <button 
                onClick={() => {
                  setCurrentUser({id:'ADMIN', name:'Administrador', role:'Configuración', photo:''});
                  setActiveView('settings');
                }}
                className="bg-amber-200 hover:bg-amber-300 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors"
              >
                Crear Perfiles
              </button>
            </div>
          )}
          
          <div className="pt-6 space-y-4">
            {showManualImport ? (
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Importar código manual</p>
                <textarea 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Pega el código aquí..."
                  className="w-full bg-slate-50 rounded-xl p-4 text-[10px] font-mono border-none outline-none focus:ring-2 ring-indigo-500/20 mb-4 h-24"
                />
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowManualImport(false)}
                    className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => importSetup(manualCode)}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100"
                  >
                    Importar
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowManualImport(true)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2"
              >
                <Terminal size={14} /> <span>Importar Código</span>
              </button>
            )}

            <button 
              onClick={() => {
                setCurrentUser({id:'ADMIN', name:'Administrador', role:'Configuración', photo:''});
                setActiveView('settings');
              }}
              className="w-full py-4 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
            >
              Acceso Administrador
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <LayoutGrid size={20} />
          </div>
          <span className="font-black text-slate-900 tracking-tighter text-lg">{companyName}</span>
        </div>
        {currentUser && currentUser.id !== 'ADMIN' && (
          <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-[2rem] shadow-2xl bg-slate-900 text-white flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/10 p-1.5 rounded-full">
            {toast.icon || <CheckCircle2 size={16} className="text-indigo-400" />}
          </div>
          <span className="font-bold text-xs uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-6">
        {activeView === 'dashboard' && currentUser && (
          <Dashboard 
            records={records.filter(r => r.employeeId === currentUser.id)} 
            employee={currentUser} 
            employees={employees}
            companyName={companyName}
            onNavigateToSettings={() => setActiveView('settings')}
          />
        )}
        {activeView === 'scanner' && <Scanner office={officeLocation} onScan={handleQRScan} isProcessing={isProcessing} />}
        {activeView === 'history' && (
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter">Mi Actividad</h2>
            <div className="space-y-4">
              {records.filter(r => r.employeeId === currentUser?.id).length > 0 ? (
                records.filter(r => r.employeeId === currentUser?.id).reverse().map(r => (
                  <div key={r.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div>
                      <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-1">{new Date(r.timestamp).toLocaleDateString()}</p>
                      <p className="text-2xl font-black text-indigo-600">{new Date(r.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${r.type === 'ENTRADA' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-500'}`}>
                      {r.type}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <History className="mx-auto mb-4 text-slate-200" size={64} />
                  <p className="text-slate-400 font-bold italic">No hay actividad para mostrar</p>
                </div>
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
            companyLogo={''}
            onUpdateOffice={(loc) => { setOfficeLocation(loc); localStorage.setItem(STORAGE_KEYS.OFFICE, JSON.stringify(loc)); showToast("Zona de trabajo actualizada"); }}
            onUpdateUser={(u) => { setCurrentUser(u); localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u)); showToast("Perfil actualizado"); }}
            onUpdateBrand={(n, l) => { setCompanyName(n); localStorage.setItem('company_name', n); showToast("Nombre actualizado"); }}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onLogout={handleLogout}
            onClearData={handleClearAllData}
            showToast={showToast}
            installPrompt={null}
          />
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-[40px] p-2.5 flex items-center justify-around z-50">
        <button onClick={() => setActiveView('dashboard')} className={`p-4 rounded-[2rem] transition-all ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
          <LayoutGrid size={24} />
        </button>
        <button onClick={() => setActiveView('scanner')} className={`p-5 rounded-full -mt-16 border-8 border-slate-50 shadow-2xl transition-all active:scale-90 ${activeView === 'scanner' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
          <Camera size={28} />
        </button>
        <button onClick={() => setActiveView('history')} className={`p-4 rounded-[2rem] transition-all ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
          <History size={24} />
        </button>
        <button onClick={() => setActiveView('settings')} className={`p-4 rounded-[2rem] transition-all ${activeView === 'settings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>
          <SettingsIcon size={24} />
        </button>
      </nav>
    </div>
  );
};

export default App;
