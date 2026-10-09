import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  isLoginBlocked,
  loginAttemptKey,
  recordLoginAttempt,
} from "./login-rate-limit";
import { prisma } from "./prisma";

// Auth.js uses these paths verbatim, so the Next.js basePath has to be included.
const LOGIN_PATH = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`;

// Compared against when the email is unknown, so both failure cases take the same time.
const DUMMY_HASH = bcrypt.hashSync("invalid-password-placeholder", 12);

// The login page reads `code` to show "too many attempts". The same answer is given
// whether or not the email exists.
class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

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
      async authorize(credentials, request) {
        const rawEmail = credentials?.email;
        const password = credentials?.password;
        if (typeof rawEmail !== "string" || typeof password !== "string") {
          return null;
        }
        if (!rawEmail || !password || password.length > 200) return null;

        const email = rawEmail.trim().toLowerCase();
        const key = loginAttemptKey(email, request);

        if (await isLoginBlocked(key)) throw new RateLimitedSignin();

        const user = await prisma.user.findUnique({ where: { email } });

        const valid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH,
        );
        const success = Boolean(user && valid && user.isActive);

        await recordLoginAttempt(key, success);
        if (!success) return null;

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
    // The role here is only a hint for the UI. Permission checks read the user
    // from the database (src/lib/authz.js).
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
