const DRIVE_ID_RE =
  /(?:\/file\/d\/|id=|\/d\/|open\?id=)([a-zA-Z0-9_-]{10,})/;

export function extractGoogleDriveFileId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{25,}$/.test(raw) && !raw.includes("/")) {
    return raw;
  }

  // Legacy Apps Script URLs: https://lh3.googleusercontent.com/d/{fileId}
  const lh3 = raw.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3?.[1]) return lh3[1];

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (
      host !== "drive.google.com" &&
      host !== "docs.google.com" &&
      host !== "drive.usercontent.google.com" &&
      host !== "lh3.googleusercontent.com"
    ) {
      return null;
    }
    const fromPath = raw.match(DRIVE_ID_RE);
    if (fromPath?.[1]) return fromPath[1];
    const idParam = url.searchParams.get("id");
    if (idParam && /^[a-zA-Z0-9_-]{10,}$/.test(idParam)) return idParam;
  } catch {
    const m = raw.match(DRIVE_ID_RE);
    if (m?.[1]) return m[1];
  }

  return null;
}

export function unwrapDriveFileId(fileId: string): string {
  return fileId.startsWith("link:") ? fileId.slice(5) : fileId;
}
