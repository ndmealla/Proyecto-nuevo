
import { Employee, OfficeLocation } from './types';

// Ubicación de la oficina por defecto (ejemplo)
export const DEFAULT_OFFICE: OfficeLocation = {
  lat: -34.6037, // Buenos Aires
  lng: -58.3816,
  radius: 100, // 100 metros de tolerancia
  address: "Av. Corrientes 1234, CABA"
};

export const MOCK_EMPLOYEE: Employee = {
  id: "EMP-001",
  name: "Juan Pérez",
  role: "Desarrollador Senior",
  photo: "https://picsum.photos/seed/juan/200"
};

export const STORAGE_KEYS = {
  RECORDS: 'checkin_pro_records',
  OFFICE: 'checkin_pro_office_location',
  USER: 'checkin_pro_user'
};
