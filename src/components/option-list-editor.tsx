"use client";

import { useEffect, useMemo, useState } from "react";
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
    if (!next) return;
    if (items.some((i) => i.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    commit([...items, next]);
    setDraft("");
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
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(items[index] || "");
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const next = editValue.trim();
    if (!next) return;
    const duplicated = items.some(
      (item, i) =>
        i !== editingIndex && item.toLowerCase() === next.toLowerCase(),
    );
    if (duplicated) return;
    commit(items.map((item, i) => (i === editingIndex ? next : item)));
    setEditingIndex(null);
    setEditValue("");
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div>
          <h4 className="text-base font-bold text-slate-800">
            {icon && <i className={`fa-solid ${icon} mr-2 text-blue-700`} />}
            {title}
          </h4>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">
          {items.length} รายการ
        </span>
      </div>

      <div className="space-y-3 border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <Button type="button" onClick={addItem} className="shrink-0 sm:px-5">
            <i className="fa-solid fa-plus" />
            เพิ่ม
          </Button>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหารายการในตาราง..."
          className="bg-white"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-white text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="w-16 px-5 py-3">#</th>
              <th className="px-5 py-3">รายการ</th>
              <th className="w-44 px-5 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  {items.length === 0
                    ? "ยังไม่มีรายการ — เพิ่มรายการแรกด้านบน"
                    : "ไม่พบรายการตามคำค้นหา"}
                </td>
              </tr>
            ) : (
              filtered.map(({ item, index }) => {
                const editing = editingIndex === index;
                return (
                  <tr key={`${item}-${index}`} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 tabular-nums text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3">
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
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {item}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                              onClick={() => moveItem(index, -1)}
                              disabled={index === 0}
                              title="เลื่อนขึ้น"
                            >
                              <i className="fa-solid fa-arrow-up text-xs" />
                            </button>
                            <button
                              type="button"
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                              onClick={() => moveItem(index, 1)}
                              disabled={index === items.length - 1}
                              title="เลื่อนลง"
                            >
                              <i className="fa-solid fa-arrow-down text-xs" />
                            </button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => startEdit(index)}
                            >
                              แก้ไข
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="px-3 py-1.5 text-xs"
                              onClick={() => void removeItem(index)}
                            >
                              ลบ
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
