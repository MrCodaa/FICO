"use client";

import Link from "next/link";
import { Handshake, Mail, MessageSquare, Search, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, buttonVariants } from "@/components/ui/button";
import { PageBand } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import { FiltersCard } from "@/features/discover/components/SideCards";
import { apiFetch, fetchMe } from "@/lib/http/apiClient";
import { plural } from "@/lib/plural";
import { cn } from "@/lib/utils";

import { useViewer } from "../_components/useViewer";

const t = sr.dashboard;

interface Dashboard {
  profileStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  queueCount: number;
  thinkingCount: number;
  newRequests: number;
  unreadMessages: number;
  matchCount: number;
}

type CountText = { before: string; after: readonly [string, string, string]; action: string };

function StatCard({
  icon: Icon,
  count,
  text,
  href,
  disabled,
}: {
  icon: LucideIcon;
  count: number;
  text: CountText;
  href: string;
  disabled?: boolean;
}) {
  return (
    <div className="bg-card flex flex-col items-center gap-6 rounded-md border px-6 py-10 md:px-10">
      <div className="flex items-start gap-4 self-stretch">
        <Icon className="mt-1 size-6 shrink-0" strokeWidth={2.4} fill={Icon === Star ? "currentColor" : "none"} />
        <p className="text-xl leading-snug font-semibold">
          {text.before}
          {count}
          {plural(count, text.after)}
        </p>
      </div>
      {disabled ? (
        <span className={cn(buttonVariants({ variant: "outline", size: "lg" }), "pointer-events-none opacity-50")}>
          {text.action}
        </span>
      ) : (
        <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-normal")}>
          {text.action}
        </Link>
      )}
    </div>
  );
}

/** Resend je javio bounce/complaint: adresa je na blacklisti. "Odblokiraj" skida blok i šalje novi mejl za potvrdu. */
function EmailBlockedCard({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const unblock = useMutation({
    mutationFn: () => apiFetch<void>("/api/me/email-unblock", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/10 flex flex-col gap-3 rounded-md border px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1">
        <p className="text-destructive text-lg font-semibold">{t.emailBlocked.title}</p>
        <p>{t.emailBlocked.body(email)}</p>
        {unblock.isError && <p className="text-destructive text-sm">{t.error}</p>}
      </div>
      <Button type="button" variant="outline" disabled={unblock.isPending} onClick={() => unblock.mutate()}>
        {t.emailBlocked.action}
      </Button>
    </div>
  );
}

/** Profil je poslat na pregled: velika kartica preko cijele širine, prva na tabli. */
function PendingReviewCard() {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-md border-2 border-amber-400 bg-amber-50 px-6 py-8 text-amber-950 md:px-10 md:py-10"
    >
      <p className="text-3xl font-bold tracking-tight">{t.pendingTitle}</p>
      <p className="max-w-4xl text-lg leading-relaxed">{t.pendingBody}</p>
    </div>
  );
}

function StatusBar({ data }: { data: Dashboard }) {
  if (data.profileStatus === "APPROVED" || data.profileStatus === "PENDING_REVIEW") return null;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 px-6 py-5 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        {data.profileStatus === "DRAFT" && <p className="text-lg font-semibold">{t.draft}</p>}
        {data.profileStatus === "REJECTED" && (
          <>
            <p className="text-lg font-semibold">
              {data.rejectionReason ? t.rejected : t.rejectedNoReason}
            </p>
            {data.rejectionReason && <p>{data.rejectionReason}</p>}
          </>
        )}
      </div>
      <Link href="/app/profile" className={buttonVariants({ variant: "outline" })}>
        {data.profileStatus === "REJECTED" ? t.rejectedFix : t.editProfile}
      </Link>
    </div>
  );
}

/** Kontrolna tabla (docs/ui-spec.md §4, yc-dashboard.png). */
export default function DashboardPage() {
  const viewer = useViewer();
  const query = useQuery({ queryKey: ["dashboard"], queryFn: () => apiFetch<Dashboard>("/api/dashboard") });
  const data = query.data;
  const me = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const approved = data?.profileStatus === "APPROVED";

  return (
    <>
      <PageBand title={t.title} />
      {data?.profileStatus === "PENDING_REVIEW" && (
        <div className="px-4 pt-8 sm:px-8 xl:px-20">
          <PendingReviewCard />
        </div>
      )}
      <div className="grid items-start gap-8 px-4 py-8 sm:px-8 md:py-10 xl:grid-cols-[minmax(0,1fr)_32rem] xl:gap-16 xl:px-20">
        <div className="flex min-w-0 flex-col gap-6">
          {me.data?.emailBlocked && <EmailBlockedCard email={me.data.email} />}
          {data && <StatusBar data={data} />}
          {!data ? (
            query.isError ? (
              <p className="text-destructive">{t.error}</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-56 w-full" />
                ))}
              </div>
            )
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <StatCard icon={Search} count={data.queueCount} text={t.queue} href="/app/discover" disabled={!approved} />
              <StatCard
                icon={Star}
                count={data.thinkingCount}
                text={t.thinking}
                href="/app/revisit/thinking"
                disabled={!approved}
              />
              <StatCard
                icon={Mail}
                count={data.newRequests}
                text={t.requests}
                href="/app/requests"
                disabled={!approved}
              />
              <StatCard
                icon={MessageSquare}
                count={data.unreadMessages}
                text={t.messages}
                href="/app/messages"
                disabled={!approved}
              />
              {data.matchCount > 0 && (
                <StatCard
                  icon={Handshake}
                  count={data.matchCount}
                  text={t.matches}
                  href="/app/messages"
                  disabled={!approved}
                />
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-8">
          <div className="bg-card rounded-md border">
            <h2 className="border-b px-8 py-7 text-3xl font-semibold tracking-tight">{t.howTitle}</h2>
            <p className="px-8 py-8 text-lg leading-relaxed">
              {t.howBefore}
              <strong className="font-bold">{t.howCount}</strong>
              {t.howAfter}
            </p>
          </div>
          <FiltersCard filters={viewer.filters} className="px-8 py-7" />
          <div className="bg-card rounded-md border px-8 py-8">
            <p className="leading-relaxed">{t.trust}</p>
          </div>
        </aside>
      </div>
    </>
  );
}
