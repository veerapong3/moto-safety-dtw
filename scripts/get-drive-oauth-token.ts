/**
 * ขอ refresh token จากบัญชีเจ้าของโฟลเดอร์ MOTO-Safety (เช่น academic@dontanwit.ac.th)
 *
 * เตรียมใน Google Cloud Console:
 * 1) APIs & Services → Credentials → Create OAuth client ID
 * 2) Application type: Desktop app
 * 3) คัดลอก Client ID / Client Secret ใส่ .env.local
 *
 * รัน:
 *   npx tsx scripts/get-drive-oauth-token.ts
 */
import http from "http";
import { spawn } from "child_process";
import { URL } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";

function openBrowser(url: string) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  spawn(cmd, [url], { stdio: "ignore", detached: true }).unref();
}

dotenv.config({ path: ".env.local" });

const PORT = 3456;
const REDIRECT = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

async function main() {
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    console.error(
      "ใส่ GOOGLE_DRIVE_OAUTH_CLIENT_ID และ GOOGLE_DRIVE_OAUTH_CLIENT_SECRET ใน .env.local ก่อน",
    );
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\nเปิดเบราว์เซอร์เพื่อเข้าสู่ระบบด้วยบัญชีเจ้าของโฟลเดอร์ MOTO-Safety");
  console.log("(เช่น academic@dontanwit.ac.th)\n");
  console.log(authUrl, "\n");

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url?.startsWith("/oauth2callback")) {
          res.writeHead(404);
          res.end();
          return;
        }
        const u = new URL(req.url, REDIRECT);
        const err = u.searchParams.get("error");
        if (err) throw new Error(err);
        const c = u.searchParams.get("code");
        if (!c) throw new Error("ไม่พบ code");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>เชื่อมต่อ Drive สำเร็จ</h1><p>กลับไปที่เทอร์มินัลได้เลย ปิดหน้านี้ได้</p>",
        );
        server.close();
        resolve(c);
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
        server.close();
        reject(e);
      }
    });
    server.listen(PORT, "127.0.0.1", () => {
      try {
        openBrowser(authUrl);
      } catch {
        console.log("เปิดเบราว์เซอร์เองไม่สำเร็จ — คัดลอกลิงก์ด้านบนไปเปิดเอง");
      }
    });
  });

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "ไม่ได้รับ refresh_token — ลบสิทธิ์แอปใน https://myaccount.google.com/permissions แล้วรันใหม่",
    );
    process.exit(1);
  }

  oauth2.setCredentials(tokens);
  let email = "(unknown)";
  try {
    const oauth2api = google.oauth2({ version: "v2", auth: oauth2 });
    const me = await oauth2api.userinfo.get();
    email = me.data.email || email;
  } catch {
    // userinfo optional — refresh token is what matters for Drive uploads
  }

  console.log("\n✅ สำเร็จ");
  console.log("บัญชี:", email);
  console.log("\nใส่ค่านี้ใน .env.local และ Vercel:\n");
  console.log(`GOOGLE_DRIVE_OAUTH_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=${clientSecret}`);
  console.log(`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("");

  // Persist into .env.local automatically
  try {
    const fs = await import("fs");
    const path = ".env.local";
    let text = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
    const upsert = (key: string, val: string) => {
      const re = new RegExp(`^${key}=.*$`, "m");
      const line = `${key}=${val}`;
      text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
    };
    upsert("GOOGLE_DRIVE_OAUTH_CLIENT_ID", clientId);
    upsert("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET", clientSecret);
    upsert("GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN", tokens.refresh_token);
    fs.writeFileSync(path, text);
    console.log("อัปเดต .env.local แล้ว\n");
  } catch (e) {
    console.warn("เขียน .env.local ไม่สำเร็จ:", e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
