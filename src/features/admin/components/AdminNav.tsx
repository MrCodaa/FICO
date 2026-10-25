"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { sr } from "@/content/sr";
import { useAdminUrls } from "@/features/admin/AdminPathContext";
import { AdminLogoutButton } from "@/features/admin/components/AdminLogoutButton";
import { ApiClientError, apiFetch } from "@/lib/http/apiClient";
import { cn } from "@/lib/utils";

const t = sr.adminReports;

/** Gornja navigacija admin panela: Profili na pregledu / Prijave profila (sa brojačem otvorenih) + odjava. */
export function AdminNav({ active }: { active: "profiles" | "reports" }) {
  const { api, href } = useAdminUrls();
  const count = useQuery({
    queryKey: ["admin", "reports", "count"],
    queryFn: () => apiFetch<{ open: number }>(api("/reports/count")),
    refetchInterval: 60_000,
    retry: (failures, error) => !(error instanceof ApiClientError && error.status === 403) && failures < 2,
  });
  const open = count.data?.open ?? 0;
  const pendingQuery = useQuery({
    queryKey: ["admin", "profiles", "count"],
    queryFn: () => apiFetch<{ pending: number }>(api("/profiles/count")),
    refetchInterval: 60_000,
    retry: (failures, error) => !(error instanceof ApiClientError && error.status === 403) && failures < 2,
  });
  const pending = pendingQuery.data?.pending ?? 0;

  const tabClass = (isActive: boolean) =>
    cn(
      "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
      isActive ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-muted/60",
    );

  return (
    <nav aria-label={t.navLabel} className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={href()} className={tabClass(active === "profiles")} aria-current={active === "profiles" ? "page" : undefined}>
          {t.navProfiles}
          {pending > 0 && (
            <span
              className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs leading-5 font-bold text-white"
              aria-label={t.pendingCount(pending)}
            >
              {pending}
            </span>
          )}
        </Link>
        <Link
          href={href("/prijave")}
          className={tabClass(active === "reports")}
          aria-current={active === "reports" ? "page" : undefined}
        >
          {t.navReports}
          {open > 0 && (
            <span
              className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs leading-5 font-bold text-white"
              aria-label={t.openCount(open)}
            >
              {open}
            </span>
          )}
        </Link>
      </div>
      <AdminLogoutButton />
    </nav>
  );
}
