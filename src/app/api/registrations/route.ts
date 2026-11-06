import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/session";
import {
  createRegistration,
  findRegistrationByPlate,
  getPublicConfig,
  getSetting,
  listRegistrations,
} from "@/lib/google/sheets";
import { fileUrlFor } from "@/lib/storage";
import { registrationSchema } from "@/lib/validations";

function withUrls(reg: Awaited<ReturnType<typeof listRegistrations>>[number]) {
  return {
    ...reg,
    bike_url: fileUrlFor(reg.bike_file_id),
    plate_url: fileUrlFor(reg.plate_file_id),
    rider_url: fileUrlFor(reg.rider_file_id),
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const rows = await listRegistrations();
    return jsonOk({ items: rows.map(withUrls) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const config = await getPublicConfig();
    if (!config.registrationOpen) {
      return jsonError("ระบบปิดรับลงทะเบียนชั่วคราว", 403);
    }

    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
    }

    const data = parsed.data;
    const plate = data.plateNumber.replace(/\s+/g, "");
    const exists = await findRegistrationByPlate(plate);
    if (exists) {
      return jsonError("หมายเลขทะเบียนนี้มีในระบบแล้ว", 409);
    }

    if (!data.bikeFileId || !data.plateFileId || !data.riderFileId) {
      return jsonError("กรุณาอัปโหลดรูปให้ครบทั้ง 3 รูป");
    }

    const academicYear =
      (await getSetting("CURRENT_ACADEMIC_YEAR")) ||
      String(new Date().getFullYear() + 543);

    const reg = await createRegistration({
      updated_by: "public",
      prefix: data.prefix,
      first_name: data.firstName,
      last_name: data.lastName,
      student_id: data.studentId,
      grade: data.grade,
      room: data.room,
      phone: data.phoneNumber,
      brand: data.brand,
      color: data.color,
      plate_number: plate,
      province: data.province,
      helmet: data.helmet,
      pillion_name: data.pillionName || "-",
      bike_file_id: data.bikeFileId,
      plate_file_id: data.plateFileId,
      rider_file_id: data.riderFileId,
      academic_year: academicYear,
      notes: "",
    });

    return jsonOk({ item: withUrls(reg), message: "บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว" });
  } catch (err) {
    return handleApiError(err);
  }
}
