import type { DecisionType, Gender, IdeaStatus, Timing } from "@/generated/prisma/client";
import type { ProfileRecord } from "@/features/profile/repository";
import { effectiveStatus, toDisplayStatus } from "@/features/requests/repository";
import { normalizeCityName } from "@/content/catalog";
import { computeAge } from "@/lib/age";
import type { RelationRow } from "./repository";

export interface ProfileCard {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
  // Za rečenicu-rezime na karticama u listama ("Ja sam tehnički, spreman odmah…").
  gender: Gender | null;
  isTechnical: boolean | null;
  timing: Timing | null;
  ideaStatus: IdeaStatus | null;
}

export function toProfileCard(profile: ProfileRecord, now: Date): ProfileCard {
  return {
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    photoUrl: profile.photoUrl,
    countryCode: profile.countryCode,
    city: profile.city ? normalizeCityName(profile.city, profile.countryCode) : profile.city,
    // Podešavanja → "sakrij godine": drugi ne vide godine.
    age: profile.birthDate && !profile.hideAge ? computeAge(profile.birthDate, now) : null,
    gender: profile.gender,
    isTechnical: profile.isTechnical,
    timing: profile.timing,
    ideaStatus: profile.ideaStatus,
  };
}

/** Odnos gledaoca i profila — određuje desnu kolonu javnog profila (ui-spec §3). */
export type ProfileRelation =
  | { kind: "MATCH"; matchId: string }
  | {
      kind: "SENT";
      requestId: string;
      sentAt: Date;
      message: string;
      displayStatus: "PENDING" | "MATCHED" | "NOT_ACCEPTED";
    }
  | { kind: "RECEIVED"; requestId: string; receivedAt: Date; message: string; expiresAt: Date }
  | { kind: "NONE"; decision: DecisionType | null };

export function toRelation(row: RelationRow, now: Date): ProfileRelation {
  if (row.matchId) return { kind: "MATCH", matchId: row.matchId };
  if (row.sent) {
    return {
      kind: "SENT",
      requestId: row.sent.id,
      sentAt: row.sent.createdAt,
      message: row.sent.message,
      displayStatus: toDisplayStatus(row.sent, now),
    };
  }
  if (row.received && effectiveStatus(row.received, now) === "PENDING") {
    return {
      kind: "RECEIVED",
      requestId: row.received.id,
      receivedAt: row.received.createdAt,
      message: row.received.message,
      expiresAt: row.received.expiresAt,
    };
  }
  return { kind: "NONE", decision: row.decision };
}
