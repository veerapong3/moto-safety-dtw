/**
 * Seed 5 sample motorcycle registrations via live API (upload + create).
 * Usage: BASE_URL=https://moto-safety-dtw.vercel.app npx tsx scripts/seed-sample-registrations.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Minimal valid JPEG (1x1 pixel) */
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
  "base64",
);

const students = [
  {
    prefix: "เด็กชาย",
    firstName: "สมชาย",
    lastName: "ใจดี",
    studentId: "67001",
    grade: "ม.1",
    room: "1",
    phoneNumber: "0811111111",
    brand: "Honda",
    color: "แดง",
    plateNumber: "กข1234",
    province: "มุกดาหาร",
    helmet: "มี",
    pillionName: "",
  },
  {
    prefix: "เด็กหญิง",
    firstName: "สมหญิง",
    lastName: "รักเรียน",
    studentId: "67002",
    grade: "ม.2",
    room: "2",
    phoneNumber: "0822222222",
    brand: "Yamaha",
    color: "น้ำเงิน",
    plateNumber: "ขค2345",
    province: "มุกดาหาร",
    helmet: "มี",
    pillionName: "น้องชาย",
  },
  {
    prefix: "นาย",
    firstName: "วิชัย",
    lastName: "มานะ",
    studentId: "67003",
    grade: "ม.4",
    room: "3",
    phoneNumber: "0833333333",
    brand: "GPX",
    color: "ดำ",
    plateNumber: "คง3456",
    province: "นครพนม",
    helmet: "ไม่มี",
    pillionName: "",
  },
  {
    prefix: "นางสาว",
    firstName: "อรทัย",
    lastName: "สุขใจ",
    studentId: "67004",
    grade: "ม.5",
    room: "1",
    phoneNumber: "0844444444",
    brand: "Suzuki",
    color: "ขาว",
    plateNumber: "งจ4567",
    province: "มุกดาหาร",
    helmet: "มี",
    pillionName: "",
  },
  {
    prefix: "นาย",
    firstName: "ธนกฤต",
    lastName: "พากเพียร",
    studentId: "67005",
    grade: "ม.6",
    room: "4",
    phoneNumber: "0855555555",
    brand: "Vespa",
    color: "เทา",
    plateNumber: "จฉ5678",
    province: "สกลนคร",
    helmet: "มี",
    pillionName: "เพื่อน",
  },
] as const;

async function upload(kind: string, label: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", new Blob([JPEG], { type: "image/jpeg" }), `${kind}.jpg`);
  fd.append("kind", kind);
  fd.append("label", label);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(`upload ${kind}: ${data.error || res.status}`);
  return data.fileId as string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createOne(s: (typeof students)[number]) {
  const bikeFileId = await upload("bike", `${s.studentId}_bike`);
  await sleep(1500);
  const plateFileId = await upload("plate", `${s.studentId}_plate`);
  await sleep(1500);
  const riderFileId = await upload("rider", `${s.studentId}_rider`);
  await sleep(1500);

  const res = await fetch(`${BASE}/api/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...s, bikeFileId, plateFileId, riderFileId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`create ${s.studentId}: ${data.error || res.status}`);
  return data.item?.id as string;
}

async function main() {
  console.log("BASE_URL =", BASE);
  const ids: string[] = [];
  for (const s of students) {
    const check = await fetch(
      `${BASE}/api/registrations/check-plate?q=${encodeURIComponent(s.plateNumber)}`,
    ).then((r) => r.json());
    if (check.exists) {
      console.log("SKIP exists", s.studentId, s.plateNumber);
      continue;
    }
    let attempt = 0;
    for (;;) {
      try {
        const id = await createOne(s);
        ids.push(id);
        console.log("OK", s.studentId, s.firstName, id);
        break;
      } catch (err) {
        attempt++;
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt >= 4 || !/Quota|rate/i.test(msg)) throw err;
        console.warn("retry", s.studentId, msg);
        await sleep(45000);
      }
    }
    await sleep(3000);
  }
  const stats = await fetch(`${BASE}/api/dashboard/stats`).then((r) => r.json());
  console.log("stats", stats);
  console.log("created", ids.length, "new records");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
