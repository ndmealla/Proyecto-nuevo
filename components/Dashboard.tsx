
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Employee } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles, FileText, Share2, Info, CheckCircle2, Copy, Terminal } from 'lucide-react';
import { analyzeAttendance } from '../services/aiService';

interface DashboardProps {
  records: AttendanceRecord[];
  employee: Employee;
  employees: Employee[];
  companyName: string;
  onNavigateToSettings?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ records, employee, employees, companyName, onNavigateToSettings }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [showManualCode, setShowManualCode] = useState(false);

  const dailyStats = useMemo(() => {
    const map: Record<string, { checkIn?: string, checkOut?: string, count: number }> = {};
    records.forEach(r => {
      if (!map[r.date]) map[r.date] = { count: 0 };
      map[r.date].count++;
      if (r.type === 'ENTRADA') {
        if (!map[r.date].checkIn || r.timestamp < map[r.date].checkIn!) map[r.date].checkIn = r.timestamp;
      } else {
        if (!map[r.date].checkOut || r.timestamp > map[r.date].checkOut!) map[r.date].checkOut = r.timestamp;
      }
    });
    return map;
  }, [records]);

  const historySessions = useMemo(() => {
    const sessions: { id: string, date: string, checkIn: string | null, checkOut: string | null }[] = [];
    const sorted = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const activeEntries: Record<string, any> = {};

    sorted.forEach(r => {
      if (r.type === 'ENTRADA') {
        const session = { id: r.id, date: r.date, checkIn: r.timestamp, checkOut: null };
        sessions.push(session);
        activeEntries[r.date] = session;
      } else if (r.type === 'SALIDA') {
        if (activeEntries[r.date]) {
          activeEntries[r.date].checkOut = r.timestamp;
          delete activeEntries[r.date];
        } else {
          sessions.push({ id: r.id, date: r.date, checkIn: null, checkOut: r.timestamp });
        }
      }
    });
    return [...sessions].reverse();
  }, [records]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const data = dailyStats[date];
    let hours = 0;
    if (data?.checkIn && data?.checkOut) {
      hours = (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / (1000 * 60 * 60);
    }
    return {
      date: date.slice(5),
      hours: parseFloat(hours.toFixed(2)),
      count: data?.count || 0
    };
  });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const report = await analyzeAttendance(records);
    setAiReport(report);
    setIsGenerating(false);
  };

  // Función para codificación segura de Base64 con UTF-8
  const safeBtoa = (str: string) => btoa(unescape(encodeURIComponent(str)));

  const getSetupCode = () => {
    const configToShare = {
      companyName,
      employees: employees.map(e => ({ id: e.id, name: e.name, role: e.role, photo: e.photo }))
    };
    return safeBtoa(JSON.stringify(configToShare));
  };

  const handleShare = async () => {
    try {
      let currentUrl = window.location.origin + window.location.pathname;
      
      const setupParam = getSetupCode();
      const fullShareUrl = `${currentUrl}${currentUrl.endsWith('/') ? '' : '/'}?setup=${setupParam}`;

      if (navigator.share) {
        await navigator.share({
          title: `Acceso a ${companyName}`,
          text: `Registra tu asistencia en ${companyName}:`,
          url: fullShareUrl
        });
        setShareFeedback("¡Compartido!");
      } else {
        await navigator.clipboard.writeText(fullShareUrl);
        setShareFeedback("Enlace copiado");
      }
      setTimeout(() => setShareFeedback(null), 3000);
    } catch (err) {
      console.error("Error sharing:", err);
      setShowManualCode(true);
    }
  };

  const totalHoursWorked = chartData.reduce((acc, curr) => acc + curr.hours, 0);
  const avgHours = records.length > 0 ? totalHoursWorked / (chartData.filter(d => d.hours > 0).length || 1) : 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {employee.photo ? (
              <img src={employee.photo} alt={employee.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-100" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                {employee.name.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
            <p className="text-sm text-slate-500">{employee.role}</p>
          </div>
        </div>
        <div className="flex flex-col w-full md:w-auto space-y-2">
          <button 
            onClick={handleShare}
            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase flex items-center hover:bg-indigo-700 transition-all w-full md:w-auto justify-center shadow-lg shadow-indigo-100"
          >
            {shareFeedback ? (
              <span className="flex items-center animate-in fade-in zoom-in-95">
                <CheckCircle2 size={16} className="mr-2" /> {shareFeedback}
              </span>
            ) : (
              <>
                <Share2 size={16} className="mr-2" />
                Compartir Acceso
              </>
            )}
          </button>
          <button 
            onClick={() => setShowManualCode(!showManualCode)}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center hover:text-indigo-600 transition-colors"
          >
            {showManualCode ? 'Ocultar código' : '¿Problemas con el enlace?'}
          </button>
        </div>
      </div>

      {showManualCode && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-indigo-400 font-black text-[10px] uppercase tracking-widest flex items-center">
              <Terminal size={14} className="mr-2" /> Código de Configuración Manual
            </h4>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(getSetupCode());
                setShareFeedback("Código copiado");
                setTimeout(() => setShareFeedback(null), 3000);
              }}
              className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-slate-400 text-[11px] mb-4 leading-relaxed">Si el enlace 404 persiste, copia este código y pásalo manualmente a tus empleados para que lo peguen en "Importar Código".</p>
          <div className="bg-black/40 p-4 rounded-xl font-mono text-[9px] text-indigo-300 break-all max-h-32 overflow-y-auto border border-white/5">
            {getSetupCode()}
          </div>
        </div>
      )}

      {records.length === 0 && employee.id === 'ADMIN' && (
        <div className="bg-indigo-900 p-6 rounded-[2.5rem] text-white flex items-start space-x-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Info className="text-indigo-300" size={24} />
          </div>
          <div>
            <p className="font-bold mb-1">Pasos Iniciales</p>
            <p className="text-sm text-indigo-200 mb-4 leading-relaxed">Configura el directorio y usa "Compartir Acceso" para que los empleados instalen la App en sus celulares.</p>
            <button 
              onClick={onNavigateToSettings}
              className="bg-white text-indigo-900 px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
            >
              Ir a Ajustes
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
          <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">Horas Semanales</p>
          <h2 className="text-4xl font-black mt-2">{totalHoursWorked.toFixed(1)}h</h2>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Promedio Diario</p>
          <h2 className="text-4xl font-black text-slate-900 mt-2">{avgHours.toFixed(1)}h</h2>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Registros Mes</p>
          <h2 className="text-4xl font-black text-slate-900 mt-2">{records.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length}</h2>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center">
          <TrendingUp className="mr-3 text-indigo-600" size={20} />
          Actividad Reciente
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9', radius: 10}}
                contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800}}
              />
              <Bar dataKey="hours" radius={[8, 8, 8, 8]} fill="#4f46e5" barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {records.length > 0 && (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-500 p-2 rounded-xl">
              <Sparkles className="text-white" size={24} />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Análisis Inteligente</h3>
          </div>
          {aiReport ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">{aiReport}</p>
              </div>
              <button onClick={() => setAiReport(null)} className="mt-6 text-[10px] text-indigo-400 font-black uppercase tracking-widest hover:text-white transition-colors">Solicitar nuevo análisis</button>
            </div>
          ) : (
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center space-x-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analizando...</span>
                </>
              ) : (
                <span>Obtener Reporte de IA</span>
              )}
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-900 flex items-center">
            <FileText className="mr-3 text-slate-400" size={22} />
            Historial de Marcas
          </h3>
        </div>
        <div className="divide-y divide-slate-50">
          {historySessions.slice(0, 5).map(session => (
            <div key={session.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="font-black text-slate-800 text-sm">{session.date}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    {session.checkIn ? `Entrada ${new Date(session.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '---'} 
                    {session.checkOut ? ` • Salida ${new Date(session.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : ''}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${session.checkOut ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {session.checkOut ? 'Cerrado' : 'En curso'}
              </span>
            </div>
          ))}
          {historySessions.length === 0 && (
            <div className="p-12 text-center text-slate-300">
               <FileText className="mx-auto mb-4 opacity-20" size={48} />
               <p className="text-sm font-bold italic">Aún no hay registros de asistencia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
