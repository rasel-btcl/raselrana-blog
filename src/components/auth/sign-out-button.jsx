"use client";

import { signOut } from "next-auth/react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: `${basePath}/login` })}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      Sign out
    </button>
  );
}
