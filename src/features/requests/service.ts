import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import { evaluateMatch } from "@/lib/matching/score";
import type { CreateRequestInput } from "./schemas";
import type { RequestRepository } from "./repository";
import { toReceivedRequestView, toSentRequestView } from "./mappers";

export interface RequestServiceDeps {
  repo: RequestRepository;
  clock: Clock;
}

export function createRequestService(deps: RequestServiceDeps) {
  const { repo, clock } = deps;

  // Zahtjevi i matchevi ne šalju mail — korisnik dobija samo zvonce (notifikacija se upisuje u transakciji repoa).
  return {
    async sendRequest(senderId: string, input: CreateRequestInput) {
      const created = await repo.createRequest(senderId, input, clock.now());
      const likesRemaining = await repo.getLikesRemaining(senderId, clock.now());
      return { ...created, likesRemaining };
    },

    async listReceived(receiverId: string, cursor?: string, limit = 20) {
      const now = clock.now();
      const [{ items, nextCursor }, viewer] = await Promise.all([
        repo.listReceived(receiverId, cursor, limit, now),
        repo.getViewerMatchPerson(receiverId),
      ]);
      const views = await Promise.all(
        items.map(async (item) => {
          if (!viewer) return toReceivedRequestView(item, now, { score: 0, reasons: [] });
          const senderPerson = await repo.getMatchPersonForProfile(item.senderProfile);
          const result = evaluateMatch(viewer, senderPerson, now);
          return toReceivedRequestView(item, now, { score: result.score, reasons: result.reasons });
        }),
      );
      return { items: views, nextCursor };
    },

    async listSent(senderId: string, cursor?: string, limit = 20) {
      const now = clock.now();
      const { items, nextCursor } = await repo.listSent(senderId, cursor, limit);
      return { items: items.map((item) => toSentRequestView(item, now)), nextCursor };
    },

    async acceptRequest(receiverId: string, requestId: string) {
      const result = await repo.acceptRequest(receiverId, requestId, clock.now());
      if (result === "NOT_PENDING") throw new ApiError("REQUEST_NOT_PENDING", "Zahtjev nije na čekanju.");
      return { matchId: result.matchId };
    },

    async declineRequest(receiverId: string, requestId: string) {
      const ok = await repo.declineRequest(receiverId, requestId, clock.now());
      if (!ok) throw new ApiError("REQUEST_NOT_PENDING", "Zahtjev nije na čekanju.");
    },

    async expireRequests() {
      return repo.expireRequests(clock.now());
    },
  };
}

export type RequestService = ReturnType<typeof createRequestService>;
