import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export interface SavedAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

const DEFAULT_MAX_SIZE = 25_000_000; // 25MB default
const allowedMime = /image|pdf/i;

async function ensureUploadDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveAttachmentsFromFormData(formData: FormData): Promise<SavedAttachment[]> {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || `${DEFAULT_MAX_SIZE}`, 10);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await ensureUploadDir(uploadsDir);

  const files = formData.getAll("attachments");
  const saved: SavedAttachment[] = [];

  for (const entry of files) {
    if (!(entry instanceof File)) continue;
    if (!entry.size) continue;
    if (entry.size > maxSize) {
      throw new Error(`File too large: ${entry.name}`);
    }
    if (!allowedMime.test(entry.type)) {
      throw new Error(`Unsupported file type: ${entry.type || "unknown"}`);
    }

    const arrayBuffer = await entry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = path.extname(entry.name) || "";
    const filename = `${crypto.randomBytes(6).toString("hex")}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.writeFile(filePath, buffer);

    saved.push({
      filename,
      originalName: entry.name,
      mimetype: entry.type,
      size: entry.size,
      url: `/uploads/${filename}`,
    });
  }

  return saved;
}

export function parseString(field: FormDataEntryValue | null, fallback = "") {
  if (typeof field === "string") return field;
  return fallback;
}
