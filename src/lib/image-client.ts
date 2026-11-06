/** Client-side image compress (same idea as legacy form.html). */
export async function compressImageFile(
  file: File,
  maxWidth = 800,
  quality = 0.8,
): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
    image.src = dataUrl;
  });

  let width = img.width;
  let height = img.height;
  if (width > maxWidth) {
    height *= maxWidth / width;
    width = maxWidth;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ไม่พร้อมใช้งาน");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("บีบอัดรูปไม่สำเร็จ"))),
      "image/jpeg",
      quality,
    );
  });
  return blob;
}
