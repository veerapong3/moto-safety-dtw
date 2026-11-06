/**
 * Create a new Spreadsheet + Drive root folder for MOTO-Safety,
 * share with the Service Account, and write IDs back into .env.local
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync, writeFileSync } from "fs";
import { google } from "googleapis";

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN?.trim();

  if (!email || !privateKey) throw new Error("Missing SA credentials");
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Drive OAuth credentials");
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const drive = google.drive({ version: "v3", auth: oauth2 });
  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  // 1) Drive folder
  const folderRes = await drive.files.create({
    requestBody: {
      name: "MOTO-SafetyDTW",
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id, name, webViewLink",
  });
  const folderId = folderRes.data.id;
  if (!folderId) throw new Error("Failed to create Drive folder");
  console.log("Drive folder:", folderId);

  // Share folder with SA
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: "user",
      role: "writer",
      emailAddress: email,
    },
    sendNotificationEmail: false,
  });
  console.log("Shared folder with SA:", email);

  // 2) Spreadsheet
  const ss = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: "MOTO-Safety DTW" },
      sheets: [{ properties: { title: "Users" } }],
    },
    fields: "spreadsheetId,spreadsheetUrl",
  });
  const sheetId = ss.data.spreadsheetId;
  if (!sheetId) throw new Error("Failed to create Spreadsheet");
  console.log("Spreadsheet:", sheetId);
  console.log("URL:", ss.data.spreadsheetUrl);

  // Move spreadsheet into folder (optional convenience)
  try {
    const file = await drive.files.get({
      fileId: sheetId,
      fields: "parents",
    });
    const prev = file.data.parents || [];
    await drive.files.update({
      fileId: sheetId,
      addParents: folderId,
      removeParents: prev.join(","),
      fields: "id, parents",
    });
  } catch (e) {
    console.warn("Could not move sheet into folder:", e);
  }

  await drive.permissions.create({
    fileId: sheetId,
    requestBody: {
      type: "user",
      role: "writer",
      emailAddress: email,
    },
    sendNotificationEmail: false,
  });
  console.log("Shared spreadsheet with SA");

  // 3) Patch .env.local
  const envPath = ".env.local";
  let env = readFileSync(envPath, "utf8");
  env = env.replace(/^GOOGLE_SHEET_ID=.*$/m, `GOOGLE_SHEET_ID=${sheetId}`);
  env = env.replace(
    /^GOOGLE_DRIVE_ROOT_FOLDER_ID=.*$/m,
    `GOOGLE_DRIVE_ROOT_FOLDER_ID=${folderId}`,
  );
  writeFileSync(envPath, env);
  console.log("Updated .env.local with Sheet + Drive IDs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
