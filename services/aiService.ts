
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord } from "../types";

export const analyzeAttendance = async (records: AttendanceRecord[]): Promise<string> => {
  try {
    // Initializing AI inside the function to ensure it uses the latest API Key as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Group records by date to pair ENTRADA and SALIDA events
    const dayMap: Record<string, { checkIn?: string, checkOut?: string }> = {};
    
    // Sort records to process them chronologically
    const sortedRecords = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    sortedRecords.forEach(r => {
      if (!dayMap[r.date]) dayMap[r.date] = {};
      if (r.type === 'ENTRADA') {
        // We take the first check-in of the day
        if (!dayMap[r.date].checkIn) dayMap[r.date].checkIn = r.timestamp;
      } else if (r.type === 'SALIDA') {
        // We take the last check-out of the day
        dayMap[r.date].checkOut = r.timestamp;
      }
    });

    const recordsSummary = Object.entries(dayMap).map(([date, data]) => {
      // FIX: Calculate hours based on paired entry/exit timestamps
      const hours = data.checkIn && data.checkOut 
        ? (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / (1000 * 60 * 60) 
        : 0;
      
      return {
        fecha: date,
        entrada: data.checkIn ? new Date(data.checkIn).toLocaleTimeString() : 'Sin entrada registrada',
        salida: data.checkOut ? new Date(data.checkOut).toLocaleTimeString() : 'Sin salida registrada',
        horas: parseFloat(hours.toFixed(2))
      };
    });

    const prompt = `Analiza los siguientes registros de asistencia de un empleado y proporciona un resumen ejecutivo en español. 
    Menciona puntualidad, promedio de horas trabajadas y cualquier anomalía detectada.
    
    Registros:
    ${JSON.stringify(recordsSummary, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un experto en Recursos Humanos y analítica de datos. Tu objetivo es ayudar a optimizar la productividad del equipo analizando sus tiempos de asistencia de forma constructiva.",
        temperature: 0.7
      }
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error AI Service:", error);
    return "Error al conectar con el servicio de IA para el análisis.";
  }
};
