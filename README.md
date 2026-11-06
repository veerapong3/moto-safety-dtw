# MOTO-Safety DTW

ระบบสารสนเทศความปลอดภัยรถจักรยานยนต์นักเรียน  
**Google Sheets** = ฐานข้อมูล · **Google Drive** = รูปภาพ · โฮสต์บน **Vercel**

## คุณสมบัติ

- ลงทะเบียนสาธารณะ (ข้อมูลนักเรียน + รถ + หมวก + รูป 3 ใบ)
- Dashboard สถิติ + กราฟ + ตรวจทะเบียน (ไม่เปิดเผย PII)
- แอดมิน: JWT login, CRUD, เปิด/ปิดรับลงทะเบียน, ตั้งค่า dropdown / รูปตัวอย่าง
- หน้าปิดระบบเมื่อ `REGISTRATION_OPEN=false`

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + sonner
- Google Sheets API + Google Drive API (Service Account + Drive OAuth)
- JWT session cookie (`jose`) + bcrypt

## Setup

1. คัดลอก `.env.example` → `.env.local` แล้วใส่ค่า Google / `AUTH_SECRET`
2. แชร์ Spreadsheet + โฟลเดอร์ Drive ให้ Service Account เป็น Editor
3. ติดตั้งและเตรียมชีต:

```bash
npm install
npm run init:sheets
npm run seed:admin
npm run oauth:drive   # ถ้าจะอัปรูปเข้า Drive
npm run dev
```

4. Deploy: push GitHub → Import Vercel → ใส่ Environment Variables

รายละเอียด schema: [docs/SHEET_SCHEMA.md](docs/SHEET_SCHEMA.md)

## หมายเหตุ

- Vercel Hobby จำกัด body ~4.5MB — ฟอร์มบีบอัดรูปฝั่ง client ก่อนอัป
- Service Account อัป My Drive ไม่ได้ (quota 0) — ใช้ Drive OAuth ของบัญชีเจ้าของโฟลเดอร์
