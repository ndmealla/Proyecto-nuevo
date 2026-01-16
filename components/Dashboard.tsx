
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Employee } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Clock, TrendingUp, Sparkles, User, FileText, Share2, Info } from 'lucide-react';
import { analyzeAttendance } from '../services/aiService';

interface DashboardProps {
  records: AttendanceRecord[];
  employee: Employee;
  onNavigateToSettings?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ records, employee, onNavigateToSettings }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Group records by date for daily stats and chart calculations
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

  // Group individual entry/exit records into sessions for the history list
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

  const handleShare = async () => {
    const shareData = {
      title: 'CheckIn Pro - Acceso Empleados',
      text: 'Usa este enlace para marcar tu asistencia hoy.',
      url: window.location.origin + window.location.pathname // URL limpia y absoluta
    };

    try {
      // Intentar compartir si el navegador lo soporta y es una URL válida (HTTPS)
      if (navigator.share && window.location.protocol === 'https:') {
        await navigator.share(shareData);
      } else {
        throw new Error('Share API not available');
      }
    } catch (err) {
      // Fallback: Copiar al portapapeles
      try {
        await navigator.clipboard.writeText(shareData.url);
        setShareFeedback("¡Enlace copiado!");
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (clipErr) {
        console.error("Error al copiar", clipErr);
      }
    }
  };

  const totalHoursWorked = chartData.reduce((acc, curr) => acc + curr.hours, 0);
  const avgHours = records.length > 0 ? totalHoursWorked / (chartData.filter(d => d.hours > 0).length || 1) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Perfil y Compartir */}
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
        <button 
          onClick={handleShare}
          className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-bold text-sm flex items-center hover:bg-indigo-100 transition-all w-full md:w-auto justify-center relative overflow-hidden"
        >
          {shareFeedback ? (
            <span className="flex items-center text-green-600 animate-in fade-in slide-in-from-bottom-1">
              <Clock size={18} className="mr-2" /> {shareFeedback}
            </span>
          ) : (
            <>
              <Share2 size={18} className="mr-2" />
              Compartir Acceso
            </>
          )}
        </button>
      </div>

      {/* Info Box para Admin si no hay registros */}
      {records.length === 0 && employee.id === 'ADMIN' && (
        <div className="bg-indigo-900 p-6 rounded-[2rem] text-white flex items-start space-x-4">
          <Info className="shrink-0 text-indigo-400 mt-1" size={24} />
          <div>
            <p className="font-bold mb-1">Modo Administrador Activo</p>
            <p className="text-sm text-indigo-200 mb-4">Para ver el Directorio de Empleados y configurar la empresa, dirígete a la pestaña de Ajustes.</p>
            <button 
              onClick={onNavigateToSettings}
              className="bg-white text-indigo-900 px-4 py-2 rounded-xl font-bold text-xs uppercase"
            >
              Configurar Directorio
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
          <p className="text-white/80 text-sm font-medium">Horas Semanales</p>
          <h2 className="text-3xl font-bold mt-1">{totalHoursWorked.toFixed(1)}h</h2>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Promedio Diario</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{avgHours.toFixed(1)}h</h2>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Asistencias Mes</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{records.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length}</h2>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
          <TrendingUp className="mr-2 text-indigo-600" size={20} />
          Actividad Reciente
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Analysis Section */}
      {records.length > 0 && (
        <div className="bg-slate-900 rounded-3xl p-8 text-white">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="text-indigo-400" size={24} />
            <h3 className="text-xl font-bold">Análisis con IA</h3>
          </div>
          {aiReport ? (
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{aiReport}</p>
              <button onClick={() => setAiReport(null)} className="mt-4 text-xs text-indigo-400 font-bold uppercase tracking-widest">Cerrar Análisis</button>
            </div>
          ) : (
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 text-sm"
            >
              {isGenerating ? "Procesando..." : "Generar Reporte IA"}
            </button>
          )}
        </div>
      )}

      {/* Historial Corto */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center">
            <FileText className="mr-2 text-slate-400" size={20} />
            Últimas Marcas
          </h3>
        </div>
        <div className="divide-y divide-slate-50">
          {historySessions.slice(0, 5).map(session => (
            <div key={session.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">{session.date}</p>
                <p className="text-[10px] text-slate-400 uppercase font-black">
                  {session.checkIn ? `Entrada: ${new Date(session.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '---'} 
                  {session.checkOut ? ` • Salida: ${new Date(session.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : ''}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${session.checkOut ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-600'}`}>
                {session.checkOut ? 'Cerrado' : 'Abierto'}
              </span>
            </div>
          ))}
          {historySessions.length === 0 && <p className="p-8 text-center text-slate-400 text-sm italic">No hay registros hoy</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
