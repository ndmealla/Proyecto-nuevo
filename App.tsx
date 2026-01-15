
import React, { useState, useEffect } from 'react';
import { ViewType, AttendanceRecord, OfficeLocation, Employee } from './types';
import { DEFAULT_OFFICE, MOCK_EMPLOYEE, STORAGE_KEYS } from './constants';
import Scanner from './components/Scanner';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { getCurrentPosition } from './utils/geoUtils';
import { LayoutGrid, Camera, History, Settings as SettingsIcon, CheckCircle2, Building2, AlertCircle, Download, Smartphone } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>(DEFAULT_OFFICE);
  const [currentUser, setCurrentUser] = useState<Employee>(MOCK_EMPLOYEE);
  const [companyName, setCompanyName] = useState('CheckIn Pro');
  const [companyLogo, setCompanyLogo] = useState('https://cdn-icons-png.flaticon.com/512/2913/2913444.png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Cargar datos de localStorage
    const savedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (savedRecords) setRecords(JSON.parse(savedRecords));

    const savedOffice = localStorage.getItem(STORAGE_KEYS.OFFICE);
    if (savedOffice) setOfficeLocation(JSON.parse(savedOffice));

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    const savedCompany = localStorage.getItem('company_name');
    if (savedCompany) {
      setCompanyName(savedCompany);
      document.title = savedCompany;
    }

    const savedLogo = localStorage.getItem('company_logo');
    if (savedLogo) setCompanyLogo(savedLogo);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpdateUser = (user: Employee) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    showToast("Perfil actualizado");
  };

  const handleUpdateBrand = (name: string, logo: string) => {
    setCompanyName(name);
    setCompanyLogo(logo);
    localStorage.setItem('company_name', name);
    localStorage.setItem('company_logo', logo);
    document.title = name;
    showToast("Marca actualizada");
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      showToast("No hay registros", "error");
      return;
    }
    const headers = ["ID", "Empleado", "Fecha", "Entrada", "Salida", "Lat", "Lng"];
    const rows = records.map(r => [
      r.id, r.employeeName, r.date,
      new Date(r.checkIn).toLocaleTimeString(),
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "PENDIENTE",
      r.location.lat, r.location.lng
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Reporte_${companyName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Excel generado");
  };

  const handleQRScan = async (qrData: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (!qrData.includes("CHECKIN_PRO")) {
        showToast("QR no válido", "error");
        setIsProcessing(false);
        return;
      }
      const pos = await getCurrentPosition();
      const today = new Date().toISOString().split('T')[0];
      const existingToday = records.find(r => r.date === today && !r.checkOut);

      if (existingToday) {
        const updatedRecords = records.map(r => 
          r.id === existingToday.id ? { ...r, checkOut: new Date().toISOString() } : r
        );
        setRecords(updatedRecords);
        showToast("Salida registrada");
      } else {
        const newRecord: AttendanceRecord = {
          id: `REC-${Date.now()}`,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
          date: today,
          checkIn: new Date().toISOString(),
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
        };
        setRecords([...records, newRecord]);
        showToast("Entrada registrada");
      }
      setActiveView('dashboard');
    } catch (e) {
      showToast("Error de GPS o Validación", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-3">
          <img src={companyLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-50 p-1" />
          <span className="font-black text-slate-800 tracking-tight text-lg">{companyName}</span>
        </div>
        <div className="flex items-center space-x-2">
           <div className="hidden sm:flex items-center px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
             Sistema Activo
           </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 border ${
          toast.type === 'success' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600 border-red-400 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-6">
        {activeView === 'dashboard' && <Dashboard records={records} employee={currentUser} />}
        {activeView === 'scanner' && <Scanner office={officeLocation} onScan={handleQRScan} isProcessing={isProcessing} />}
        {activeView === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black text-slate-900">Historial</h2>
                 <button onClick={exportToCSV} className="p-3 bg-slate-900 text-white rounded-2xl flex items-center space-x-2 text-xs font-bold hover:bg-indigo-600 transition-all">
                   <Download size={16} /> <span>Excel</span>
                 </button>
               </div>
               <div className="space-y-4">
                 {records.length === 0 ? (
                   <div className="py-20 text-center text-slate-300 uppercase text-[10px] font-bold tracking-widest">Sin registros disponibles</div>
                 ) : (
                   records.slice().reverse().map(r => (
                    <div key={r.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase">{new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <div className="flex space-x-3 mt-1">
                          <span className="text-[10px] font-bold text-indigo-500">IN: {new Date(r.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          {r.checkOut && <span className="text-[10px] font-bold text-slate-400">OUT: {new Date(r.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${r.checkOut ? 'bg-slate-200 text-slate-500' : 'bg-green-500 text-white'}`}>
                        {r.checkOut ? 'Cerrado' : 'Abierto'}
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
            employee={currentUser}
            companyName={companyName}
            companyLogo={companyLogo}
            onUpdateOffice={(loc) => { setOfficeLocation(loc); localStorage.setItem(STORAGE_KEYS.OFFICE, JSON.stringify(loc)); showToast("Zona de oficina actualizada"); }}
            onUpdateUser={handleUpdateUser}
            onUpdateBrand={handleUpdateBrand}
            onClearData={() => { setRecords([]); localStorage.removeItem(STORAGE_KEYS.RECORDS); showToast("Todo borrado"); }}
            showToast={showToast}
            installPrompt={installPrompt}
          />
        )}
      </main>

      {/* Navegación Inferior Estilo App Nativa */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-[35px] p-2 flex items-center justify-around z-50">
        <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center p-3 rounded-3xl transition-all ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
          <LayoutGrid size={22} />
        </button>
        <button onClick={() => setActiveView('scanner')} className={`flex flex-col items-center p-4 rounded-full transition-all -mt-12 border-[8px] border-slate-50 ${activeView === 'scanner' ? 'bg-indigo-600 text-white scale-110 shadow-2xl' : 'bg-white text-indigo-600 shadow-xl'}`}>
          <Camera size={26} />
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center p-3 rounded-3xl transition-all ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
          <History size={22} />
        </button>
        <button onClick={() => setActiveView('settings')} className={`flex flex-col items-center p-3 rounded-3xl transition-all ${activeView === 'settings' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
          <SettingsIcon size={22} />
        </button>
      </nav>
    </div>
  );
};

export default App;
