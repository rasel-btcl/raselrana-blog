"use client";

import { SessionProvider } from "next-auth/react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function AuthProvider({ children }) {
  return (
    <SessionProvider basePath={`${basePath}/api/auth`}>
      {children}
    </SessionProvider>
  );
}
