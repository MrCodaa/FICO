"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { BackLink } from "@/components/ui/back-link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, PageContainer } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import { DecisionPanel } from "@/features/discover/components/DecisionPanel";
import { EDIT_FILTERS_HREF, FiltersCard, SafetyNote, WhyCard } from "@/features/discover/components/SideCards";
import { ProfileFullView, type ProfileFullViewData } from "@/features/profile/components/ProfileFullView";
import { ApiClientError, apiFetch } from "@/lib/http/apiClient";

import { ProfileLayout } from "../../_components/ProfileLayout";
import { useViewer } from "../../_components/useViewer";

const t = sr.discover;

interface DiscoverNextResponse {
  candidate: (ProfileFullViewData & { userId: string }) | null;
  // score se koristi samo za redoslijed i ne prikazuje se (CLAUDE.md, Discover).
  match: { reasons: string[] } | null;
  likesRemaining: number;
}

function DiscoverSkeleton() {
  return (
    <ProfileLayout
      main={
        <div aria-busy="true" className="flex flex-col gap-8">
          <Skeleton className="h-6 w-24" />
          <div className="flex items-center gap-12">
            <Skeleton className="size-44 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-4">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
          <span className="sr-only">{t.loading}</span>
        </div>
      }
      side={<Skeleton className="h-96 w-full" />}
    />
  );
}

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const viewer = useViewer();
  const nextQuery = useQuery({
    queryKey: ["discover", "next"],
    queryFn: () => apiFetch<DiscoverNextResponse>("/api/discover/next"),
  });

  const loadNext = () => {
    window.scrollTo({ top: 0 });
    // reset (ne invalidate): sljedeći profil se učitava sa skeletonom, bez
    // treptanja starog profila, a fokus prozora ne pokreće skeleton.
    queryClient.resetQueries({ queryKey: ["discover", "next"] });
    queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
  };

  if (nextQuery.isLoading) return <DiscoverSkeleton />;

  if (nextQuery.isError) {
    const notApproved = nextQuery.error instanceof ApiClientError && nextQuery.error.code === "PROFILE_NOT_APPROVED";
    return (
      <PageContainer width="narrow">
        <EmptyState>
          <p>{notApproved ? t.forbidden : t.error}</p>
          {notApproved && (
            <Link href="/app/profile" className={buttonVariants({ variant: "outline" })}>
              {t.forbiddenLink}
            </Link>
          )}
        </EmptyState>
      </PageContainer>
    );
  }

  const candidate = nextQuery.data?.candidate ?? null;

  if (!candidate) {
    return (
      <PageContainer width="narrow" className="pt-16">
        <EmptyState>
          <p className="text-foreground text-lg">{t.empty}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={EDIT_FILTERS_HREF} className={buttonVariants({ variant: "outline" })}>
              {t.editFilters}
            </Link>
            <Link href="/app/revisit/thinking" className={buttonVariants({ variant: "outline" })}>
              {t.viewThinking}
            </Link>
          </div>
        </EmptyState>
      </PageContainer>
    );
  }

  return (
    <ProfileLayout
      main={
        <>
          <BackLink label={sr.profileView.back} fallback="/app" />
          <ProfileFullView profile={candidate} viewerInterests={viewer.interests} />
        </>
      }
      side={
        <>
          <DecisionPanel
            key={candidate.userId}
            targetId={candidate.userId}
            likesRemaining={nextQuery.data?.likesRemaining ?? null}
            onDecided={loadNext}
          />
          <WhyCard reasons={nextQuery.data?.match?.reasons ?? []} />
          <FiltersCard filters={viewer.filters} />
          <SafetyNote userId={candidate.userId} onBlocked={loadNext} onReported={loadNext} />
        </>
      }
    />
  );
}
