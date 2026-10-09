import cloudinary, { UPLOAD_FOLDER } from "@/lib/cloudinary";
import { requireApiUser } from "@/lib/require-admin";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // Vercel rejects request bodies above ~4.5 MB
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request) {
  const { response } = await requireApiUser();
  if (response) return response;

  let file;
  try {
    const formData = await request.formData();
    file = formData.get("file");
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF and AVIF images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Image must be 4 MB or smaller" },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: UPLOAD_FOLDER,
          resource_type: "image",
          allowed_formats: Object.values(ALLOWED_TYPES),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
