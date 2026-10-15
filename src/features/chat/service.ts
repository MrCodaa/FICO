import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import type { ChatRepository } from "./repository";
import { toMatchSummaryView, toMessageView } from "./mappers";

export interface ChatServiceDeps {
  repo: ChatRepository;
  clock: Clock;
}

export function createChatService(deps: ChatServiceDeps) {
  const { repo, clock } = deps;

  async function requireMember(userId: string, matchId: string) {
    const member = await repo.isMember(userId, matchId);
    if (!member) throw new ApiError("NOT_A_MATCH", "Nisi član ovog razgovora.");
  }

  return {
    async listMatches(userId: string) {
      const rows = await repo.listMatchesForUser(userId);
      const now = clock.now();
      return {
        items: rows.map((row) =>
          toMatchSummaryView(row.match, row.otherProfile, row.lastMessage?.body ?? null, row.hasUnread, now),
        ),
      };
    },

    async checkMembership(userId: string, matchId: string) {
      return repo.isMember(userId, matchId);
    },

    async listMessages(userId: string, matchId: string, before?: string, limit = 50) {
      await requireMember(userId, matchId);
      const { items, nextBefore } = await repo.listMessages(matchId, before, limit);
      return { items: items.map(toMessageView), nextBefore };
    },

    async sendMessage(userId: string, matchId: string, body: string) {
      await requireMember(userId, matchId);
      const message = await repo.createMessage(matchId, userId, body, clock.now());
      return toMessageView(message);
    },

    async markRead(userId: string, matchId: string) {
      await requireMember(userId, matchId);
      await repo.markRead(matchId, userId, clock.now());
    },

    async getMessagesSince(matchId: string, afterId: bigint) {
      const rows = await repo.getMessagesSince(matchId, afterId);
      return rows.map(toMessageView);
    },
  };
}

export type ChatService = ReturnType<typeof createChatService>;
