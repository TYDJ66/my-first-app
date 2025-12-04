export interface Student {
  id: string;
  name: string;
  studentId: string;
  photoUrl: string; // Base64 string of the registered face
  registeredAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  name: string;
  timestamp: string;
  photoUrl: string; // Snapshot at moment of sign-in
  status: 'Present' | 'Late' | 'Duplicate';
}

export enum Page {
  DASHBOARD = 'dashboard',
  USERS = 'users',
  REGISTER = 'register',
  SIGN_IN = 'signin',
  RECORDS = 'records',
  REPORT = 'report'
}