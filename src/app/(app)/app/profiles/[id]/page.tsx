"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { BackLink } from "@/components/ui/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, PageContainer } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import { DecisionPanel } from "@/features/discover/components/DecisionPanel";
import { SafetyNote, WhyCard } from "@/features/discover/components/SideCards";
import { ProfileFullView, type ProfileFullViewData } from "@/features/profile/components/ProfileFullView";
import { byGender } from "@/features/profile/summary";
import { StatusBadge, type DisplayStatus } from "@/features/requests/components/StatusBadge";
import { apiFetch } from "@/lib/http/apiClient";

import { ProfileLayout } from "../../../_components/ProfileLayout";
import { useViewer } from "../../../_components/useViewer";

const t = sr.publicProfile;

type Relation =
  | { kind: "MATCH"; matchId: string }
  | { kind: "SENT"; requestId: string; sentAt: string; message: string; displayStatus: DisplayStatus }
  | { kind: "RECEIVED"; requestId: string; receivedAt: string; message: string; expiresAt: string }
  | { kind: "NONE"; decision: "THINKING" | "NOT_INTERESTED" | null };

interface ProfileResponse {
  profile: ProfileFullViewData & { userId: string };
  match: { reasons: string[] };
  relation: Relation;
  likesRemaining: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sr-Latn", { day: "numeric", month: "long", year: "numeric" });
}

function SideCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-md border px-6 py-6 md:px-8">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return <p className="bg-surface rounded-md border px-4 py-3 text-lg leading-relaxed whitespace-pre-line">{children}</p>;
}

function ReceivedPanel({
  relation,
  gender,
  onDeclined,
}: {
  relation: Extract<Relation, { kind: "RECEIVED" }>;
  gender: string | null | undefined;
  onDeclined: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accept = useMutation({
    mutationFn: () => apiFetch<{ matchId: string }>(`/api/requests/${relation.requestId}/accept`, { method: "POST" }),
    onSuccess: ({ matchId }) => {
      queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      router.push(`/app/messages/${matchId}`);
    },
  });
  const decline = useMutation({
    mutationFn: () => apiFetch<void>(`/api/requests/${relation.requestId}/decline`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "counts"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      onDeclined();
    },
  });
  const busy = accept.isPending || decline.isPending;
  return (
    <SideCard title={t.receivedTitle}>
      <p className="font-semibold">{byGender(t.theirMessage, gender)}</p>
      <Quote>{relation.message}</Quote>
      {(accept.isError || decline.isError) && <p className="text-destructive text-sm">{t.error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" disabled={busy} onClick={() => accept.mutate()}>
          {t.accept}
        </Button>
        <Button type="button" variant="neutral" disabled={busy} onClick={() => decline.mutate()}>
          {t.decline}
        </Button>
      </div>
    </SideCard>
  );
}

const decisionLabel = { THINKING: sr.discover.think, NOT_INTERESTED: sr.discover.notInterested } as const;

/** Javni profil (docs/ui-spec.md §3): sredina kao Discover, desna kolona po odnosu. */
export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const viewer = useViewer();
  const query = useQuery({
    queryKey: ["profiles", id],
    queryFn: () => apiFetch<ProfileResponse>(`/api/profiles/${id}`),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["profiles", id] });

  if (query.isLoading) {
    return (
      <ProfileLayout
        main={<Skeleton className="h-[36rem] w-full" />}
        side={<Skeleton className="h-80 w-full" />}
      />
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageContainer width="narrow" className="pt-16">
        <EmptyState>
          <p className="text-foreground text-lg">{t.notFound}</p>
        </EmptyState>
      </PageContainer>
    );
  }

  const { profile, relation, match, likesRemaining } = query.data;

  let panel: React.ReactNode;
  switch (relation.kind) {
    case "MATCH":
      panel = (
        <SideCard title={t.matchTitle}>
          <p>{t.matchText}</p>
          <Link href={`/app/messages/${relation.matchId}`} className={buttonVariants()}>
            {t.openMessages}
          </Link>
        </SideCard>
      );
      break;
    case "SENT":
      panel = (
        <SideCard title={t.sentTitle(formatDate(relation.sentAt))}>
          <StatusBadge status={relation.displayStatus} className="self-start" />
          <p className="font-semibold">{t.yourMessage}</p>
          <Quote>{relation.message}</Quote>
        </SideCard>
      );
      break;
    case "RECEIVED":
      panel = <ReceivedPanel relation={relation} gender={profile.gender} onDeclined={refresh} />;
      break;
    default:
      panel = (
        <div className="flex flex-col gap-3">
          {relation.decision && (
            <p className="text-muted-foreground text-center">{t.currentDecision(decisionLabel[relation.decision])}</p>
          )}
          <DecisionPanel targetId={profile.userId} likesRemaining={likesRemaining} onDecided={refresh} />
        </div>
      );
  }

  return (
    <ProfileLayout
      main={
        <>
          <BackLink label={sr.profileView.back} fallback="/app" />
          <ProfileFullView profile={profile} viewerInterests={viewer.interests} />
        </>
      }
      side={
        <>
          {panel}
          <WhyCard reasons={match.reasons} />
          <SafetyNote userId={profile.userId} onBlocked={() => window.location.assign("/app")} />
        </>
      }
    />
  );
}
