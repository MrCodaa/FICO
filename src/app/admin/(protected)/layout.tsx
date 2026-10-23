import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { checkAdminSession } from "@/lib/auth/adminAccess";
import { verifySessionToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { AdminLogoutButton } from "../AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const result = await checkAdminSession(token ? await verifySessionToken(token) : null);
  if (result.status === "no-session") redirect("/admin/prijava");
  if (result.status === "forbidden") notFound();

  return (
    <>
      <div className="flex justify-end px-4 pt-4 sm:px-6">
        <AdminLogoutButton />
      </div>
      {children}
    </>
  );
}
