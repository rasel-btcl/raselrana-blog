import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const { title, slug, content, coverImage } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        coverUrl: coverImage?.url || null,
        coverPublicId: coverImage?.publicId || null,
        published: false,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Post creation error:", error);

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
