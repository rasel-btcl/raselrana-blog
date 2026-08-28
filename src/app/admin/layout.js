// app/admin/layout.js
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session) redirect("/login");

  return <div>{children}</div>;
}
