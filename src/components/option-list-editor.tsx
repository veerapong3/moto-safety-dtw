"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { swalConfirm } from "@/lib/swal";

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toCsv(items: string[]): string {
  return items.map((s) => s.trim()).filter(Boolean).join(",");
}

export function OptionListEditor({
  title,
  description,
  icon,
  value,
  onChange,
  placeholder = "พิมพ์รายการใหม่",
}: {
  title: string;
  description?: string;
  icon?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const items = useMemo(() => parseCsv(value), [value]);
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (editingIndex === null) return;
    if (editingIndex >= items.length) {
      setEditingIndex(null);
      setEditValue("");
    }
  }, [editingIndex, items.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !q || item.toLowerCase().includes(q));
  }, [items, query]);

  function commit(next: string[]) {
    onChange(toCsv(next));
  }

  function addItem() {
    const next = draft.trim();
    if (!next) {
      toast.warning("กรุณาพิมพ์รายการก่อนเพิ่ม");
      return;
    }
    if (items.some((i) => i.toLowerCase() === next.toLowerCase())) {
      toast.warning(`“${next}” มีอยู่ในรายการแล้ว`);
      return;
    }
    commit([...items, next]);
    setDraft("");
    toast.success(`เพิ่ม “${next}” แล้ว`);
  }

  async function removeItem(index: number) {
    const label = items[index];
    const ok = await swalConfirm({
      title: "ลบรายการนี้?",
      text: `"${label}" จะถูกลบออกจากชุดข้อมูล`,
      confirmText: "ลบ",
      cancelText: "ยกเลิก",
    });
    if (!ok) return;
    commit(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditValue("");
    }
    toast.success(`ลบ “${label}” แล้ว`);
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(items[index] || "");
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const next = editValue.trim();
    if (!next) {
      toast.warning("รายการว่างไม่ได้");
      return;
    }
    const duplicated = items.some(
      (item, i) =>
        i !== editingIndex && item.toLowerCase() === next.toLowerCase(),
    );
    if (duplicated) {
      toast.warning(`“${next}” มีอยู่ในรายการแล้ว`);
      return;
    }
    commit(items.map((item, i) => (i === editingIndex ? next : item)));
    setEditingIndex(null);
    setEditValue("");
    toast.success("บันทึกรายการแล้ว");
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    commit(next);
    if (editingIndex === index) setEditingIndex(target);
    else if (editingIndex === target) setEditingIndex(index);
  }

  return (
    <div className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-slate-900">
              {icon && <i className={`fa-solid ${icon} mr-2 text-blue-700`} />}
              {title}
            </h4>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {items.length} รายการ
          </span>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหารายการ..."
              className="bg-white pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <Button type="button" onClick={addItem} className="shrink-0 px-4">
              <i className="fa-solid fa-plus" />
              เพิ่ม
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="grid h-full place-items-center px-6 py-16 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                <i className="fa-solid fa-inbox" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700">
                {items.length === 0 ? "ยังไม่มีรายการ" : "ไม่พบรายการที่ค้นหา"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {items.length === 0
                  ? "พิมพ์รายการใหม่ด้านบน แล้วกดเพิ่ม"
                  : "ลองเปลี่ยนคำค้นหา หรือล้างช่องค้นหา"}
              </p>
              {query && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setQuery("")}
                >
                  ล้างการค้นหา
                </Button>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="w-14 px-5 py-3">#</th>
                <th className="px-5 py-3">รายการ</th>
                <th className="w-40 px-5 py-3 text-right">การทำงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(({ item, index }) => {
                const editing = editingIndex === index;
                return (
                  <tr
                    key={`${item}-${index}`}
                    className={`transition ${
                      editing ? "bg-blue-50/70" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-5 py-3.5 tabular-nums text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEdit();
                            }
                            if (e.key === "Escape") {
                              setEditingIndex(null);
                              setEditValue("");
                            }
                          }}
                          autoFocus
                          className="bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {item}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {editing ? (
                          <>
                            <Button
                              type="button"
                              className="px-3 py-1.5 text-xs"
                              onClick={saveEdit}
                            >
                              บันทึก
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => {
                                setEditingIndex(null);
                                setEditValue("");
                              }}
                            >
                              ยกเลิก
                            </Button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-800 hover:shadow-sm disabled:opacity-30"
                              onClick={() => moveItem(index, -1)}
                              disabled={index === 0 || Boolean(query)}
                              title={
                                query
                                  ? "ล้างการค้นหาก่อนจัดลำดับ"
                                  : "เลื่อนขึ้น"
                              }
                            >
                              <i className="fa-solid fa-arrow-up text-xs" />
                            </button>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-800 hover:shadow-sm disabled:opacity-30"
                              onClick={() => moveItem(index, 1)}
                              disabled={
                                index === items.length - 1 || Boolean(query)
                              }
                              title={
                                query
                                  ? "ล้างการค้นหาก่อนจัดลำดับ"
                                  : "เลื่อนลง"
                              }
                            >
                              <i className="fa-solid fa-arrow-down text-xs" />
                            </button>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-xl text-blue-700 transition hover:bg-blue-50"
                              onClick={() => startEdit(index)}
                              title="แก้ไข"
                            >
                              <i className="fa-solid fa-pen text-xs" />
                            </button>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-xl text-rose-600 transition hover:bg-rose-50"
                              onClick={() => void removeItem(index)}
                              title="ลบ"
                            >
                              <i className="fa-solid fa-trash text-xs" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-xs text-slate-500 sm:px-6">
        เคล็ดลับ: กด Enter เพื่อเพิ่ม/บันทึก · Escape เพื่อยกเลิกแก้ไข ·
        อย่าลืมกด “บันทึกการตั้งค่า” เพื่อให้มีผลในฟอร์มจริง
      </div>
    </div>
  );
}
