export type UserRole = "admin" | "viewer";

export type HelmetStatus = "มี" | "ไม่มี";

export type RegistrationStatus = "active" | "deleted";

export type ImageKind = "bike" | "plate" | "rider";

export interface User {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  created_by: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface Registration {
  id: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  prefix: string;
  first_name: string;
  last_name: string;
  student_id: string;
  grade: string;
  room: string;
  phone: string;
  brand: string;
  color: string;
  plate_number: string;
  province: string;
  helmet: HelmetStatus;
  pillion_name: string;
  bike_file_id: string;
  plate_file_id: string;
  rider_file_id: string;
  status: RegistrationStatus;
  academic_year: string;
  notes: string;
}

export interface PublicConfig {
  registrationOpen: boolean;
  closedMessage: string;
  grades: string[];
  rooms: string[];
  brands: string[];
  colors: string[];
  sampleBikeUrl: string;
  samplePlateUrl: string;
  sampleRiderUrl: string;
  schoolName: string;
  appTitle: string;
  contactEmail: string;
  academicYear: string;
  semester: string;
}

export interface DashboardStats {
  total: number;
  junior: number;
  senior: number;
  helmetYes: number;
  helmetNo: number;
  helmetRate: number;
  byGrade: Record<string, number>;
}

export const USERS_HEADERS = [
  "id",
  "username",
  "password_hash",
  "display_name",
  "role",
  "active",
  "created_at",
  "created_by",
] as const;

export const REGISTRATIONS_HEADERS = [
  "id",
  "created_at",
  "updated_at",
  "updated_by",
  "prefix",
  "first_name",
  "last_name",
  "student_id",
  "grade",
  "room",
  "phone",
  "brand",
  "color",
  "plate_number",
  "province",
  "helmet",
  "pillion_name",
  "bike_file_id",
  "plate_file_id",
  "rider_file_id",
  "status",
  "academic_year",
  "notes",
] as const;

export const SETTINGS_HEADERS = ["key", "value"] as const;
