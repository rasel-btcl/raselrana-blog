import { ActionError } from "@/lib/admin-action";
import { UPLOAD_FOLDER } from "@/lib/cloudinary";
import { SLUG_PATTERN } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 12;
export const SOCIAL_NETWORKS = ["linkedin", "github", "facebook", "x"];

const AVATAR_PREFIX = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;

const oneLine = (text) => text.trim().replace(/\s+/g, " ");

/** Optional https address; `null` when empty. */
const optionalUrl = (label) =>
  z
    .string()
    .default("")
    .transform((text) => text.trim())
    .refine(
      (text) => !text || (/^https:\/\/\S+$/.test(text) && URL.canParse(text)),
      `${label} must be a full https:// address`,
    )
    .transform((text) => text || null);

export const profileSchema = z.object({
  name: z
    .string("Name is required")
    .transform(oneLine)
    .pipe(z.string().min(1, "Name is required").max(80, "Name is too long")),
  // Part of the author page address: /blog/author/<username>
  username: z
    .string("Username is required")
    .transform((text) => text.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(2, "Username must be at least 2 characters")
        .max(40, "Username is too long")
        .regex(
          SLUG_PATTERN,
          "Username may only contain lowercase letters, numbers and single hyphens",
        ),
    ),
  bio: z
    .string()
    .default("")
    .transform((text) => text.trim())
    .pipe(z.string().max(600, "Bio must be 600 characters or fewer"))
    .transform((text) => text || null),
  website: optionalUrl("Website"),
  // Only an image uploaded to our own Cloudinary folder is accepted.
  avatarUrl: z
    .string()
    .default("")
    .transform((text) => text.trim())
    .refine(
      (text) =>
        !text ||
        (text.startsWith(AVATAR_PREFIX) && text.includes(`/${UPLOAD_FOLDER}/`)),
      "Invalid profile picture",
    )
    .transform((text) => text || null),
  socialLinks: z.object({
    linkedin: optionalUrl("LinkedIn link"),
    github: optionalUrl("GitHub link"),
    facebook: optionalUrl("Facebook link"),
    x: optionalUrl("X link"),
  }),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password").max(200),
    next: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `The new password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      )
      .max(200, "The new password is too long"),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, "The two new passwords do not match")
  .refine(
    (value) => value.next !== value.current,
    "The new password must be different from the current one",
  );

export async function getProfile(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      website: true,
      socialLinks: true,
    },
  });
}

/** Returns `{ before, after }` (usernames), so the caller can refresh the author pages. */
export async function updateProfile(userId, input) {
  const data = profileSchema.parse(input);

  const taken = await prisma.user.findFirst({
    where: { username: data.username, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) throw new ActionError("That username is already taken.");

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const after = await prisma.user.update({
    where: { id: userId },
    data,
    select: { username: true },
  });
  return { before: before.username, after: after.username };
}

export async function changePassword(userId, input) {
  const { current, next } = passwordSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    throw new ActionError("The current password is not correct.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });
}
