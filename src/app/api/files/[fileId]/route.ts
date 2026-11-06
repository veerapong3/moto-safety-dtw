import { handleApiError, jsonError } from "@/lib/api";
import { getDriveFileContent } from "@/lib/google/drive";
import { Readable } from "stream";

type Ctx = { params: Promise<{ fileId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { fileId } = await ctx.params;
    if (!fileId || fileId.startsWith("blob:")) {
      return jsonError("ไม่รองรับไฟล์นี้", 404);
    }

    const { stream, mimeType, fileName } = await getDriveFileContent(fileId);
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
