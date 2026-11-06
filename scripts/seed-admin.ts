/**
 * Seed the first admin user into the Users sheet.
 *
 * Usage:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=changeme ADMIN_NAME="ผู้ดูแลระบบ" npm run seed:admin
 *
 * Requires env: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, AUTH_SECRET
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { google } from "googleapis";
import { randomUUID } from "crypto";

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    throw new Error("ตั้ง ADMIN_PASSWORD ใน env ก่อนรัน seed (ห้ามใช้รหัสผ่านเริ่มต้น)");
  }
  const displayName = process.env.ADMIN_NAME || "ผู้ดูแลระบบ";

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
    range: "Users!A:B",
  });
  const rows = existing.data.values || [];
  const found = rows.slice(1).some(
    (r) => String(r[1] || "").toLowerCase() === username.toLowerCase(),
  );
  if (found) {
    console.log(`User "${username}" already exists. Skip.`);
    return;
  }

  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Users!A1:H1",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            "id",
            "username",
            "password_hash",
            "display_name",
            "role",
            "active",
            "created_at",
            "created_by",
          ],
        ],
      },
    });
  }

  const hash = await bcrypt.hash(password, 10);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Users!A:H",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          randomUUID(),
          username,
          hash,
          displayName,
          "admin",
          "true",
          new Date().toISOString(),
          "seed",
        ],
      ],
    },
  });

  console.log(`Created admin user: ${username}`);
  console.log(`Password: ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
