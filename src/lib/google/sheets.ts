import { cacheDelete, cacheGet, cacheSet } from "@/lib/cache";
import { getSheetId, getSheetsClient } from "@/lib/google/auth-sa";
import type {
  DashboardStats,
  HelmetStatus,
  PublicConfig,
  Registration,
  RegistrationStatus,
  User,
  UserRole,
} from "@/lib/types";
import { REGISTRATIONS_HEADERS, USERS_HEADERS } from "@/lib/types";

type SheetName = "Users" | "Registrations" | "Settings";

/** Short in-memory TTL — cuts repeat Sheets reads on the same serverless instance. */
const SHEET_TTL_MS: Record<SheetName, number> = {
  Users: 30_000,
  Settings: 60_000,
  Registrations: 20_000,
};

function bool(v: string | undefined): boolean {
  return String(v ?? "").toLowerCase() === "true" || v === "1";
}

/**
 * Google Sheets often coerces digit-only values into numbers and drops
 * leading zeros (common with Thai phone numbers like 0812345678).
 * Prefixing with ' and using USER_ENTERED stores them as plain text.
 */
function asSheetText(value: string): string {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return v.startsWith("'") ? v : `'${v}`;
}

function fromSheetText(value: string): string {
  return String(value ?? "")
    .replace(/^'+/, "")
    .trim();
}

/** Normalize Thai phone; restore a missing leading 0 when possible. */
export function normalizeThaiPhone(value: string): string {
  const digits = fromSheetText(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0") && (digits.length === 9 || digits.length === 10)) {
    return digits;
  }
  // Mobile without leading 0 → 9 digits starting 6/8/9
  if (digits.length === 9 && /^[689]/.test(digits)) {
    return `0${digits}`;
  }
  // Landline without leading 0 → 8 digits
  if (digits.length === 8 && /^[2-7]/.test(digits)) {
    return `0${digits}`;
  }
  return digits;
}

function normalizeStudentId(value: string): string {
  const raw = fromSheetText(value);
  const digits = raw.replace(/\D/g, "");
  return digits || raw;
}

/**
 * Force Google Sheets to store a value as text so leading zeros
 * (Thai phone numbers like 0812345678) are not stripped.
 */
function asSheetText(value: string): string {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return v.startsWith("'") ? v : `'${v}`;
}

function fromSheetText(value: string): string {
  return String(value ?? "")
    .replace(/^'/, "")
    .trim();
}

/** Restore a Thai phone if Sheets previously dropped the leading 0. */
function normalizeThaiPhone(value: string): string {
  let phone = fromSheetText(value).replace(/\D/g, "");
  // Mobile without leading 0 → 9 digits starting with 6/8/9
  if (/^[689]\d{8}$/.test(phone)) phone = `0${phone}`;
  return phone;
}

function rowsToObjects<T extends string>(
  headers: readonly T[],
  rows: string[][],
): Record<T, string>[] {
  return rows.map((row) => {
    const obj = {} as Record<T, string>;
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

function sheetCacheKey(sheet: SheetName) {
  return `sheet:${sheet}`;
}

function invalidateSheet(sheet: SheetName) {
  cacheDelete(sheetCacheKey(sheet));
  cacheDelete("dashboard:stats");
  cacheDelete("public:config");
}

async function getValues(sheet: SheetName): Promise<string[][]> {
  const key = sheetCacheKey(sheet);
  const cached = cacheGet<string[][]>(key);
  if (cached) return cached;

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${sheet}!A:Z`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  const values = (res.data.values as string[][] | undefined) ?? [];
  cacheSet(key, values, SHEET_TTL_MS[sheet]);
  return values;
}

async function appendRow(
  sheet: SheetName,
  values: string[],
  valueInputOption: "RAW" | "USER_ENTERED" = "RAW",
) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${sheet}!A:Z`,
    valueInputOption,
    requestBody: { values: [values] },
  });
  invalidateSheet(sheet);
}

async function updateRow(
  sheet: SheetName,
  rowIndex1Based: number,
  values: string[],
  valueInputOption: "RAW" | "USER_ENTERED" = "RAW",
) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${sheet}!A${rowIndex1Based}:Z${rowIndex1Based}`,
    valueInputOption,
    requestBody: { values: [values] },
  });
  invalidateSheet(sheet);
}

async function deleteRow(sheet: SheetName, rowIndex1Based: number) {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: getSheetId(),
  });
  const sheetMeta = meta.data.sheets?.find(
    (s) => s.properties?.title === sheet,
  );
  const sheetId = sheetMeta?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) {
    throw new Error(`Sheet ${sheet} not found`);
  }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex1Based - 1,
              endIndex: rowIndex1Based,
            },
          },
        },
      ],
    },
  });
  invalidateSheet(sheet);
}

function findRowIndex(values: string[][], id: string): number {
  for (let i = 1; i < values.length; i++) {
    if (values[i]?.[0] === id) return i + 1;
  }
  return -1;
}

function csvList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ---------- Users ---------- */

function mapUser(r: Record<(typeof USERS_HEADERS)[number], string>): User {
  return {
    id: r.id,
    username: r.username,
    password_hash: r.password_hash,
    display_name: r.display_name,
    role: (r.role as UserRole) || "viewer",
    active: bool(r.active),
    created_at: r.created_at,
    created_by: r.created_by,
  };
}

export async function listUsers(): Promise<User[]> {
  const values = await getValues("Users");
  if (values.length <= 1) return [];
  return rowsToObjects(USERS_HEADERS, values.slice(1)).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await listUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  const users = await listUsers();
  return (
    users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    ) ?? null
  );
}

/* ---------- Settings ---------- */

export async function getSettingsMap(): Promise<Record<string, string>> {
  const values = await getValues("Settings");
  const map: Record<string, string> = {};
  for (const row of values.slice(1)) {
    if (row[0]) map[row[0]] = row[1] ?? "";
  }
  return map;
}

export async function getSetting(key: string): Promise<string> {
  const map = await getSettingsMap();
  return map[key] ?? "";
}

export async function setSetting(key: string, value: string) {
  const values = await getValues("Settings");
  for (let i = 1; i < values.length; i++) {
    if (values[i]?.[0] === key) {
      await updateRow("Settings", i + 1, [key, value]);
      return;
    }
  }
  await appendRow("Settings", [key, value]);
}

export async function setSettings(entries: Record<string, string>) {
  for (const [key, value] of Object.entries(entries)) {
    await setSetting(key, value);
  }
}

export async function getDriveRootFolderId(): Promise<string> {
  const fromSheet = await getSetting("DRIVE_ROOT_FOLDER_ID");
  const fromEnv = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim() || "";
  const id = fromSheet || fromEnv;
  if (!id) throw new Error("ยังไม่ได้ตั้งค่า DRIVE_ROOT_FOLDER_ID");
  return id;
}

function defaultSemester(): string {
  const month = new Date().getMonth() + 1;
  // ภาคเรียนที่ 1 โดยทั่วไป พ.ค.–ต.ค. · ภาคเรียนที่ 2 พ.ย.–เม.ย.
  return month >= 5 && month <= 10 ? "1" : "2";
}

export async function getPublicConfig(): Promise<PublicConfig> {
  const cached = cacheGet<PublicConfig>("public:config");
  if (cached) return cached;

  const map = await getSettingsMap();
  const openRaw = map.REGISTRATION_OPEN ?? "true";
  const registrationOpen =
    openRaw.toUpperCase() === "ON" ||
    openRaw.toLowerCase() === "true" ||
    openRaw === "1";

  const config: PublicConfig = {
    registrationOpen,
    closedMessage:
      map.CLOSED_MESSAGE ||
      "ขณะนี้ระบบปิดรับข้อมูลชั่วคราว เพื่อสรุปสถิติหรือปรับปรุงฐานข้อมูล",
    grades: csvList(map.GRADES || "ม.1,ม.2,ม.3,ม.4,ม.5,ม.6"),
    rooms: csvList(map.ROOMS || "1,2,3,4,5,6,7"),
    brands: csvList(
      map.BRANDS || "Honda,Yamaha,Suzuki,Vespa,GPX,Ryuka,อื่นๆ",
    ),
    colors: csvList(
      map.COLORS || "แดง,น้ำเงิน,ดำ,ขาว,เทา,เหลือง,เขียว,หลายสี/อื่นๆ",
    ),
    sampleBikeUrl: map.SAMPLE_BIKE_FILE_ID
      ? `/api/files/${map.SAMPLE_BIKE_FILE_ID}`
      : "/samples/bike.jpg",
    samplePlateUrl: map.SAMPLE_PLATE_FILE_ID
      ? `/api/files/${map.SAMPLE_PLATE_FILE_ID}`
      : "/samples/plate.jpg",
    sampleRiderUrl: map.SAMPLE_RIDER_FILE_ID
      ? `/api/files/${map.SAMPLE_RIDER_FILE_ID}`
      : "/samples/rider.jpg",
    schoolName: map.SCHOOL_NAME || "โรงเรียนดอนตาลวิทยา",
    appTitle: map.APP_TITLE || "MOTO-Safety DTW_School",
    contactEmail: map.CONTACT_EMAIL || "",
    academicYear:
      map.CURRENT_ACADEMIC_YEAR || String(new Date().getFullYear() + 543),
    semester: map.CURRENT_SEMESTER || defaultSemester(),
  };
  cacheSet("public:config", config, 60_000);
  return config;
}

/* ---------- Registrations ---------- */

function mapRegistration(
  r: Record<(typeof REGISTRATIONS_HEADERS)[number], string>,
): Registration {
  return {
    id: r.id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    updated_by: r.updated_by,
    prefix: r.prefix,
    first_name: r.first_name,
    last_name: r.last_name,
    student_id: normalizeStudentId(r.student_id),
    grade: r.grade,
    room: r.room,
    phone: normalizeThaiPhone(r.phone),
    brand: r.brand,
    color: r.color,
    plate_number: r.plate_number,
    province: r.province,
    helmet: (r.helmet as HelmetStatus) || "ไม่มี",
    pillion_name: r.pillion_name || "-",
    bike_file_id: r.bike_file_id,
    plate_file_id: r.plate_file_id,
    rider_file_id: r.rider_file_id,
    status: (r.status as RegistrationStatus) || "active",
    academic_year: r.academic_year,
    notes: r.notes,
  };
}

function registrationToRow(reg: Registration): string[] {
  return REGISTRATIONS_HEADERS.map((h) => {
    const raw = String(reg[h] ?? "");
    // Keep leading zeros for phone / student id by forcing text cells.
    if (h === "phone") return asSheetText(normalizeThaiPhone(raw));
    if (h === "student_id") return asSheetText(normalizeStudentId(raw));
    return raw;
  });
}

export async function listRegistrations(opts?: {
  includeDeleted?: boolean;
}): Promise<Registration[]> {
  const values = await getValues("Registrations");
  if (values.length <= 1) return [];
  const rows = rowsToObjects(REGISTRATIONS_HEADERS, values.slice(1)).map(
    mapRegistration,
  );
  if (opts?.includeDeleted) return rows;
  return rows.filter((r) => r.status !== "deleted");
}

export async function getRegistrationById(
  id: string,
): Promise<Registration | null> {
  const rows = await listRegistrations({ includeDeleted: true });
  return rows.find((r) => r.id === id) ?? null;
}

export async function findRegistrationByPlate(
  plateNumber: string,
): Promise<Registration | null> {
  const target = plateNumber.replace(/\s+/g, "").toLowerCase();
  const rows = await listRegistrations();
  return (
    rows.find(
      (r) => r.plate_number.replace(/\s+/g, "").toLowerCase() === target,
    ) ?? null
  );
}

export async function createRegistration(
  input: Omit<Registration, "id" | "created_at" | "updated_at" | "status"> & {
    id?: string;
  },
): Promise<Registration> {
  const now = new Date().toISOString();
  const id =
    input.id ||
    `MOTO-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const reg: Registration = {
    ...input,
    id,
    created_at: now,
    updated_at: now,
    status: "active",
    pillion_name: input.pillion_name || "-",
  };
  await appendRow("Registrations", registrationToRow(reg), "USER_ENTERED");
  return reg;
}

export async function updateRegistration(
  id: string,
  patch: Partial<Registration>,
): Promise<Registration> {
  const values = await getValues("Registrations");
  const rowIndex = findRowIndex(values, id);
  if (rowIndex < 0) throw new Error("ไม่พบข้อมูลที่ต้องการแก้ไข");

  const current = mapRegistration(
    rowsToObjects(REGISTRATIONS_HEADERS, [values[rowIndex - 1]])[0],
  );
  const next: Registration = {
    ...current,
    ...patch,
    id: current.id,
    created_at: current.created_at,
    updated_at: new Date().toISOString(),
  };
  await updateRow(
    "Registrations",
    rowIndex,
    registrationToRow(next),
    "USER_ENTERED",
  );
  return next;
}

export async function deleteRegistration(id: string): Promise<Registration> {
  const values = await getValues("Registrations");
  const rowIndex = findRowIndex(values, id);
  if (rowIndex < 0) throw new Error("ไม่พบข้อมูลที่ต้องการลบ");
  const current = mapRegistration(
    rowsToObjects(REGISTRATIONS_HEADERS, [values[rowIndex - 1]])[0],
  );
  await deleteRow("Registrations", rowIndex);
  return current;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const cached = cacheGet<DashboardStats>("dashboard:stats");
  if (cached) return cached;

  const rows = await listRegistrations();
  const byGrade: Record<string, number> = {
    "ม.1": 0,
    "ม.2": 0,
    "ม.3": 0,
    "ม.4": 0,
    "ม.5": 0,
    "ม.6": 0,
  };
  let junior = 0;
  let senior = 0;
  let helmetYes = 0;
  let helmetNo = 0;

  for (const row of rows) {
    if (["ม.1", "ม.2", "ม.3"].includes(row.grade)) junior++;
    else if (["ม.4", "ม.5", "ม.6"].includes(row.grade)) senior++;
    if (row.helmet === "มี") helmetYes++;
    else helmetNo++;
    if (row.grade in byGrade) byGrade[row.grade]++;
  }

  const total = rows.length;
  const stats: DashboardStats = {
    total,
    junior,
    senior,
    helmetYes,
    helmetNo,
    helmetRate: total > 0 ? Number(((helmetYes / total) * 100).toFixed(1)) : 0,
    byGrade,
  };
  cacheSet("dashboard:stats", stats, 20_000);
  return stats;
}

