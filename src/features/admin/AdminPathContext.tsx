"use client";

import { createContext, useContext, useEffect } from "react";

import { adminApi, adminHref } from "@/lib/admin/path";

// ADMIN_PATH stiže sa servera (stranica panela) i živi samo u panelu,
// ne u javnom JS-u ostalih stranica.
const AdminPathContext = createContext<string | null>(null);

export function AdminPathProvider({ adminPath, children }: { adminPath: string; children: React.ReactNode }) {
  // Napuštanje panela (druga adresa, zatvaranje taba/prozora, ali i osvježavanje) odmah gasi admin
  // sesiju. Interna navigacija kroz Next router ne okida `pagehide`, pa ne odjavljuje.
  // sendBeacon nije 100% garantovan; zato kolačić nestaje sa browserom, a server gasi sesiju
  // nakon 15 min neaktivnosti.
  useEffect(() => {
    const logoutUrl = adminApi(adminPath, "/logout");
    const onPageHide = () => {
      navigator.sendBeacon(logoutUrl);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [adminPath]);

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
