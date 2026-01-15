
import React, { useState, useEffect } from 'react';
import { ViewType, AttendanceRecord, OfficeLocation, Employee } from './types';
import { DEFAULT_OFFICE, MOCK_EMPLOYEE, STORAGE_KEYS } from './constants';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { getCurrentPosition } from './utils/geoUtils';
import { LayoutGrid, Camera, History, Settings as SettingsIcon, CheckCircle2, Building2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>(DEFAULT_OFFICE);
  const [currentUser] = useState<Employee>(MOCK_EMPLOYEE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [companyName, setCompanyName] = useState('CheckIn Pro');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const savedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedOffice = localStorage.getItem(STORAGE_KEYS.OFFICE);
    if (savedOffice) setOfficeLocation(JSON.parse(savedOffice));

    const savedCompany = localStorage.getItem('company_name');
    if (savedCompany) {
      setCompanyName(savedCompany);
      document.title = savedCompany;
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleQRScan = async (qrData: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      // 1. Validar el contenido del QR
      if (!qrData.includes("CHECKIN_PRO")) {
        showToast("QR no válido para este sistema", "error");
        setIsProcessing(false);
        return;
      }

      // 2. Obtener posición GPS exacta
      const pos = await getCurrentPosition();

      const today = new Date().toISOString().split('T')[0];
      const existingToday = records.find(r => r.date === today && !r.checkOut);

      if (existingToday) {
        // Registrar Salida
        const updatedRecords = records.map(r => 
          r.id === existingToday.id 
            ? { ...r, checkOut: new Date().toISOString() } 
            : r
        );
        setRecords(updatedRecords);
        showToast("Salida registrada con éxito");
      } else {
        // Registrar Entrada
        const newRecord: AttendanceRecord = {
          id: `REC-${Date.now()}`,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
          date: today,
          checkIn: new Date().toISOString(),
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }
        };
        setRecords([...records, newRecord]);
        showToast("Entrada registrada con éxito");
      }
      
      setActiveView('dashboard');
    } catch (error: any) {
      const errorMsg = error.message?.includes("User denied") 
        ? "GPS desactivado. Por favor, actívalo para fichar." 
        : "Error al validar ubicación o QR.";
      showToast(errorMsg, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Building2 size={18} />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">{companyName}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistema Operativo</span>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 border ${
          toast.type === 'success' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600 border-red-400 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {activeView === 'dashboard' && <Dashboard records={records} employee={currentUser} />}
        {activeView === 'scanner' && (
          <Scanner 
            office={officeLocation} 
            onScan={handleQRScan} 
            isProcessing={isProcessing} 
          />
        )}
        {activeView === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
               <h2 className="text-2xl font-black text-slate-900 mb-6">Log de Asistencia</h2>
               <div className="space-y-4">
                 {records.length === 0 ? (
                   <div className="flex flex-col items-center py-16 text-slate-300">
                      <History size={48} className="mb-4 opacity-20" />
                      <p className="font-medium uppercase text-xs tracking-widest">No hay registros aún</p>
                   </div>
                 ) : (
                   records.slice().reverse().map(r => (
                     <div key={r.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-100 transition-colors">
                        <div>
                          <p className="font-black text-slate-800">{new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          <div className="flex space-x-3 mt-1">
                            <span className="text-[11px] font-bold text-indigo-500">ENTRADA: {new Date(r.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {r.checkOut && <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">SALIDA: {new Date(r.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.checkOut ? 'bg-slate-200 text-slate-500' : 'bg-green-500 text-white shadow-lg shadow-green-100'}`}>
                          {r.checkOut ? 'Cerrado' : 'Activo'}
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        )}
        {activeView === 'settings' && (
          <Settings 
            office={officeLocation}
            records={records}
            onUpdateOffice={(loc) => {
              setOfficeLocation(loc);
              localStorage.setItem(STORAGE_KEYS.OFFICE, JSON.stringify(loc));
            }}
            onImportRecords={(newRecords) => setRecords(newRecords)}
            onClearData={() => {
              setRecords([]);
              localStorage.removeItem(STORAGE_KEYS.RECORDS);
              showToast("Todos los datos han sido borrados");
            }}
            showToast={showToast}
            installPrompt={installPrompt}
            setInstallPrompt={setInstallPrompt}
          />
        )}
      </main>

      {/* Navegación Inferior */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] p-2 flex items-center justify-around z-50">
        <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-indigo-500'}`}>
          <LayoutGrid size={22} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Inicio</span>
        </button>
        <button onClick={() => setActiveView('scanner')} className={`flex flex-col items-center p-4 rounded-full transition-all -mt-12 border-[6px] border-slate-50 ${activeView === 'scanner' ? 'bg-indigo-600 text-white scale-110 shadow-2xl' : 'bg-white text-indigo-600 shadow-xl'}`}>
          <Camera size={26} />
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-indigo-500'}`}>
          <History size={22} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Log</span>
        </button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center p-3 rounded-2xl transition-all ${activeView === 'settings' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-indigo-500'}`}>
          <SettingsIcon size={22} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Ajustes</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
