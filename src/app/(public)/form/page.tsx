"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { compressImageFile } from "@/lib/image-client";
import { timedFetch } from "@/lib/perf-client";
import { swalError, swalSuccess, swalWarning } from "@/lib/swal";
import type { PublicConfig } from "@/lib/types";
import { THAI_PROVINCES } from "@/lib/validations";

type ImgKey = "bike" | "plate" | "rider";

export default function FormPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<ImgKey | null>(null);
  const [previews, setPreviews] = useState<Record<ImgKey, string>>({
    bike: "",
    plate: "",
    rider: "",
  });
  const [fileIds, setFileIds] = useState<Record<ImgKey, string>>({
    bike: "",
    plate: "",
    rider: "",
  });

  useEffect(() => {
    timedFetch("/api/config")
      .then((r) => r.json())
      .then((c: PublicConfig) => {
        if (!c.registrationOpen) {
          router.replace("/system-closed");
          return;
        }
        setConfig(c);
        setPreviews({
          bike: c.sampleBikeUrl || "",
          plate: c.samplePlateUrl || "",
          rider: c.sampleRiderUrl || "",
        });
      })
      .catch(() => toast.error("โหลดการตั้งค่าไม่สำเร็จ"));
  }, [router]);

  async function onPick(key: ImgKey, file: File | null) {
    if (!file) return;
    setUploading(key);
    try {
      const blob = await compressImageFile(file, 800, 0.8);
      const previewUrl = URL.createObjectURL(blob);
      setPreviews((p) => ({ ...p, [key]: previewUrl }));

      const fd = new FormData();
      fd.append("file", blob, `${key}.jpg`);
      fd.append("kind", key);
      fd.append("label", key);
      const res = await timedFetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "อัปโหลดไม่สำเร็จ");
        await swalError("อัปโหลดไม่สำเร็จ", data.error || "ลองเลือกรูปใหม่");
        return;
      }
      setFileIds((f) => ({ ...f, [key]: data.fileId }));
      const label =
        key === "bike" ? "รถ" : key === "plate" ? "ป้ายทะเบียน" : "ผู้ขับขี่";
      toast.success(`อัปโหลดรูป${label}แล้ว`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ";
      toast.error(msg);
      await swalError("อัปโหลดไม่สำเร็จ", msg);
    } finally {
      setUploading(null);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileIds.bike || !fileIds.plate || !fileIds.rider) {
      toast.warning("กรุณาเลือกรูปภาพให้ครบถ้วนทั้ง 3 รูป");
      await swalWarning(
        "รูปยังไม่ครบ",
        "กรุณาอัปโหลดรูปรถ รูปป้ายทะเบียน และรูปผู้ขับขี่ให้ครบก่อนบันทึก",
      );
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await timedFetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: form.get("prefix"),
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          studentId: form.get("studentId"),
          grade: form.get("grade"),
          room: form.get("room"),
          phoneNumber: form.get("phoneNumber"),
          brand: form.get("brand"),
          color: form.get("color"),
          plateNumber: form.get("plateNumber"),
          province: form.get("province"),
          helmet: form.get("helmet"),
          pillionName: form.get("pillionName") || "",
          bikeFileId: fileIds.bike,
          plateFileId: fileIds.plate,
          riderFileId: fileIds.rider,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "บันทึกไม่สำเร็จ");
        await swalError("บันทึกไม่สำเร็จ", data.error || "ลองใหม่อีกครั้ง");
        return;
      }
      toast.success(data.message || "บันทึกสำเร็จ");
      await swalSuccess(
        "ลงทะเบียนสำเร็จ",
        data.message || "ระบบบันทึกข้อมูลเรียบร้อยแล้ว",
      );
      router.push("/");
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      await swalError(
        "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
        "โปรดตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!config) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
        <p className="text-sm text-slate-500">กำลังโหลดแบบฟอร์ม...</p>
      </div>
    );
  }

  const imgSlots: {
    key: ImgKey;
    label: string;
    hint: string;
    icon: string;
  }[] = [
    {
      key: "bike",
      label: "รูปรถจักรยานยนต์",
      hint: "ถ่ายจากกล้องหรือเลือกจากคลัง · เห็นทั้งคันชัด",
      icon: "fa-motorcycle",
    },
    {
      key: "plate",
      label: "รูปป้ายทะเบียน",
      hint: "ถ่ายจากกล้องหรือเลือกจากคลัง · ตัวอักษรอ่านได้",
      icon: "fa-rectangle-ad",
    },
    {
      key: "rider",
      label: "รูปผู้ขับขี่",
      hint: "ถ่ายจากกล้องหรือเลือกจากคลัง · หน้าตรง สวมหมวกถ้ามี",
      icon: "fa-user",
    },
  ];

  const uploadedCount = [fileIds.bike, fileIds.plate, fileIds.rider].filter(
    Boolean,
  ).length;

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <header className="animate-fade-up mb-8 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0b1f4d_0%,#1e40af_55%,#2563eb_100%)] px-7 py-10 text-white shadow-lg shadow-blue-900/20 sm:px-10 sm:py-12">
        <p className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          MOTO-Safety
        </p>
        <h1 className="mt-4 text-xl font-semibold text-white/95 sm:text-2xl">
          ลงทะเบียนรถจักรยานยนต์นักเรียน
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-blue-100/85">
          กรอกข้อมูลจริงให้ครบ 3 ส่วน แล้วอัปโหลดรูปหลักฐานก่อนกดบันทึก
        </p>
        <ol className="mt-7 flex flex-wrap gap-3 text-sm font-semibold">
          {["ข้อมูลนักเรียน", "ข้อมูลรถ", "รูปหลักฐาน"].map((step, i) => (
            <li
              key={step}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-400 text-xs font-bold text-slate-900">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <Link
          href="/guide"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-blue-50 backdrop-blur-sm transition hover:bg-white/15"
        >
          <i className="fa-solid fa-book-open" />
          อ่านคู่มือการกรอกก่อนเริ่ม
        </Link>
      </header>

      <form onSubmit={onSubmit} className="space-y-7">
        <section className="animate-slide-in rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-sm shadow-slate-200/50 sm:p-10">
          <div className="mb-7 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-700 text-lg font-bold text-white">
              1
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
                ข้อมูลส่วนตัวนักเรียน
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">ตามบัตรนักเรียน / ทะเบียนบ้าน</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="คำนำหน้า *">
              <Select name="prefix" required defaultValue="">
                <option value="">-- เลือก --</option>
                {["เด็กชาย", "เด็กหญิง", "นาย", "นางสาว"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ชื่อ *">
              <Input name="firstName" required placeholder="ภาษาไทย" />
            </Field>
            <Field label="นามสกุล *">
              <Input name="lastName" required placeholder="ภาษาไทย" />
            </Field>
            <Field label="เลขประจำตัวนักเรียน *">
              <Input
                name="studentId"
                required
                pattern="[0-9]+"
                inputMode="numeric"
              />
            </Field>
            <Field label="ระดับชั้น *">
              <Select name="grade" required defaultValue="">
                <option value="">-- เลือกชั้น --</option>
                {config.grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ห้องเรียน *">
              <Select name="room" required defaultValue="">
                <option value="">-- เลือกห้อง --</option>
                {config.rooms.map((r) => (
                  <option key={r} value={r}>
                    ห้อง {r}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="md:col-span-3">
              <Field label="เบอร์โทรศัพท์ติดต่อ *">
                <Input
                  name="phoneNumber"
                  required
                  pattern="[0-9]{9,10}"
                  inputMode="numeric"
                  placeholder="0891234567"
                />
              </Field>
            </div>
          </div>
        </section>

        <section
          className="animate-slide-in rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-sm shadow-slate-200/50 sm:p-10"
          style={{ animationDelay: "60ms" }}
        >
          <div className="mb-7 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-700 text-lg font-bold text-white">
              2
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
                ข้อมูลรถและการใช้งาน
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">ตามป้ายทะเบียนจริง</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="ยี่ห้อรถ *">
              <Select name="brand" required defaultValue="">
                <option value="">-- เลือกยี่ห้อ --</option>
                {config.brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="สีรถ *">
              <Select name="color" required defaultValue="">
                <option value="">-- เลือกสี --</option>
                {config.colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="หมายเลขทะเบียนรถ *">
              <Input
                name="plateNumber"
                required
                pattern="[0-9]?[ก-ฮ]{2,3}[0-9]+"
                placeholder="เช่น กข1234 หรือ 1กพ4567"
                title="ใส่ตัวอักษรไทย 2–3 ตัว ตามด้วยตัวเลข หรือมีเลขนำหน้าได้ เช่น 1กพ4567"
              />
            </Field>
            <Field label="จังหวัดที่จดทะเบียน *">
              <Select name="province" required defaultValue="">
                <option value="">-- เลือกจังหวัด --</option>
                {[...THAI_PROVINCES].sort().map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="md:col-span-2">
              <span className="mb-3 block text-sm font-semibold tracking-wide text-slate-700">
                การมีหมวกนิรภัย *
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(
                  [
                    { value: "มี", label: "มีหมวกนิรภัย", icon: "fa-helmet-safety" },
                    { value: "ไม่มี", label: "ไม่มีหมวก", icon: "fa-ban" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:ring-2 has-[:checked]:ring-blue-200"
                  >
                    <input
                      type="radio"
                      name="helmet"
                      value={opt.value}
                      required
                      className="h-5 w-5 accent-blue-700"
                    />
                    <i
                      className={`fa-solid ${opt.icon} text-xl text-slate-400 group-has-[:checked]:text-blue-700`}
                    />
                    <span className="text-base font-bold text-slate-700">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Field label="ชื่อผู้ซ้อนท้ายประจำ (ถ้ามี)">
                <Input name="pillionName" placeholder="เว้นว่างได้" />
              </Field>
            </div>
          </div>
        </section>

        <section
          className="animate-slide-in rounded-[2rem] border border-slate-200/80 bg-white/95 p-7 shadow-sm shadow-slate-200/50 sm:p-10"
          style={{ animationDelay: "120ms" }}
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-700 text-lg font-bold text-white">
                3
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
                  รูปหลักฐาน
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  อัปโหลดครบ 3 รูป · ตอนนี้ {uploadedCount}/3
                </p>
              </div>
            </div>
            <div className="h-2.5 w-36 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${(uploadedCount / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {imgSlots.map((slot) => {
              const done = Boolean(fileIds[slot.key]);
              const busy = uploading === slot.key;
              return (
                <div
                  key={slot.key}
                  className={`flex flex-col overflow-hidden rounded-3xl border-2 border-dashed transition ${
                    done
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50/80"
                  }`}
                >
                  <div className="relative flex aspect-[4/3] min-h-[12rem] items-center justify-center overflow-hidden bg-slate-100 sm:min-h-[15rem]">
                    {previews[slot.key] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[slot.key]}
                        alt={slot.label}
                        className={`h-full w-full object-contain p-2 transition ${
                          done ? "" : "opacity-80"
                        }`}
                      />
                    ) : (
                      <i
                        className={`fa-solid ${slot.icon} text-5xl text-slate-300`}
                      />
                    )}
                    {!done && previews[slot.key] && (
                      <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                        ตัวอย่าง
                      </span>
                    )}
                    {done && (
                      <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow">
                        <i className="fa-solid fa-check text-sm" />
                      </span>
                    )}
                    {busy && (
                      <div className="absolute inset-0 grid place-items-center bg-slate-900/40">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        {slot.label}{" "}
                        <span className="text-rose-500">*</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{slot.hint}</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id={`camera-${slot.key}`}
                      className="hidden"
                      onChange={(e) => {
                        void onPick(slot.key, e.target.files?.[0] || null);
                        e.target.value = "";
                      }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      id={`file-${slot.key}`}
                      className="hidden"
                      onChange={(e) => {
                        void onPick(slot.key, e.target.files?.[0] || null);
                        e.target.value = "";
                      }}
                    />
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          document.getElementById(`camera-${slot.key}`)?.click()
                        }
                        className="rounded-2xl bg-blue-700 px-3 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
                      >
                        <i className="fa-solid fa-camera mr-1.5" />
                        {busy ? "อัปโหลด..." : "ถ่ายรูป"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          document.getElementById(`file-${slot.key}`)?.click()
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        <i className="fa-solid fa-images mr-1.5" />
                        {busy ? "อัปโหลด..." : done ? "เปลี่ยน" : "คลังรูป"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto flex max-w-5xl flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3.5 text-base font-semibold text-slate-600 hover:bg-slate-100"
            >
              <i className="fa-solid fa-arrow-left mr-2" />
              กลับหน้าแรก
            </Link>
            <Button
              type="submit"
              disabled={loading || Boolean(uploading)}
              className="px-10 py-4 text-lg"
            >
              <i className="fa-solid fa-cloud-arrow-up" />
              {loading ? "กำลังบันทึก..." : "บันทึกและลงทะเบียน"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
