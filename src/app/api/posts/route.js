import { UPLOAD_FOLDER } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TITLE_LENGTH = 200;
const MAX_SLUG_LENGTH = 120;
const MAX_CONTENT_LENGTH = 200_000;

const CLOUDINARY_URL_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;

function badRequest(error) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (
    typeof body?.title !== "string" ||
    typeof body?.slug !== "string" ||
    typeof body?.content !== "string"
  ) {
    return badRequest("Missing required fields");
  }

  const title = body.title.trim();
  const slug = body.slug.trim().toLowerCase();
  const content = body.content;

  if (!title || !slug || !content.trim()) {
    return badRequest("Missing required fields");
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return badRequest(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) {
    return badRequest(
      "Slug may only contain lowercase letters, numbers and single hyphens",
    );
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return badRequest("Content is too long");
  }

  // Only accept a cover that came from our own Cloudinary upload folder.
  let coverUrl = null;
  let coverPublicId = null;
  if (body.coverImage != null) {
    const { url, publicId } = body.coverImage;
    if (
      typeof url !== "string" ||
      typeof publicId !== "string" ||
      !url.startsWith(CLOUDINARY_URL_PREFIX) ||
      !publicId.startsWith(`${UPLOAD_FOLDER}/`)
    ) {
      return badRequest("Invalid cover image");
    }
    coverUrl = url;
    coverPublicId = publicId;
  }

  try {
    const post = await prisma.post.create({
      data: { title, slug, content, coverUrl, coverPublicId, published: false },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 },
      );
    }

    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
