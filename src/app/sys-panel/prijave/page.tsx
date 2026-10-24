import { notFound } from "next/navigation";

import { AdminPathProvider } from "@/features/admin/AdminPathContext";
import { AdminNav } from "@/features/admin/components/AdminNav";
import { ReportsQueue } from "@/features/admin/components/ReportsQueue";
import { loadAdminAccess } from "@/features/admin/server";

export default async function AdminReportsPage() {
  const { adminPath, access } = await loadAdminAccess();
  if (access.status !== "ok") notFound();
  return (
    <AdminPathProvider adminPath={adminPath}>
      <AdminNav active="reports" />
      <ReportsQueue />
    </AdminPathProvider>
  );
}
