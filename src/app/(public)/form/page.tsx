"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { compressImageFile } from "@/lib/image-client";
import type { PublicConfig } from "@/lib/types";
import { THAI_PROVINCES } from "@/lib/validations";

type ImgKey = "bike" | "plate" | "rider";

export default function FormPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(false);
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
    fetch("/api/config")
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
    try {
      const blob = await compressImageFile(file, 800, 0.8);
      const previewUrl = URL.createObjectURL(blob);
      setPreviews((p) => ({ ...p, [key]: previewUrl }));

      const fd = new FormData();
      fd.append("file", blob, `${key}.jpg`);
      fd.append("kind", key);
      fd.append("label", key);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "อัปโหลดไม่สำเร็จ");
        return;
      }
      setFileIds((f) => ({ ...f, [key]: data.fileId }));
      toast.success(`อัปโหลดรูป${key === "bike" ? "รถ" : key === "plate" ? "ป้าย" : "ผู้ขับ"}แล้ว`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileIds.bike || !fileIds.plate || !fileIds.rider) {
      toast.warning("กรุณาเลือกรูปภาพให้ครบถ้วนทั้ง 3 รูป");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/registrations", {
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
        return;
      }
      toast.success(data.message || "บันทึกสำเร็จ");
      setTimeout(() => router.push("/"), 1200);
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  if (!config) {
    return <p className="text-center text-slate-500">กำลังโหลดแบบฟอร์ม...</p>;
  }

  const imgSlots: { key: ImgKey; label: string; icon: string }[] = [
    { key: "bike", label: "รูปรถจักรยานยนต์", icon: "fa-motorcycle" },
    { key: "plate", label: "รูปป้ายทะเบียนรถ", icon: "fa-rectangle-ad" },
    { key: "rider", label: "รูปถ่ายผู้ขับขี่รถ", icon: "fa-user-astronaut" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-slate-800">
          ลงทะเบียนข้อมูลรถจักรยานยนต์
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          กรุณากรอกข้อมูลจริงตามความเป็นจริงเพื่อประโยชน์ด้านความปลอดภัย
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
              ส่วนที่ 1
            </span>
            <h3 className="text-lg font-bold text-slate-700">ข้อมูลส่วนตัวนักเรียน</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="คำนำหน้า *">
              <Select name="prefix" required defaultValue="">
                <option value="">-- เลือกคำนำหน้า --</option>
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
                <option value="">-- เลือกระดับชั้น --</option>
                {config.grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ห้องเรียน *">
              <Select name="room" required defaultValue="">
                <option value="">-- เลือกห้องเรียน --</option>
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

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
              ส่วนที่ 2
            </span>
            <h3 className="text-lg font-bold text-slate-700">ข้อมูลรถและการใช้งาน</h3>
          </div>
          <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="ยี่ห้อรถ *">
              <Select name="brand" required defaultValue="">
                <option value="">-- เลือกยี่ห้อรถ --</option>
                {config.brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="สีรถ *">
              <Select name="color" required defaultValue="">
                <option value="">-- เลือกสีรถ --</option>
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
                pattern="[ก-ฮ]{2,3}[0-9]+"
                placeholder="เช่น ยนร456"
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
            <div className="md:col-span-2 border-t border-slate-100 pt-5">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                การมีหมวกนิรภัย *
              </span>
              <div className="flex gap-4">
                {(["มี", "ไม่มี"] as const).map((v) => (
                  <label
                    key={v}
                    className="flex flex-grow cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
                  >
                    <input
                      type="radio"
                      name="helmet"
                      value={v}
                      required
                      className="mr-2"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {v === "มี" ? "มีหมวกนิรภัย" : "ไม่มีหมวกนิรภัย"}
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

          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 md:grid-cols-3">
            {imgSlots.map((slot) => (
              <div
                key={slot.key}
                className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4"
              >
                <span className="mb-2 text-xs font-bold text-slate-600">
                  {slot.label} <span className="text-red-500">*</span>
                </span>
                <div className="mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-slate-200">
                  {previews[slot.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previews[slot.key]}
                      alt={slot.label}
                      className={`h-full w-full object-cover ${
                        fileIds[slot.key] ? "" : "opacity-35"
                      }`}
                    />
                  ) : (
                    <i className={`fa-solid ${slot.icon} text-3xl text-slate-400`} />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  id={`file-${slot.key}`}
                  className="hidden"
                  onChange={(e) => onPick(slot.key, e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById(`file-${slot.key}`)?.click()
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  เลือกรูปภาพ
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading} className="px-8 py-3.5">
            <i className="fa-solid fa-cloud-arrow-up" />
            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูลและลงทะเบียน"}
          </Button>
        </div>
      </form>
    </div>
  );
}
