import { AdminPathProvider } from "@/features/admin/AdminPathContext";
import { AdminLoginForm } from "@/features/admin/components/AdminLoginForm";
import { AdminLogoutButton } from "@/features/admin/components/AdminLogoutButton";
import { ReviewQueue } from "@/features/admin/components/ReviewQueue";
import { loadAdminAccess } from "@/features/admin/server";

// Tačan ADMIN_PATH: bez sesije forma za prijavu, sa sesijom panel.
export default async function AdminHomePage() {
  const { adminPath, access } = await loadAdminAccess();
  return (
    <AdminPathProvider adminPath={adminPath}>
      {access.status === "ok" ? (
        <>
          <div className="flex justify-end px-4 pt-4 sm:px-6">
            <AdminLogoutButton />
          </div>
          <ReviewQueue />
        </>
      ) : (
        <AdminLoginForm />
      )}
    </AdminPathProvider>
  );
}
