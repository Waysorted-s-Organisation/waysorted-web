import crypto from "crypto";

const CLOUDINARY_UPLOAD_MAX_BYTES = 10_000_000;

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured");
  }

  return { cloudName, apiKey, apiSecret };
}

function signUpload(params: Record<string, string | number>, apiSecret: string) {
  const signatureBase = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(`${signatureBase}${apiSecret}`).digest("hex");
}

export async function uploadBlogImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }

  if (file.size > CLOUDINARY_UPLOAD_MAX_BYTES) {
    throw new Error("Image must be 10MB or smaller");
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "waysorted/blogs";
  const uploadParams = { folder, timestamp };
  const signature = signUpload(uploadParams, apiSecret);

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", apiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("folder", folder);
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error?.message || "Cloudinary upload failed");
  }

  return {
    url: body.secure_url,
    publicId: body.public_id,
    width: body.width,
    height: body.height,
    format: body.format,
  };
}

