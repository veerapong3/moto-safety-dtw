"use client";

import Swal from "sweetalert2";

const base = {
  confirmButtonColor: "#1d4ed8",
  cancelButtonColor: "#64748b",
  customClass: {
    popup: "font-sans rounded-2xl",
    confirmButton: "rounded-lg px-4 py-2",
    cancelButton: "rounded-lg px-4 py-2",
  },
};

export async function swalConfirm(options: {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  const result = await Swal.fire({
    ...base,
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmText || "ยืนยัน",
    cancelButtonText: options.cancelText || "ยกเลิก",
    reverseButtons: true,
    focusCancel: true,
    confirmButtonColor: options.danger === false ? "#0d9488" : "#dc2626",
  });
  return result.isConfirmed;
}

export async function swalSuccess(title: string, text?: string) {
  await Swal.fire({
    ...base,
    icon: "success",
    title,
    text,
    timer: 2200,
    showConfirmButton: false,
  });
}

export async function swalError(title: string, text?: string) {
  await Swal.fire({
    ...base,
    icon: "error",
    title,
    text,
    confirmButtonText: "ปิด",
  });
}

export async function swalInfo(title: string, text?: string) {
  await Swal.fire({
    ...base,
    icon: "info",
    title,
    text,
    confirmButtonText: "รับทราบ",
  });
}

export async function swalWarning(title: string, text?: string) {
  await Swal.fire({
    ...base,
    icon: "warning",
    title,
    text,
    confirmButtonText: "รับทราบ",
  });
}
