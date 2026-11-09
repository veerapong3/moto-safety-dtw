/**
 * Reset admin password hash in Users sheet.
 *
 * Usage:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=dtw1234 npx tsx scripts/reset-admin-password.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { google } from "googleapis";

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!password) {
    throw new Error("ต้องมี ADMIN_PASSWORD ใน env");
  }
  if (!email || !privateKey || !sheetId) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEET_ID",
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Users!A:H",
  });
  const rows = existing.data.values || [];
  if (rows.length <= 1) {
    throw new Error("ยังไม่มีผู้ใช้ในชีต Users — รัน seed:admin ก่อน");
  }

  const header = rows[0].map((h) => String(h || "").toLowerCase());
  const usernameCol = header.indexOf("username");
  const hashCol = header.indexOf("password_hash");
  if (usernameCol < 0 || hashCol < 0) {
    throw new Error("ชีต Users ไม่มีคอลัมน์ username / password_hash");
  }

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][usernameCol] || "").toLowerCase() === username.toLowerCase()) {
      rowIndex = i;
      break;
    }
  }
  if (rowIndex < 0) {
    throw new Error(`ไม่พบผู้ใช้ "${username}"`);
  }

  const hash = await bcrypt.hash(password, 10);
  const sheetRow = rowIndex + 1;
  const colLetter = String.fromCharCode("A".charCodeAt(0) + hashCol);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `Users!${colLetter}${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[hash]] },
  });

  console.log(`Updated password for "${username}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
