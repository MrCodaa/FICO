"use client";

import { createContext, useContext } from "react";

import { adminApi, adminHref } from "@/lib/admin/path";

// ADMIN_PATH stiže sa servera (stranica panela) i živi samo u panelu,
// ne u javnom JS-u ostalih stranica.
const AdminPathContext = createContext<string | null>(null);

export function AdminPathProvider({ adminPath, children }: { adminPath: string; children: React.ReactNode }) {
  return <AdminPathContext.Provider value={adminPath}>{children}</AdminPathContext.Provider>;
}

export function useAdminUrls() {
  const adminPath = useContext(AdminPathContext);
  if (!adminPath) throw new Error("AdminPathProvider nedostaje");
  return {
    href: (sub = "") => adminHref(adminPath, sub),
    api: (sub = "") => adminApi(adminPath, sub),
  };
}
