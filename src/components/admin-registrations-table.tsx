"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import {
  ImageThumbnails,
  registrationImages,
} from "@/components/image-lightbox";
import { Button } from "@/components/ui/button";
import type { Registration } from "@/lib/types";

export type AdminRegRow = Registration & {
  bike_url?: string;
  plate_url?: string;
  rider_url?: string;
};

export function AdminRegistrationsTable({
  data,
  loading,
  onEdit,
  onDelete,
}: {
  data: AdminRegRow[];
  loading?: boolean;
  onEdit: (row: AdminRegRow) => void;
  onDelete: (id: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [pageSize, setPageSize] = useState(10);

  const columns = useMemo<ColumnDef<AdminRegRow>[]>(
    () => [
      {
        id: "student",
        accessorFn: (r) =>
          `${r.prefix}${r.first_name} ${r.last_name} ${r.student_id} ${r.phone}`,
        header: "นักเรียน / เบอร์",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
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
            </div>
          );
        },
      },
      {
        id: "class",
        accessorFn: (r) => `${r.grade}/${r.room}`,
        header: "ชั้น",
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.grade}/{row.original.room}
          </span>
        ),
      },
      {
        id: "vehicle",
        accessorFn: (r) => `${r.brand} ${r.color}`,
        header: "รถ",
        cell: ({ row }) => (
          <span>
            {row.original.brand} · {row.original.color}
          </span>
        ),
      },
      {
        id: "plate",
        accessorFn: (r) => r.plate_number,
        header: "ทะเบียน",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.plate_number}</div>
            <div className="text-xs font-normal text-slate-400">
              {row.original.province}
            </div>
          </div>
        ),
      },
      {
        id: "photos",
        enableSorting: false,
        header: "รูป",
        cell: ({ row }) => (
          <ImageThumbnails images={registrationImages(row.original)} />
        ),
      },
      {
        id: "created_at",
        accessorFn: (r) => r.created_at || "",
        header: "วันที่บันทึก",
        cell: ({ row }) => {
          const raw = row.original.created_at;
          if (!raw) return <span className="text-slate-400">-</span>;
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) {
            return <span className="text-xs text-slate-500">{raw}</span>;
          }
          return (
            <span className="text-xs font-semibold text-slate-600">
              {d.toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: () => <div className="text-center">จัดการ</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={() => onEdit(row.original)}
            >
              แก้ไข
            </Button>
            <Button
              variant="danger"
              className="px-3 py-1.5 text-xs"
              onClick={() => onDelete(row.original.id)}
            >
              ลบ
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onEdit],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  useEffect(() => {
    table.setPageSize(pageSize);
    table.setPageIndex(0);
  }, [pageSize, table, data]);

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const total = data.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <p className="text-sm text-slate-500">
          แสดง{" "}
          <span className="font-bold text-slate-800">
            {from.toLocaleString()}-{to.toLocaleString()}
          </span>{" "}
          จาก{" "}
          <span className="font-bold text-slate-800">
            {total.toLocaleString()}
          </span>{" "}
          รายการ
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          แสดงต่อหน้า
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="px-5 py-4">
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 transition hover:text-blue-700"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <i
                            className={`fa-solid text-[10px] ${
                              sorted === "asc"
                                ? "fa-sort-up text-blue-700"
                                : sorted === "desc"
                                  ? "fa-sort-down text-blue-700"
                                  : "fa-sort text-slate-300"
                            }`}
                          />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-slate-400"
                >
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-slate-400"
                >
                  ไม่พบข้อมูลตามเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-500">
          หน้า {pageCount === 0 ? 0 : pageIndex + 1} / {pageCount}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <i className="fa-solid fa-chevron-left" />
            ก่อนหน้า
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            ถัดไป
            <i className="fa-solid fa-chevron-right" />
          </Button>
        </div>
      </div>
    </div>
  );
}
