/**
 * Create sheet tabs + header rows if missing.
 * Usage: npm run init:sheets
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { google } from "googleapis";

const TABS: Record<string, string[]> = {
  Users: [
    "id",
    "username",
    "password_hash",
    "display_name",
    "role",
    "active",
    "created_at",
    "created_by",
  ],
  Registrations: [
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
  ],
  Settings: ["key", "value"],
};

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !privateKey || !sheetId) {
    throw new Error("Missing Google env vars");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existing = new Set(
    (meta.data.sheets || []).map((s) => s.properties?.title || ""),
  );

  const requests = Object.keys(TABS)
    .filter((title) => !existing.has(title))
    .map((title) => ({
      addSheet: { properties: { title } },
    }));

  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests },
    });
    console.log(
      "Created sheets:",
      requests.map((r) => r.addSheet.properties.title),
    );
  }

  for (const [title, headers] of Object.entries(TABS)) {
    const values = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${title}!A1:Z1`,
    });
    if (!values.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${title}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
      console.log(`Wrote headers: ${title}`);
    } else {
      console.log(`Headers exist: ${title}`);
    }
  }

  const defaults: [string, string][] = [
    ["REGISTRATION_OPEN", "true"],
    ["GRADES", "ม.1,ม.2,ม.3,ม.4,ม.5,ม.6"],
    ["ROOMS", "1,2,3,4,5,6,7"],
    ["BRANDS", "Honda,Yamaha,Suzuki,Vespa,GPX,Ryuka,อื่นๆ"],
    ["COLORS", "แดง,น้ำเงิน,ดำ,ขาว,เทา,เหลือง,เขียว,หลายสี/อื่นๆ"],
    ["APP_TITLE", "MOTO-Safety DTW_School"],
    ["SCHOOL_NAME", "โรงเรียนดอนตาลวิทยา"],
    [
      "CLOSED_MESSAGE",
      "ขณะนี้ระบบปิดรับข้อมูลชั่วคราว เพื่อสรุปสถิติหรือปรับปรุงฐานข้อมูล",
    ],
  ];

  if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    defaults.unshift([
      "DRIVE_ROOT_FOLDER_ID",
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    ]);
  }

  const settings = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Settings!A:B",
  });
  const rows = settings.data.values || [];
  const keys = new Set(rows.slice(1).map((r) => r[0]));
  const toAppend = defaults.filter(([k]) => !keys.has(k));
  if (toAppend.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Settings!A:B",
      valueInputOption: "RAW",
      requestBody: { values: toAppend },
    });
    console.log("Seeded Settings defaults");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
