"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ImageThumbnails,
  registrationImages,
} from "@/components/image-lightbox";
import { OptionListEditor } from "@/components/option-list-editor";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { compressImageFile } from "@/lib/image-client";
import { timedFetch } from "@/lib/perf-client";
import { swalConfirm } from "@/lib/swal";
import type { DashboardStats, PublicConfig, Registration } from "@/lib/types";
import { THAI_PROVINCES } from "@/lib/validations";

const DashboardCharts = dynamic(
  () =>
    import("@/components/dashboard-charts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-400">
        กำลังโหลดกราฟ...
      </div>
    ),
  },
);

type RegRow = Registration & {
  bike_url?: string;
  plate_url?: string;
  rider_url?: string;
};

function computeStats(rows: RegRow[]): DashboardStats {
  const byGrade: Record<string, number> = {
    "ม.1": 0,
    "ม.2": 0,
    "ม.3": 0,
    "ม.4": 0,
    "ม.5": 0,
    "ม.6": 0,
  };
  let junior = 0;
  let senior = 0;
  let helmetYes = 0;
  let helmetNo = 0;

  for (const row of rows) {
    if (["ม.1", "ม.2", "ม.3"].includes(row.grade)) junior++;
    else if (["ม.4", "ม.5", "ม.6"].includes(row.grade)) senior++;
    if (row.helmet === "มี") helmetYes++;
    else helmetNo++;
    if (row.grade in byGrade) byGrade[row.grade]++;
  }

  const total = rows.length;
  return {
    total,
    junior,
    senior,
    helmetYes,
    helmetNo,
    helmetRate: total > 0 ? Number(((helmetYes / total) * 100).toFixed(1)) : 0,
    byGrade,
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "data" | "settings">("overview");
  const [settingsPanel, setSettingsPanel] = useState<
    "general" | "datasets" | "samples"
  >("datasets");
  const [datasetKey, setDatasetKey] = useState<
    "BRANDS" | "COLORS" | "GRADES" | "ROOMS"
  >("BRANDS");
  const [rows, setRows] = useState<RegRow[]>([]);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [quickQuery, setQuickQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterHelmet, setFilterHelmet] = useState("");
  const [edit, setEdit] = useState<RegRow | null>(null);
  const [editFiles, setEditFiles] = useState<{
    bike?: string;
    plate?: string;
    rider?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const stats = useMemo(() => computeStats(rows), [rows]);

  function matchesSearch(r: RegRow, q: string) {
    if (!q) return true;
    const fullName = `${r.prefix}${r.first_name} ${r.last_name}`.toLowerCase();
    return (
      fullName.includes(q) ||
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      r.student_id.includes(q) ||
      r.plate_number.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.brand.toLowerCase().includes(q) ||
      r.color.toLowerCase().includes(q) ||
      `${r.grade}/${r.room}`.toLowerCase().includes(q)
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterGrade && r.grade !== filterGrade) return false;
      if (filterRoom && r.room !== filterRoom) return false;
      if (filterHelmet && r.helmet !== filterHelmet) return false;
      return matchesSearch(r, q);
    });
  }, [rows, query, filterGrade, filterRoom, filterHelmet]);

  const quickResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return [];
    return rows.filter((r) => matchesSearch(r, q)).slice(0, 8);
  }, [rows, quickQuery]);

  const quickTotal = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return 0;
    return rows.filter((r) => matchesSearch(r, q)).length;
  }, [rows, quickQuery]);

  function openInDataTable(search = quickQuery) {
    setQuery(search.trim());
    setFilterGrade("");
    setFilterRoom("");
    setFilterHelmet("");
    setTab("data");
  }

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
    const ok = await swalConfirm({
      title: "ยืนยันลบข้อมูล?",
      text: "จะลบข้อมูลและรูปภาพออกอย่างถาวร",
      confirmText: "ลบถาวร",
      cancelText: "ยกเลิก",
    });
    if (!ok) return;
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

  const tabs = [
    { id: "overview" as const, label: "ภาพรวม", icon: "fa-chart-pie" },
    { id: "data" as const, label: "ข้อมูลลงทะเบียน", icon: "fa-table" },
    { id: "settings" as const, label: "ตั้งค่า", icon: "fa-gear" },
  ];

  const kpiCards = [
    {
      label: "ลงทะเบียนทั้งหมด",
      value: loading ? "…" : stats.total.toLocaleString(),
      sub: "คัน",
      icon: "fa-motorcycle",
      tone: "from-blue-600 to-sky-500",
      wrap: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50",
    },
    {
      label: "ม.ต้น (ม.1–ม.3)",
      value: loading ? "…" : stats.junior.toLocaleString(),
      sub: "คัน",
      icon: "fa-graduation-cap",
      tone: "from-cyan-600 to-teal-500",
      wrap: "border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50",
    },
    {
      label: "ม.ปลาย (ม.4–ม.6)",
      value: loading ? "…" : stats.senior.toLocaleString(),
      sub: "คัน",
      icon: "fa-user-graduate",
      tone: "from-amber-500 to-orange-500",
      wrap: "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    },
    {
      label: "อัตรามีหมวกนิรภัย",
      value: loading ? "…" : `${stats.helmetRate}%`,
      sub: loading ? "" : `มี ${stats.helmetYes} · ไม่มี ${stats.helmetNo}`,
      icon: "fa-helmet-safety",
      tone: "from-emerald-600 to-green-500",
      wrap: "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,#0b1f4d_0%,#1e40af_55%,#2563eb_100%)] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/90">
                Admin Console
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                แผงควบคุมผู้ดูแลระบบ
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
                สรุปสถิติ จัดการข้อมูลลงทะเบียน และควบคุมการเปิด–ปิดรับข้อมูล
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                {config?.academicYear && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                    ปีการศึกษา {config.academicYear}
                  </span>
                )}
                {config?.semester && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                    ภาคเรียนที่ {config.semester}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 ${
                    open
                      ? "bg-emerald-400/20 text-emerald-100"
                      : "bg-rose-400/20 text-rose-100"
                  }`}
                >
                  {open ? "เปิดรับลงทะเบียน" : "ปิดรับลงทะเบียน"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/25"
                onClick={loadAll}
              >
                <i className="fa-solid fa-rotate" />
                รีเฟรช
              </Button>
              <Button
                variant="secondary"
                className="bg-white text-slate-800 hover:bg-slate-100"
                onClick={logout}
              >
                <i className="fa-solid fa-right-from-bracket" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-t border-slate-100 bg-slate-50/80 p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === t.id
                  ? "bg-white text-blue-800 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              <i className={`fa-solid ${t.icon}`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(tab === "overview" || tab === "data") && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${card.wrap}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900">
                    {card.value}
                  </p>
                  {card.sub && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {card.sub}
                    </p>
                  )}
                </div>
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${card.tone}`}
                >
                  <i className={`fa-solid ${card.icon}`} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-6 text-white shadow-md sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/90">
                  Quick Lookup
                </p>
                <h3 className="mt-2 text-xl font-extrabold sm:text-2xl">
                  ค้นหาด่วน นักเรียน / รถ
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/90">
                  พิมพ์ชื่อ นามสกุล เลขประจำตัว เบอร์โทร หรือเลขทะเบียน
                  เพื่อดูข้อมูลทันทีจากภาพรวม
                </p>
              </div>
              <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={quickQuery}
                    onChange={(e) => setQuickQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && quickQuery.trim()) {
                        openInDataTable();
                      }
                    }}
                    placeholder="เช่น สมชาย / 12345 / 1กพ4567"
                    className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <Button
                  type="button"
                  className="shrink-0 bg-amber-400 text-slate-900 hover:bg-amber-300"
                  onClick={() => openInDataTable()}
                  disabled={!quickQuery.trim()}
                >
                  <i className="fa-solid fa-table" />
                  เปิดในตาราง
                </Button>
              </div>
            </div>

            {quickQuery.trim() && (
              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="font-semibold text-blue-50">
                    ผลค้นหา {quickTotal.toLocaleString()} รายการ
                    {quickTotal > quickResults.length
                      ? ` · แสดง ${quickResults.length} รายการแรก`
                      : ""}
                  </p>
                  {quickTotal > 0 && (
                    <button
                      type="button"
                      onClick={() => openInDataTable()}
                      className="text-xs font-bold text-amber-200 underline-offset-2 hover:underline"
                    >
                      ดูทั้งหมดในตารางข้อมูล
                    </button>
                  )}
                </div>

                {quickResults.length === 0 ? (
                  <div className="rounded-xl bg-white/10 px-4 py-8 text-center text-sm text-blue-50">
                    ไม่พบข้อมูลที่ตรงกับ “{quickQuery.trim()}”
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {quickResults.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-white/15 bg-white p-4 text-slate-800 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold">
                              {r.prefix}
                              {r.first_name} {r.last_name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {r.student_id} · {r.grade}/{r.room} · {r.phone}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.helmet === "มี"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            หมวก: {r.helmet}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <ImageThumbnails
                            images={registrationImages(r)}
                            sizeClass="h-10 w-10"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {r.plate_number}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {r.brand} · {r.color} · {r.province}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 px-3 py-2 text-xs"
                            onClick={() => {
                              setEdit(r);
                              setEditFiles({});
                            }}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            type="button"
                            className="flex-1 px-3 py-2 text-xs"
                            onClick={() => openInDataTable(r.plate_number)}
                          >
                            เปิดในตาราง
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {!loading && <DashboardCharts stats={stats} />}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-800">
                สรุปการใช้งานด่วน
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTab("data")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <p className="text-sm font-bold text-slate-800">
                    <i className="fa-solid fa-table mr-2 text-blue-700" />
                    จัดการข้อมูลลงทะเบียน
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ค้นหา แก้ไข ลบ · ทั้งหมด {stats.total} รายการ
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("settings")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <p className="text-sm font-bold text-slate-800">
                    <i className="fa-solid fa-gear mr-2 text-blue-700" />
                    ตั้งค่าระบบ
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    เปิด–ปิดรับลงทะเบียน ชั้น ห้อง ยี่ห้อ และรูปตัวอย่าง
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">สถานะระบบ</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">รับลงทะเบียน</dt>
                  <dd
                    className={`font-bold ${
                      open ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {open ? "เปิด" : "ปิด"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">ปีการศึกษา</dt>
                  <dd className="font-bold text-slate-800">
                    {config?.academicYear || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">ภาคเรียน</dt>
                  <dd className="font-bold text-slate-800">
                    {config?.semester || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">โรงเรียน</dt>
                  <dd className="font-bold text-slate-800">
                    {config?.schoolName || "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  ข้อมูลลงทะเบียน
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  แสดง {filtered.length.toLocaleString()} จาก{" "}
                  {rows.length.toLocaleString()} รายการ
                </p>
              </div>
              <Button variant="secondary" onClick={loadAll}>
                <i className="fa-solid fa-rotate" /> รีเฟรชตาราง
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="xl:col-span-2">
                <Field label="ค้นหา">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ชื่อ, นามสกุล, เลขประจำตัว, ทะเบียน, เบอร์"
                  />
                </Field>
              </div>
              <Field label="ระดับชั้น">
                <Select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                >
                  <option value="">ทั้งหมด</option>
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
                  <option value="">ทั้งหมด</option>
                  {(config?.rooms || []).map((r) => (
                    <option key={r} value={r}>
                      ห้อง {r}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="หมวกนิรภัย">
                <Select
                  value={filterHelmet}
                  onChange={(e) => setFilterHelmet(e.target.value)}
                >
                  <option value="">ทั้งหมด</option>
                  <option value="มี">มี</option>
                  <option value="ไม่มี">ไม่มี</option>
                </Select>
              </Field>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">นักเรียน / เบอร์</th>
                    <th className="px-5 py-4">ชั้น</th>
                    <th className="px-5 py-4">รถ</th>
                    <th className="px-5 py-4">ทะเบียน</th>
                    <th className="px-5 py-4">รูป</th>
                    <th className="px-5 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-400"
                      >
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-400"
                      >
                        ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {r.prefix}
                            {r.first_name} {r.last_name}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {r.student_id} · {r.phone}
                          </div>
                          <span
                            className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.helmet === "มี"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            หมวก: {r.helmet}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold">
                          {r.grade}/{r.room}
                        </td>
                        <td className="px-5 py-3.5">
                          {r.brand} · {r.color}
                        </td>
                        <td className="px-5 py-3.5 font-semibold">
                          {r.plate_number}
                          <div className="text-xs font-normal text-slate-400">
                            {r.province}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <ImageThumbnails images={registrationImages(r)} />
                        </td>
                        <td className="px-5 py-3.5 text-center">
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
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  {
                    id: "datasets" as const,
                    label: "ชุดข้อมูลฟอร์ม",
                    icon: "fa-database",
                  },
                  {
                    id: "general" as const,
                    label: "ทั่วไป",
                    icon: "fa-sliders",
                  },
                  {
                    id: "samples" as const,
                    label: "รูปตัวอย่าง",
                    icon: "fa-image",
                  },
                ] as const
              ).map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  onClick={() => setSettingsPanel(panel.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    settingsPanel === panel.id
                      ? "bg-blue-700 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <i className={`fa-solid ${panel.icon}`} />
                  {panel.label}
                </button>
              ))}
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              <i className="fa-solid fa-floppy-disk" />
              {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </Button>
          </div>

          {settingsPanel === "datasets" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      จัดการชุดข้อมูลในฟอร์ม
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      เพิ่ม แก้ไข ลบ และจัดลำดับรายการที่นักเรียนเลือกตอนลงทะเบียน
                      แล้วกดบันทึกการตั้งค่า
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(
                    [
                      {
                        key: "BRANDS" as const,
                        label: "ยี่ห้อรถ",
                        icon: "fa-motorcycle",
                      },
                      {
                        key: "COLORS" as const,
                        label: "สีรถ",
                        icon: "fa-palette",
                      },
                      {
                        key: "GRADES" as const,
                        label: "ระดับชั้น",
                        icon: "fa-graduation-cap",
                      },
                      {
                        key: "ROOMS" as const,
                        label: "ห้องเรียน",
                        icon: "fa-door-open",
                      },
                    ] as const
                  ).map((item) => {
                    const count = (settings[item.key] || "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean).length;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setDatasetKey(item.key)}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                          datasetKey === item.key
                            ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-200"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <i className={`fa-solid ${item.icon}`} />
                        {item.label}
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {datasetKey === "BRANDS" && (
                <OptionListEditor
                  title="ยี่ห้อรถ"
                  description="รายการยี่ห้อที่แสดงในแบบฟอร์มลงทะเบียน"
                  icon="fa-motorcycle"
                  value={settings.BRANDS || ""}
                  onChange={(next) =>
                    setSettings((s) => ({ ...s, BRANDS: next }))
                  }
                  placeholder="เช่น Honda, Yamaha, GPX"
                />
              )}
              {datasetKey === "COLORS" && (
                <OptionListEditor
                  title="สีรถ"
                  description="รายการสีที่แสดงในแบบฟอร์มลงทะเบียน"
                  icon="fa-palette"
                  value={settings.COLORS || ""}
                  onChange={(next) =>
                    setSettings((s) => ({ ...s, COLORS: next }))
                  }
                  placeholder="เช่น แดง, ดำ, ขาว"
                />
              )}
              {datasetKey === "GRADES" && (
                <OptionListEditor
                  title="ระดับชั้น"
                  description="ระดับชั้นที่นักเรียนเลือกได้ตอนลงทะเบียน"
                  icon="fa-graduation-cap"
                  value={settings.GRADES || ""}
                  onChange={(next) =>
                    setSettings((s) => ({ ...s, GRADES: next }))
                  }
                  placeholder="เช่น ม.1"
                />
              )}
              {datasetKey === "ROOMS" && (
                <OptionListEditor
                  title="ห้องเรียน"
                  description="หมายเลขห้องที่แสดงในแบบฟอร์ม"
                  icon="fa-door-open"
                  value={settings.ROOMS || ""}
                  onChange={(next) =>
                    setSettings((s) => ({ ...s, ROOMS: next }))
                  }
                  placeholder="เช่น 1"
                />
              )}
            </div>
          )}

          {settingsPanel === "general" && (
            <div className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  การตั้งค่าทั่วไป
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  สถานะระบบ ปีการศึกษา และข้อความที่แสดงต่อสาธารณะ
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">
                      เปิด–ปิดรับลงทะเบียน
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      สถานะปัจจุบัน:{" "}
                      <span
                        className={`font-bold ${
                          open ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {open ? "เปิด" : "ปิด"}
                      </span>
                    </p>
                  </div>
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
                </div>
              </div>

              {(
                [
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
            </div>
          )}

          {settingsPanel === "samples" && (
            <div className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  รูปตัวอย่างฟอร์ม
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  อัปโหลดแล้วกดบันทึกการตั้งค่าด้านบน
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["bike", "plate", "rider"] as const).map((kind) => (
                  <div
                    key={kind}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 text-sm font-bold text-slate-700">
                      {kind === "bike"
                        ? "รูปรถ"
                        : kind === "plate"
                          ? "รูปป้ายทะเบียน"
                          : "รูปผู้ขับขี่"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-slate-500"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          uploadSample(kind, f).catch((err) =>
                            toast.error(err.message),
                          );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
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
                      defaultValue={
                        edit.pillion_name === "-" ? "" : edit.pillion_name
                      }
                    />
                  </Field>
                </div>
              </div>
              <div className="flex gap-4">
                {(["มี", "ไม่มี"] as const).map((v) => (
                  <label
                    key={v}
                    className="flex items-center gap-2 text-sm font-bold"
                  >
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
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="flex justify-center">
                  <ImageThumbnails
                    images={(
                      [
                        {
                          kind: "bike" as const,
                          label: "รูปรถจักรยานยนต์",
                        },
                        {
                          kind: "plate" as const,
                          label: "รูปป้ายทะเบียน",
                        },
                        {
                          kind: "rider" as const,
                          label: "รูปผู้ขับขี่",
                        },
                      ] as const
                    )
                      .map(({ kind, label }) => ({
                        src: editFiles[kind]
                          ? `/api/files/${editFiles[kind]}`
                          : (edit[`${kind}_url` as keyof RegRow] as string) ||
                            "",
                        label,
                      }))
                      .filter((img) => Boolean(img.src))}
                    sizeClass="h-16 w-16"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(["bike", "plate", "rider"] as const).map((kind) => (
                    <div key={kind} className="text-center text-xs">
                      <div className="mb-1 font-bold text-slate-500">
                        {kind === "bike"
                          ? "รูปรถ"
                          : kind === "plate"
                            ? "ป้ายทะเบียน"
                            : "ผู้ขับขี่"}
                      </div>
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
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEdit(null)}
                >
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
