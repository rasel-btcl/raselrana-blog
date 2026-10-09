import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";

// Auth.js uses these paths verbatim, so the Next.js basePath has to be included.
const LOGIN_PATH = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`;

// Compared against when the email is unknown, so both failure cases take the same time.
const DUMMY_HASH = bcrypt.hashSync("invalid-password-placeholder", 12);

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/api/auth",
  session: { strategy: "jwt" },
  pages: {
    signIn: LOGIN_PATH,
    error: LOGIN_PATH,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        if (!email || !password || password.length > 200) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        });

        const valid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH,
        );
        if (!user || !valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
});
