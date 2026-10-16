import type { ProfileCardData } from "@/features/profile/components/ProfileListCard";
import { apiFetch } from "@/lib/http/apiClient";

export interface MatchItem {
  id: string;
  other: ProfileCardData;
  lastMessage: string | null;
  unread: boolean;
  lastMessageAt: string | null;
}

/** Lista matcheva (ključ ["matches"]) — dijele je lista lijevo i zaglavlje chata. */
export const fetchMatches = () => apiFetch<{ items: MatchItem[] }>("/api/matches");
