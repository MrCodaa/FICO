import { toProfileCard, type ProfileCard } from "@/features/discover/mappers";
import type { ProfileRecord } from "@/features/profile/repository";

export interface MessageView {
  id: string; // BigInt kao string
  matchId: string;
  senderId: string;
  body: string;
  readAt: string | null; // ISO string
  createdAt: string; // ISO string
}

export function toMessageView(message: {
  id: bigint;
  matchId: string;
  senderId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}): MessageView {
  return {
    id: message.id.toString(),
    matchId: message.matchId,
    senderId: message.senderId,
    body: message.body,
    readAt: message.readAt ? message.readAt.toISOString() : null,
    createdAt: message.createdAt.toISOString(),
  };
}

export interface MatchSummaryView {
  id: string;
  other: ProfileCard;
  lastMessage: string | null;
  unread: boolean;
  lastMessageAt: string | null;
}

export function toMatchSummaryView(
  match: { id: string; lastMessageAt: Date | null },
  otherProfile: ProfileRecord,
  lastMessageBody: string | null,
  hasUnread: boolean,
  now: Date,
): MatchSummaryView {
  return {
    id: match.id,
    other: toProfileCard(otherProfile, now),
    lastMessage: lastMessageBody,
    unread: hasUnread,
    lastMessageAt: match.lastMessageAt ? match.lastMessageAt.toISOString() : null,
  };
}
