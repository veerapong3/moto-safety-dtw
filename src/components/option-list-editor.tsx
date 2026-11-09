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

function IconBtn({
  title,
  onClick,
  disabled,
  tone = "slate",
  icon,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "slate" | "blue" | "rose" | "emerald";
  icon: string;
}) {
  const tones = {
    slate: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    blue: "text-blue-600 hover:bg-blue-50 hover:text-blue-800",
    rose: "text-rose-500 hover:bg-rose-50 hover:text-rose-700",
    emerald: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800",
  } as const;

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${tones[tone]}`}
    >
      <i className={`fa-solid ${icon} text-sm`} />
    </button>
  );
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

  function cancelEdit() {
    setEditingIndex(null);
    setEditValue("");
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
    cancelEdit();
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

  const searching = Boolean(query.trim());

  return (
    <div className="flex h-full min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold text-slate-900">
            {icon && <i className={`fa-solid ${icon} mr-2 text-blue-700`} />}
            {title}
          </h4>
          {description && (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
        <div className="relative min-w-0 flex-1">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา..."
            className="bg-white py-2.5 pl-9 text-sm"
          />
        </div>
        <div className="flex min-w-0 flex-1 gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="bg-white py-2.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <Button
            type="button"
            onClick={addItem}
            className="h-[42px] w-[42px] shrink-0 rounded-xl p-0"
            title="เพิ่มรายการ"
            aria-label="เพิ่มรายการ"
          >
            <i className="fa-solid fa-plus" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="grid place-items-center px-6 py-14 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <i className="fa-solid fa-inbox" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-700">
                {items.length === 0 ? "ยังไม่มีรายการ" : "ไม่พบรายการ"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {items.length === 0
                  ? "พิมพ์แล้วกด + เพื่อเพิ่ม"
                  : "ลองเปลี่ยนคำค้นหา"}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="w-12 px-4 py-2.5 sm:px-5">#</th>
                <th className="px-2 py-2.5">รายการ</th>
                <th className="w-[148px] px-4 py-2.5 text-center sm:px-5">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ item, index }, visualIndex) => {
                const editing = editingIndex === index;
                return (
                  <tr
                    key={`${item}-${index}`}
                    className={`border-b border-slate-50 transition last:border-0 ${
                      editing
                        ? "bg-blue-50/80"
                        : visualIndex % 2 === 1
                          ? "bg-slate-50/40 hover:bg-slate-50"
                          : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-2.5 tabular-nums text-xs text-slate-400 sm:px-5">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2.5">
                      {editing ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEdit();
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="bg-white py-2 text-sm"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {item}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <div className="mx-auto flex w-fit items-center rounded-xl border border-slate-200/80 bg-white p-0.5 shadow-sm">
                        {editing ? (
                          <>
                            <IconBtn
                              title="บันทึก"
                              icon="fa-check"
                              tone="emerald"
                              onClick={saveEdit}
                            />
                            <IconBtn
                              title="ยกเลิก"
                              icon="fa-xmark"
                              tone="slate"
                              onClick={cancelEdit}
                            />
                          </>
                        ) : (
                          <>
                            <IconBtn
                              title={
                                searching
                                  ? "ล้างการค้นหาก่อนจัดลำดับ"
                                  : "เลื่อนขึ้น"
                              }
                              icon="fa-arrow-up"
                              disabled={index === 0 || searching}
                              onClick={() => moveItem(index, -1)}
                            />
                            <IconBtn
                              title={
                                searching
                                  ? "ล้างการค้นหาก่อนจัดลำดับ"
                                  : "เลื่อนลง"
                              }
                              icon="fa-arrow-down"
                              disabled={
                                index === items.length - 1 || searching
                              }
                              onClick={() => moveItem(index, 1)}
                            />
                            <span className="mx-0.5 h-5 w-px bg-slate-200" />
                            <IconBtn
                              title="แก้ไข"
                              icon="fa-pen"
                              tone="blue"
                              onClick={() => startEdit(index)}
                            />
                            <IconBtn
                              title="ลบ"
                              icon="fa-trash"
                              tone="rose"
                              onClick={() => void removeItem(index)}
                            />
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
    </div>
  );
}
