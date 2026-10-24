"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { useAdminUrls } from "@/features/admin/AdminPathContext";

export function AdminLogoutButton() {
  const router = useRouter();
  const { api, href } = useAdminUrls();
  const logout = async () => {
    await fetch(api("/logout"), { method: "POST", credentials: "include" }).catch(() => undefined);
    router.replace(href());
    router.refresh();
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={logout}>
      {sr.admin.logout}
    </Button>
  );
}
