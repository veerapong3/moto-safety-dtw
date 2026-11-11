import Image from "next/image";
import Link from "next/link";
import { PageSplash } from "@/components/page-splash";

const steps = [
  {
    n: 1,
    title: "ข้อมูลส่วนตัวนักเรียน",
    desc: "กรอกตามบัตรนักเรียนให้ตรงทุกช่อง",
    image: "/guide/02-student.png",
    imageAlt: "ตัวอย่างส่วนข้อมูลส่วนตัวนักเรียน",
    items: [
      {
        label: "คำนำหน้า / ชื่อ / นามสกุล",
        tip: "เลือกคำนำหน้าให้ถูกต้อง แล้วพิมพ์ชื่อ–นามสกุลเป็นภาษาไทย",
      },
      {
        label: "เลขประจำตัวนักเรียน",
        tip: "ใส่เฉพาะตัวเลขเท่านั้น ห้ามมีช่องว่างหรือตัวอักษร",
      },
      {
        label: "ระดับชั้นและห้องเรียน",
        tip: "เลือกจากรายการที่ระบบเปิดให้เท่านั้น",
      },
      {
        label: "เบอร์โทรศัพท์ติดต่อ",
        tip: "ใส่ตัวเลข 9–10 หลัก เช่น 0891234567 ไม่ต้องใส่ขีด",
      },
    ],
  },
  {
    n: 2,
    title: "ข้อมูลรถและการใช้งาน",
    desc: "ดูจากป้ายทะเบียนและตัวรถจริงก่อนกรอก",
    image: "/guide/03-bike.png",
    imageAlt: "ตัวอย่างส่วนข้อมูลรถและหมวกนิรภัย",
    items: [
      {
        label: "ยี่ห้อและสีรถ",
        tip: "เลือกจากรายการให้ตรงกับรถที่ใช้มาโรงเรียน",
      },
      {
        label: "หมายเลขทะเบียน",
        tip: "พิมพ์ติดกัน ไม่เว้นวรรค เช่น กข1234 หรือ 1กพ4567 (มีเลขนำหน้าได้อีก 1 หลัก ตามด้วยพยัญชนะไทย 2–3 ตัว และตัวเลข)",
      },
      {
        label: "จังหวัดที่จดทะเบียน",
        tip: "เลือกจังหวัดที่เขียนบนป้ายทะเบียนจริง",
      },
      {
        label: "หมวกนิรภัย",
        tip: "เลือก “มี” หรือ “ไม่มี” ตามความเป็นจริง",
      },
      {
        label: "ชื่อผู้ซ้อนท้ายประจำ",
        tip: "ถ้าไม่มีผู้ซ้อนท้ายประจำ ให้เว้นว่างได้",
      },
    ],
  },
  {
    n: 3,
    title: "รูปหลักฐาน 3 รูป",
    desc: "ต้องอัปโหลดครบทั้ง 3 รูปก่อนกดบันทึก",
    image: "/guide/04-photos.png",
    imageAlt: "ตัวอย่างส่วนอัปโหลดรูปหลักฐาน 3 รูป",
    items: [
      {
        label: "รูปรถจักรยานยนต์",
        tip: "ถ่ายทั้งคันให้เห็นชัด แสงพอ ไม่มืดเกินไป",
      },
      {
        label: "รูปป้ายทะเบียน",
        tip: "ตัวอักษรและตัวเลขต้องอ่านได้ชัด ไม่เบลอ",
      },
      {
        label: "รูปผู้ขับขี่",
        tip: "หน้าตรง ถ้ามีหมวกให้สวมขณะถ่ายได้",
      },
    ],
  },
] as const;

const mistakes = [
  {
    bad: "ทะเบียนมีช่องว่าง เช่น กข 1234",
    good: "พิมพ์ติดกัน กข1234",
  },
  {
    bad: "เบอร์โทรมีขีด เช่น 089-123-4567",
    good: "ใส่เฉพาะตัวเลข 0891234567",
  },
  {
    bad: "อัปโหลดรูปไม่ครบแล้วกดบันทึก",
    good: "รอจนครบ 3/3 และมีเครื่องหมายถูกสีเขียว",
  },
  {
    bad: "ลงทะเบียนทะเบียนซ้ำกับที่มีในระบบแล้ว",
    good: "ตรวจทะเบียนที่หน้าแรกก่อน หากพบแล้วไม่ต้องลงซ้ำ",
  },
] as const;

export default function GuidePage() {
  return (
    <PageSplash label="กำลังโหลดคู่มือ...">
    <div className="mx-auto max-w-5xl space-y-7 pb-20">
      <header className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0b1f4d_0%,#1e40af_55%,#2563eb_100%)] px-7 py-10 text-white shadow-lg shadow-blue-900/20 sm:px-10 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200/90">
          คู่มือนักเรียน · อ่านได้โดยไม่ต้องเข้าสู่ระบบ
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          วิธีกรอกแบบฟอร์ม MOTO-Safety
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-100/90 sm:text-lg">
          อ่านก่อนกรอก 1–2 นาที จะช่วยให้ลงทะเบียนสำเร็จเร็วขึ้น
          และลดโอกาสกรอกผิดหรืออัปโหลดรูปไม่ครบ
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/form"
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-base font-bold text-slate-900 transition hover:bg-amber-300"
          >
            <i className="fa-solid fa-pen-to-square" />
            ไปหน้าลงทะเบียน
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
          >
            <i className="fa-solid fa-magnifying-glass" />
            ตรวจทะเบียนก่อน
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-7 py-6 sm:px-10">
          <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
            ภาพรวมหน้าลงทะเบียน
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            หน้านี้เปิดให้อ่านได้ทุกคน ไม่ต้อง login
          </p>
        </div>
        <div className="bg-slate-50 p-4 sm:p-6">
          <Image
            src="/guide/01-overview.png"
            alt="ภาพรวมหน้าลงทะเบียน MOTO-Safety"
            width={768}
            height={287}
            className="h-auto w-full rounded-3xl border border-slate-200 bg-white shadow-sm"
            priority
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-sm sm:p-10">
        <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
          ก่อนเริ่มกรอก
        </h2>
        <ul className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
          <li className="flex gap-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              1
            </span>
            เตรียมบัตรนักเรียน เบอร์โทรติดต่อ และดูป้ายทะเบียนให้ชัด
          </li>
          <li className="flex gap-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              2
            </span>
            ถ่ายรูปไว้ล่วงหน้า 3 รูป: รถทั้งคัน ป้ายทะเบียน และผู้ขับขี่
          </li>
          <li className="flex gap-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              3
            </span>
            ใช้มือถือหรือคอมพิวเตอร์ที่เชื่อมอินเทอร์เน็ตได้เสถียร
          </li>
          <li className="flex gap-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              4
            </span>
            ถ้าไม่แน่ใจว่ารถลงทะเบียนแล้วหรือยัง ให้ไปหน้าแรกกด “ตรวจสอบข้อมูล” ก่อน
          </li>
        </ul>
      </section>

      {steps.map((step) => (
        <section
          key={step.n}
          className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="flex items-start gap-4 px-7 py-7 sm:px-10">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-700 text-lg font-bold text-white">
              {step.n}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
                {step.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">{step.desc}</p>
            </div>
          </div>

          <div className="bg-slate-50 px-4 pb-4 sm:px-6 sm:pb-6">
            <Image
              src={step.image}
              alt={step.imageAlt}
              width={768}
              height={400}
              className="h-auto w-full rounded-3xl border border-slate-200 bg-white shadow-sm"
            />
          </div>

          <div className="space-y-4 px-7 py-7 sm:px-10">
            {step.items.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-100 bg-slate-50/80 px-5 py-4"
              >
                <p className="text-base font-bold text-slate-800">{item.label}</p>
                <p className="mt-1.5 text-base leading-relaxed text-slate-600">
                  {item.tip}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-[2rem] border border-amber-200/80 bg-amber-50/60 p-7 shadow-sm sm:p-10">
        <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
          <i className="fa-solid fa-triangle-exclamation mr-2 text-amber-500" />
          จุดที่มักกรอกผิด
        </h2>
        <div className="mt-6 space-y-4">
          {mistakes.map((m) => (
            <div
              key={m.bad}
              className="grid gap-3 rounded-3xl border border-amber-100 bg-white px-5 py-4 sm:grid-cols-2"
            >
              <p className="text-base text-rose-700">
                <span className="font-bold">ผิด:</span> {m.bad}
              </p>
              <p className="text-base text-emerald-700">
                <span className="font-bold">ถูก:</span> {m.good}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-sm sm:p-10">
        <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
          หลังกดบันทึกแล้วทำอะไรต่อ
        </h2>
        <ol className="mt-6 list-decimal space-y-3 pl-6 text-base leading-relaxed text-slate-600">
          <li>ถ้าสำเร็จ ระบบจะแจ้ง “ลงทะเบียนสำเร็จ”</li>
          <li>
            กลับหน้าแรก แล้วพิมพ์เลขทะเบียนเดิมอีกครั้งเพื่อยืนยันว่าพบในระบบ
          </li>
          <li>
            หากขึ้นว่า “หมายเลขทะเบียนนี้มีในระบบแล้ว” แปลว่ารถคันนี้ลงทะเบียนไปแล้ว
            ไม่ต้องกรอกซ้ำ
          </li>
          <li>
            หากระบบปิดรับลงทะเบียนชั่วคราว ให้รอประกาศจากโรงเรียนแล้วค่อยกลับมาใหม่
          </li>
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/form"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-base font-bold text-white transition hover:bg-blue-800"
          >
            <i className="fa-solid fa-arrow-right" />
            เริ่มกรอกแบบฟอร์ม
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </section>
    </div>
    </PageSplash>
  );
}
