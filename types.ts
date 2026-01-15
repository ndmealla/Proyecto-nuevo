
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
  checkIn: string; // ISO String
  checkOut?: string; // ISO String
  date: string; // YYYY-MM-DD
  location: {
    lat: number;
    lng: number;
    accuracy: number;
  };
}

export interface OfficeLocation {
  lat: number;
  lng: number;
  radius: number; // in meters
  address: string;
}

export type ViewType = 'scanner' | 'dashboard' | 'history' | 'settings';
