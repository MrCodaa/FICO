import type { RequestStatus } from "@/generated/prisma/client";
import type { ProfileRecord } from "@/features/profile/repository";
import { toProfileCard, type ProfileCard } from "@/features/discover/mappers";
import { toDisplayStatus } from "./repository";

export interface ReceivedRequestView {
  id: string;
  message: string;
  createdAt: Date;
  expiresAt: Date;
  sender: ProfileCard;
  match: { score: number; reasons: string[] };
}

export interface SentRequestView {
  id: string;
  displayStatus: "PENDING" | "MATCHED" | "NOT_ACCEPTED";
  receiver: ProfileCard;
  matchId: string | null;
}

export function toReceivedRequestView(
  item: { id: string; message: string; createdAt: Date; expiresAt: Date; senderProfile: ProfileRecord },
  now: Date,
  match: { score: number; reasons: string[] },
): ReceivedRequestView {
  return {
    id: item.id,
    message: item.message,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
    sender: toProfileCard(item.senderProfile, now),
    match,
  };
}

export function toSentRequestView(
  item: { id: string; status: RequestStatus; expiresAt: Date; receiverProfile: ProfileRecord; matchId: string | null },
  now: Date,
): SentRequestView {
  return {
    id: item.id,
    displayStatus: toDisplayStatus({ status: item.status, expiresAt: item.expiresAt }, now),
    receiver: toProfileCard(item.receiverProfile, now),
    matchId: item.matchId,
  };
}
