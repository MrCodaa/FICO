import { notFound } from "next/navigation";

import { AdminPathProvider } from "@/features/admin/AdminPathContext";
import { AdminLogoutButton } from "@/features/admin/components/AdminLogoutButton";
import { ReportsQueue } from "@/features/admin/components/ReportsQueue";
import { loadAdminAccess } from "@/features/admin/server";

export default async function AdminReportsPage() {
  const { adminPath, access } = await loadAdminAccess();
  if (access.status !== "ok") notFound();
  return (
    <AdminPathProvider adminPath={adminPath}>
      <div className="flex justify-end px-4 pt-4 sm:px-6">
        <AdminLogoutButton />
      </div>
      <ReportsQueue />
    </AdminPathProvider>
  );
}
