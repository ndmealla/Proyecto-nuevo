
import React, { useState } from 'react';
import { AttendanceRecord, Employee } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Clock, TrendingUp, Sparkles, User, ChevronRight, FileText } from 'lucide-react';
import { analyzeAttendance } from '../services/aiService';

interface DashboardProps {
  records: AttendanceRecord[];
  employee: Employee;
}

const Dashboard: React.FC<DashboardProps> = ({ records, employee }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Procesar datos para gráficos (últimos 7 días)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(date => {
    const dayRecords = records.filter(r => r.date === date);
    let totalHours = 0;
    dayRecords.forEach(r => {
      if (r.checkIn && r.checkOut) {
        totalHours += (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60);
      }
    });
    return {
      date: date.slice(5), // MM-DD
      hours: parseFloat(totalHours.toFixed(2)),
      count: dayRecords.length
    };
  });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const report = await analyzeAttendance(records);
    setAiReport(report);
    setIsGenerating(false);
  };

  const totalHoursWorked = chartData.reduce((acc, curr) => acc + curr.hours, 0);
  const avgHours = records.length > 0 ? totalHoursWorked / (chartData.filter(d => d.hours > 0).length || 1) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header Perfil */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img src={employee.photo} alt={employee.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-100" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{employee.name}</h1>
            <p className="text-sm text-slate-500">{employee.role}</p>
          </div>
        </div>
        <div className="hidden md:block">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ID: {employee.id}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-white/80 text-sm font-medium">Horas Semanales</p>
          <h2 className="text-3xl font-bold mt-1">{totalHoursWorked.toFixed(1)}h</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Promedio Diario</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">{avgHours.toFixed(1)}h</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Calendar size={24} className="text-amber-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Asistencias Este Mes</p>
          <h2 className="text-3xl font-bold text-slate-900 mt-1">18</h2>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
          <BarChart className="mr-2 text-indigo-600" size={20} />
          Resumen de Actividad de la Semana
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#4f46e5' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="text-indigo-400" size={24} />
            <h3 className="text-xl font-bold">Insight IA de Asistencia</h3>
          </div>
          
          {aiReport ? (
            <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{aiReport}</p>
              <button 
                onClick={() => setAiReport(null)}
                className="mt-6 text-sm text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
              >
                Cerrar reporte
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-slate-400 max-w-md">
                Deja que nuestra IA analice tus patrones de trabajo para darte consejos sobre productividad y puntualidad.
              </p>
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center disabled:opacity-50"
              >
                {isGenerating ? (
                   <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Procesando...
                   </span>
                ) : (
                  <>Analizar con IA <ChevronRight size={20} className="ml-2" /></>
                )}
              </button>
            </div>
          )}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
      </div>

      {/* Últimos Registros */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center">
            <FileText className="mr-2 text-slate-400" size={20} />
            Historial Reciente
          </h3>
          <button className="text-indigo-600 text-sm font-semibold hover:underline">Ver todo</button>
        </div>
        <div className="divide-y divide-slate-50">
          {records.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No hay registros disponibles</div>
          ) : (
            records.slice().reverse().map(record => (
              <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${record.checkOut ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{record.date}</p>
                    <p className="text-xs text-slate-500">
                      Entrada: {new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      {record.checkOut && ` • Salida: ${new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.checkOut ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>
                    {record.checkOut ? 'Completado' : 'En curso'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
