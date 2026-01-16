
export interface Employee {
  id: string;
  name: string;
  role: string;
  photo: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: string; // ISO String
  date: string; // YYYY-MM-DD
  type: 'ENTRADA' | 'SALIDA';
  location: {
    lat: number;
    lng: number;
  };
}

export interface OfficeLocation {
  lat: number;
  lng: number;
  radius: number; // in meters
  address: string;
}

export type ViewType = 'scanner' | 'dashboard' | 'history' | 'settings' | 'onboarding';

export interface AppConfig {
  companyName: string;
  logoUrl: string;
  employees: Employee[];
}
