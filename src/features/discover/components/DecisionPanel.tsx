"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";
import { apiFetch } from "@/lib/http/apiClient";
import { likeErrorMessage } from "../likeError";

const t = sr.discover;
const MAX_MESSAGE = 500;

export type Decision = "LIKE" | "THINKING" | "NOT_INTERESTED";

/**
 * Tri odluke (mjesto YC Invite/Skip/Save, docs/ui-spec.md §2): kartica
 * "Sviđa mi se" sa obaveznom porukom, ispod Razmisliću i Ne zanima me.
 * Svaka odluka javlja onDecided — Discover tada učitava sljedeći profil.
 */
export function DecisionPanel({
  targetId,
  likesRemaining,
  onDecided,
  hide,
}: {
  targetId: string;
  likesRemaining: number | null;
  onDecided: (decision: Decision) => void;
  /** Odluka koja je već na snazi (profil otvoren iz tog taba): njeno dugme se ne nudi. */
  hide?: "THINKING" | "NOT_INTERESTED" | null;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const likeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ likesRemaining: number }>("/api/requests", {
        method: "POST",
        json: { receiverId: targetId, message: message.trim() },
      }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onDecided("LIKE");
    },
  });

  const decisionMutation = useMutation({
    mutationFn: (type: "THINKING" | "NOT_INTERESTED") =>
      apiFetch<void>(`/api/decisions/${targetId}`, { method: "PUT", json: { type } }),
    onSuccess: (_data, type) => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onDecided(type);
    },
  });

  const trimmed = message.trim();
  const busy = likeMutation.isPending || decisionMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card flex flex-col gap-4 rounded-md border px-6 py-6 md:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">{t.likeTitle}</h2>
        <div className="flex flex-col gap-1.5">
          <Textarea
            value={message}
            maxLength={MAX_MESSAGE}
            onChange={(e) => {
              setMessage(e.target.value);
              likeMutation.reset();
            }}
            placeholder={t.messagePlaceholder}
            disabled={busy}
            className="min-h-36 text-lg"
          />
          <span className="text-muted-foreground self-end text-sm tabular-nums">{t.charCount(message.length)}</span>
        </div>
        {likeMutation.isError && <p className="text-destructive text-sm">{likeErrorMessage(likeMutation.error)}</p>}
        <Button type="button" disabled={!trimmed || busy} onClick={() => likeMutation.mutate()}>
          {t.like}
        </Button>
        {likesRemaining != null && (
          <p className="text-center text-lg">
            {t.likesLeftBefore}
            <strong className="font-bold">{likesRemaining}</strong>
            {t.likesLeftAfter(likesRemaining)}
          </p>
        )}
      </div>

      <div className={hide ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
        {hide !== "THINKING" && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => decisionMutation.mutate("THINKING")}
            className="text-brand hover:text-brand"
          >
            <Star className="size-4" />
            {t.think}
          </Button>
        )}
        {hide !== "NOT_INTERESTED" && (
          <Button type="button" variant="neutral" disabled={busy} onClick={() => decisionMutation.mutate("NOT_INTERESTED")}>
            {t.notInterested}
          </Button>
        )}
      </div>
      {decisionMutation.isError && <p className="text-destructive text-sm">{t.error}</p>}
    </div>
  );
}
