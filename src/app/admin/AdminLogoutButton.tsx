"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

export function AdminLogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    router.replace("/admin/prijava");
    router.refresh();
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={logout}>
      {sr.admin.logout}
    </Button>
  );
}
