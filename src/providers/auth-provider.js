// src/providers/auth-provider.js
"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }) {
  return (
    <SessionProvider basePath="/blog/api/auth">{children}</SessionProvider>
  );
}
