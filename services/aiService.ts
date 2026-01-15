
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord } from "../types";

export const analyzeAttendance = async (records: AttendanceRecord[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const recordsSummary = records.map(r => ({
      fecha: r.date,
      entrada: r.checkIn,
      salida: r.checkOut || 'Sin salida registrada',
      horas: r.checkOut 
        ? (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60) 
        : 0
    }));

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
