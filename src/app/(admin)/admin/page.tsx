"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { compressImageFile } from "@/lib/image-client";
import { timedFetch } from "@/lib/perf-client";
import type { PublicConfig, Registration } from "@/lib/types";
import { THAI_PROVINCES } from "@/lib/validations";

type RegRow = Registration & {
  bike_url?: string;
  plate_url?: string;
  rider_url?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"report" | "settings">("report");
  const [rows, setRows] = useState<RegRow[]>([]);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [edit, setEdit] = useState<RegRow | null>(null);
  const [editFiles, setEditFiles] = useState<{
    bike?: string;
    plate?: string;
    rider?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [regRes, setRes] = await Promise.all([
        timedFetch("/api/registrations"),
        timedFetch("/api/settings"),
      ]);
      if (regRes.status === 401 || setRes.status === 401) {
        router.replace("/login?next=/admin");
        return;
      }
      const regData = await regRes.json();
      const setData = await setRes.json();
      if (!regRes.ok) throw new Error(regData.error);
      if (!setRes.ok) throw new Error(setData.error);
      setRows(regData.items || []);
      setSettings(setData.settings || {});
      setConfig(setData.config || null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  }, [router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterGrade && r.grade !== filterGrade) return false;
      if (filterRoom && r.room !== filterRoom) return false;
      if (!q) return true;
      return (
        r.first_name.toLowerCase().includes(q) ||
        r.last_name.toLowerCase().includes(q) ||
        r.student_id.includes(q) ||
        r.plate_number.toLowerCase().includes(q)
      );
    });
  }, [rows, query, filterGrade, filterRoom]);

  async function logout() {
    await timedFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await timedFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          REGISTRATION_OPEN: settings.REGISTRATION_OPEN ?? "true",
          GRADES: settings.GRADES ?? "",
          ROOMS: settings.ROOMS ?? "",
          BRANDS: settings.BRANDS ?? "",
          COLORS: settings.COLORS ?? "",
          SAMPLE_BIKE_FILE_ID: settings.SAMPLE_BIKE_FILE_ID ?? "",
          SAMPLE_PLATE_FILE_ID: settings.SAMPLE_PLATE_FILE_ID ?? "",
          SAMPLE_RIDER_FILE_ID: settings.SAMPLE_RIDER_FILE_ID ?? "",
          CLOSED_MESSAGE: settings.CLOSED_MESSAGE ?? "",
          CONTACT_EMAIL: settings.CONTACT_EMAIL ?? "",
          CURRENT_ACADEMIC_YEAR: settings.CURRENT_ACADEMIC_YEAR ?? "",
          CURRENT_SEMESTER: settings.CURRENT_SEMESTER ?? "",
          DRIVE_ROOT_FOLDER_ID: settings.DRIVE_ROOT_FOLDER_ID ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfig(data.config);
      toast.success(data.message || "บันทึกแล้ว");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function uploadSample(kind: "bike" | "plate" | "rider", file: File) {
    const blob = await compressImageFile(file, 400, 0.8);
    const fd = new FormData();
    fd.append("file", blob, `sample_${kind}.jpg`);
    fd.append("kind", "samples");
    fd.append("sample", "1");
    fd.append("label", `sample_${kind}`);
    const res = await timedFetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const key =
      kind === "bike"
        ? "SAMPLE_BIKE_FILE_ID"
        : kind === "plate"
          ? "SAMPLE_PLATE_FILE_ID"
          : "SAMPLE_RIDER_FILE_ID";
    setSettings((s) => ({ ...s, [key]: data.fileId }));
    toast.success("อัปโหลดรูปตัวอย่างแล้ว (กดบันทึกการตั้งค่า)");
  }

  async function deleteRow(id: string) {
    if (!confirm("ยืนยันลบข้อมูลและรูปภาพออกอย่างถาวรหรือไม่?")) return;
    const res = await timedFetch(`/api/registrations/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "ลบไม่สำเร็จ");
      return;
    }
    toast.success(data.message);
    loadAll();
  }

  async function onEditFile(kind: "bike" | "plate" | "rider", file: File | null) {
    if (!file || !edit) return;
    const blob = await compressImageFile(file, 800, 0.8);
    const fd = new FormData();
    fd.append("file", blob, `${kind}.jpg`);
    fd.append("kind", kind);
    fd.append("label", `${edit.student_id}_${kind}`);
    const res = await timedFetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "อัปโหลดไม่สำเร็จ");
      return;
    }
    setEditFiles((f) => ({ ...f, [kind]: data.fileId }));
    toast.success("อัปโหลดรูปใหม่แล้ว");
  }

  async function submitEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await timedFetch(`/api/registrations/${edit.id}`, {
        method: "PATCH",
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
          pillionName: form.get("pillionName") || "-",
          bikeFileId: editFiles.bike,
          plateFileId: editFiles.plate,
          riderFileId: editFiles.rider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setEdit(null);
      setEditFiles({});
      loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "แก้ไขไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const open =
    (settings.REGISTRATION_OPEN || "true").toLowerCase() === "true" ||
    settings.REGISTRATION_OPEN === "ON";

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">
            <i className="fa-solid fa-user-gear mr-2 text-blue-700" />
            แผงควบคุมผู้ดูแลระบบ
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            จัดการข้อมูลความปลอดภัย ค้นหา กรอง และควบคุมการลงทะเบียน
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab("report")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                tab === "report"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600"
              }`}
            >
              ตารางข้อมูล
            </button>
            <button
              type="button"
              onClick={() => setTab("settings")}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                tab === "settings"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600"
              }`}
            >
              ตั้งค่า
            </button>
          </div>
          <Button variant="secondary" onClick={logout}>
            ออกจากระบบ
          </Button>
        </div>
      </div>

      {tab === "report" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:grid-cols-4">
            <Field label="ค้นหา">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ชื่อ, นามสกุล, เลขทะเบียน..."
              />
            </Field>
            <Field label="ระดับชั้น">
              <Select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
              >
                <option value="">-- ทั้งหมด --</option>
                {(config?.grades || []).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ห้อง">
              <Select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
              >
                <option value="">-- ทั้งหมด --</option>
                {(config?.rooms || []).map((r) => (
                  <option key={r} value={r}>
                    ห้อง {r}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button variant="secondary" className="w-full" onClick={loadAll}>
                <i className="fa-solid fa-rotate" /> รีเฟรช
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <th className="px-5 py-4">นักเรียน / เบอร์</th>
                    <th className="px-5 py-4">ชั้น</th>
                    <th className="px-5 py-4">รถ</th>
                    <th className="px-5 py-4">ทะเบียน</th>
                    <th className="px-5 py-4">รูป</th>
                    <th className="px-5 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        ยังไม่มีข้อมูล
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3">
                          <div className="font-semibold">
                            {r.prefix}
                            {r.first_name} {r.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {r.student_id} · {r.phone}
                          </div>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.helmet === "มี"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            หมวก: {r.helmet}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {r.grade}/{r.room}
                        </td>
                        <td className="px-5 py-3">
                          {r.brand} · {r.color}
                        </td>
                        <td className="px-5 py-3 font-semibold">
                          {r.plate_number}
                          <div className="text-xs font-normal text-slate-400">
                            {r.province}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1">
                            {[r.bike_url, r.plate_url, r.rider_url].map(
                              (src, i) =>
                                src ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    key={i}
                                    src={src}
                                    alt=""
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                ) : null,
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="secondary"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => {
                                setEdit(r);
                                setEditFiles({});
                              }}
                            >
                              แก้ไข
                            </Button>
                            <Button
                              variant="danger"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => deleteRow(r.id)}
                            >
                              ลบ
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="max-w-xl space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <h4 className="mb-1 text-sm font-bold text-slate-700">
              เปิด-ปิดรับลงทะเบียน
            </h4>
            <Button
              variant={open ? "danger" : "primary"}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  REGISTRATION_OPEN: open ? "false" : "true",
                }))
              }
            >
              สลับเป็น {open ? "ปิดรับข้อมูล" : "เปิดรับข้อมูล"}
            </Button>
            <p className="mt-2 text-xs text-slate-400">
              สถานะปัจจุบัน: {open ? "เปิด" : "ปิด"}
            </p>
          </div>
          {(
            [
              ["GRADES", "ระดับชั้น (คั่นด้วย ,)"],
              ["ROOMS", "ห้องเรียน (คั่นด้วย ,)"],
              ["BRANDS", "ยี่ห้อรถ (คั่นด้วย ,)"],
              ["COLORS", "สีรถ (คั่นด้วย ,)"],
              ["CURRENT_ACADEMIC_YEAR", "ปีการศึกษา (เช่น 2569)"],
              ["CONTACT_EMAIL", "อีเมลติดต่อ"],
              ["CLOSED_MESSAGE", "ข้อความตอนปิดระบบ"],
              ["DRIVE_ROOT_FOLDER_ID", "Drive Root Folder ID"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                value={settings[key] || ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, [key]: e.target.value }))
                }
              />
            </Field>
          ))}

          <Field label="ภาคเรียน">
            <Select
              value={settings.CURRENT_SEMESTER || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  CURRENT_SEMESTER: e.target.value,
                }))
              }
            >
              <option value="">-- เลือกภาคเรียน --</option>
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
            </Select>
          </Field>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="text-sm font-bold text-slate-700">รูปตัวอย่างฟอร์ม</h4>
            <div className="grid grid-cols-3 gap-3">
              {(["bike", "plate", "rider"] as const).map((kind) => (
                <div
                  key={kind}
                  className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <span className="mb-2 text-[10px] font-bold text-slate-500">
                    {kind}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-[10px]"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSample(kind, f).catch((err) =>
                        toast.error(err.message),
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button onClick={saveSettings} disabled={saving}>
              <i className="fa-solid fa-floppy-disk" />
              {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </Button>
          </div>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
              onClick={() => setEdit(null)}
            >
              <i className="fa-solid fa-circle-xmark text-xl" />
            </button>
            <h3 className="mb-4 border-b border-slate-100 pb-3 text-lg font-bold">
              แก้ไขข้อมูล
            </h3>
            <form onSubmit={submitEdit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="คำนำหน้า">
                  <Select name="prefix" defaultValue={edit.prefix} required>
                    {["เด็กชาย", "เด็กหญิง", "นาย", "นางสาว"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="ชื่อ">
                  <Input name="firstName" defaultValue={edit.first_name} required />
                </Field>
                <Field label="นามสกุล">
                  <Input name="lastName" defaultValue={edit.last_name} required />
                </Field>
                <Field label="เลขประจำตัว">
                  <Input name="studentId" defaultValue={edit.student_id} required />
                </Field>
                <Field label="ชั้น">
                  <Select name="grade" defaultValue={edit.grade} required>
                    {(config?.grades || []).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="ห้อง">
                  <Select name="room" defaultValue={edit.room} required>
                    {(config?.rooms || []).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="เบอร์">
                  <Input name="phoneNumber" defaultValue={edit.phone} required />
                </Field>
                <Field label="ยี่ห้อ">
                  <Select name="brand" defaultValue={edit.brand} required>
                    {(config?.brands || []).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="สี">
                  <Select name="color" defaultValue={edit.color} required>
                    {(config?.colors || []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="ทะเบียน">
                  <Input
                    name="plateNumber"
                    defaultValue={edit.plate_number}
                    required
                    pattern="[0-9]?[ก-ฮ]{2,3}[0-9]+"
                    placeholder="เช่น กข1234 หรือ 1กพ4567"
                    title="ใส่ตัวอักษรไทย 2–3 ตัว ตามด้วยตัวเลข หรือมีเลขนำหน้าได้ เช่น 1กพ4567"
                  />
                </Field>
                <Field label="จังหวัด">
                  <Select name="province" defaultValue={edit.province} required>
                    {[...THAI_PROVINCES].sort().map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="md:col-span-3">
                  <Field label="ผู้ซ้อนท้าย">
                    <Input
                      name="pillionName"
                      defaultValue={edit.pillion_name === "-" ? "" : edit.pillion_name}
                    />
                  </Field>
                </div>
              </div>
              <div className="flex gap-4">
                {(["มี", "ไม่มี"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm font-bold">
                    <input
                      type="radio"
                      name="helmet"
                      value={v}
                      defaultChecked={edit.helmet === v}
                      required
                    />
                    {v}หมวก
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                {(["bike", "plate", "rider"] as const).map((kind) => (
                  <div key={kind} className="text-center text-xs">
                    <div className="mb-1 font-bold text-slate-500">{kind}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        editFiles[kind]
                          ? `/api/files/${editFiles[kind]}`
                          : edit[`${kind}_url` as keyof RegRow] || ""
                      }
                      alt=""
                      className="mx-auto mb-2 h-16 w-16 rounded-lg object-cover"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        onEditFile(kind, e.target.files?.[0] || null)
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="secondary" onClick={() => setEdit(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
