import { AdminPathProvider } from "@/features/admin/AdminPathContext";
import { AdminLoginForm } from "@/features/admin/components/AdminLoginForm";
import { AdminNav } from "@/features/admin/components/AdminNav";
import { ReviewQueue } from "@/features/admin/components/ReviewQueue";
import { loadAdminAccess } from "@/features/admin/server";

// Tačan ADMIN_PATH: bez sesije forma za prijavu, sa sesijom panel.
export default async function AdminHomePage() {
  const { adminPath, access } = await loadAdminAccess();
  return (
    <AdminPathProvider adminPath={adminPath}>
      {access.status === "ok" ? (
        <>
          <AdminNav active="profiles" />
          <ReviewQueue />
        </>
      ) : (
        <AdminLoginForm />
      )}
    </AdminPathProvider>
  );
}
