import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/session";
import {
  deleteRegistration,
  findRegistrationByPlate,
  getRegistrationById,
  updateRegistration,
} from "@/lib/google/sheets";
import { fileUrlFor, removeStoredFile } from "@/lib/storage";
import { registrationSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

function withUrls(reg: NonNullable<Awaited<ReturnType<typeof getRegistrationById>>>) {
  return {
    ...reg,
    bike_url: fileUrlFor(reg.bike_file_id),
    plate_url: fileUrlFor(reg.plate_file_id),
    rider_url: fileUrlFor(reg.rider_file_id),
  };
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const reg = await getRegistrationById(id);
    if (!reg || reg.status === "deleted") return jsonError("ไม่พบข้อมูล", 404);
    return jsonOk({ item: withUrls(reg) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const session = await requireAdmin();
    const { id } = await ctx.params;
    const existing = await getRegistrationById(id);
    if (!existing || existing.status === "deleted") {
      return jsonError("ไม่พบข้อมูลที่ต้องการแก้ไข", 404);
    }

    const body = await request.json();
    const parsed = registrationSchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
    }
    const data = parsed.data;

    if (data.plateNumber) {
      const plate = data.plateNumber.replace(/\s+/g, "");
      const dup = await findRegistrationByPlate(plate);
      if (dup && dup.id !== id) {
        return jsonError("หมายเลขทะเบียนนี้มีในระบบแล้ว", 409);
      }
    }

    const nextBike = data.bikeFileId || existing.bike_file_id;
    const nextPlate = data.plateFileId || existing.plate_file_id;
    const nextRider = data.riderFileId || existing.rider_file_id;

    if (data.bikeFileId && data.bikeFileId !== existing.bike_file_id) {
      await removeStoredFile(existing.bike_file_id);
    }
    if (data.plateFileId && data.plateFileId !== existing.plate_file_id) {
      await removeStoredFile(existing.plate_file_id);
    }
    if (data.riderFileId && data.riderFileId !== existing.rider_file_id) {
      await removeStoredFile(existing.rider_file_id);
    }

    const updated = await updateRegistration(id, {
      updated_by: session.userId,
      prefix: data.prefix ?? existing.prefix,
      first_name: data.firstName ?? existing.first_name,
      last_name: data.lastName ?? existing.last_name,
      student_id: data.studentId ?? existing.student_id,
      grade: data.grade ?? existing.grade,
      room: data.room ?? existing.room,
      phone: data.phoneNumber ?? existing.phone,
      brand: data.brand ?? existing.brand,
      color: data.color ?? existing.color,
      plate_number: data.plateNumber
        ? data.plateNumber.replace(/\s+/g, "")
        : existing.plate_number,
      province: data.province ?? existing.province,
      helmet: data.helmet ?? existing.helmet,
      pillion_name: data.pillionName ?? existing.pillion_name,
      bike_file_id: nextBike,
      plate_file_id: nextPlate,
      rider_file_id: nextRider,
    });

    return jsonOk({
      item: withUrls(updated),
      message: "อัปเดตข้อมูลสำเร็จเรียบร้อยแล้ว",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const deleted = await deleteRegistration(id);
    await Promise.all([
      removeStoredFile(deleted.bike_file_id),
      removeStoredFile(deleted.plate_file_id),
      removeStoredFile(deleted.rider_file_id),
    ]);
    return jsonOk({ message: "ลบข้อมูลและไฟล์รูปภาพที่เกี่ยวข้องเรียบร้อยแล้ว" });
  } catch (err) {
    return handleApiError(err);
  }
}
