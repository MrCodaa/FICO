import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import { evaluateMatch } from "@/lib/matching/score";
import { toProfileView } from "@/features/profile/mappers";
import type { DecisionType } from "@/generated/prisma/client";
import type { DiscoverRepository } from "./repository";
import { toProfileCard } from "./mappers";

export interface DiscoverServiceDeps {
  repo: DiscoverRepository;
  clock: Clock;
}

const DEFAULT_CANDIDATE_LIMIT = 200;

export function createDiscoverService(deps: DiscoverServiceDeps) {
  const { repo, clock } = deps;

  return {
    async getNext(viewerId: string) {
      const viewer = await repo.getViewerPerson(viewerId);
      if (!viewer) throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      const now = clock.now();
      const excluded = await repo.getExcludedUserIds(viewerId, now);
      const candidates = await repo.listCandidates(viewerId, excluded, DEFAULT_CANDIDATE_LIMIT);
      const likesRemaining = await repo.getLikesRemaining(viewerId, now);

      const scored = candidates
        .map((row) => ({ row, result: evaluateMatch(viewer, row.person, now) }))
        .filter(({ result }) => result.requiredSatisfied)
        .sort((a, b) => {
          if (b.result.score !== a.result.score) return b.result.score - a.result.score;
          return b.row.person.profile.lastActiveAt.getTime() - a.row.person.profile.lastActiveAt.getTime();
        });

      const top = scored[0];
      if (!top) return { candidate: null, match: null, likesRemaining };
      return {
        candidate: toProfileView(top.row.profile, now),
        match: { score: top.result.score, reasons: top.result.reasons },
        likesRemaining,
      };
    },

    async getProfile(viewerId: string, targetUserId: string) {
      const viewer = await repo.getViewerPerson(viewerId);
      if (!viewer) throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      const candidate = await repo.getCandidateById(viewerId, targetUserId);
      if (!candidate) throw new ApiError("NOT_FOUND", "Profil nije dostupan.");
      const now = clock.now();
      const result = evaluateMatch(viewer, candidate.person, now);
      return {
        profile: toProfileView(candidate.profile, now),
        match: { score: result.score, reasons: result.reasons },
      };
    },

    async setDecision(viewerId: string, targetId: string, type: DecisionType) {
      await repo.upsertDecision(viewerId, targetId, type, clock.now());
      return { type };
    },

    async clearDecision(viewerId: string, targetId: string) {
      await repo.deleteDecision(viewerId, targetId);
    },

    async listDecisions(viewerId: string, type: DecisionType, cursor?: string, limit = 20) {
      const viewer = await repo.getViewerPerson(viewerId);
      if (!viewer) throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      const { items, nextCursor } = await repo.listDecisions(viewerId, type, cursor, limit);
      const now = clock.now();
      return {
        items: items.map((item) => {
          const result = evaluateMatch(viewer, item.person, now);
          return {
            profile: toProfileCard(item.profile, now),
            match: { score: result.score, reasons: result.reasons },
            decidedAt: item.decidedAt,
          };
        }),
        nextCursor,
      };
    },
  };
}

export type DiscoverService = ReturnType<typeof createDiscoverService>;
