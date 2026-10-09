"use client";

import { buttonSmall } from "@/lib/ui";
import { signOut } from "next-auth/react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `${basePath}/admin/login` })}
      className={buttonSmall}
    >
      Sign out
    </button>
  );
}
