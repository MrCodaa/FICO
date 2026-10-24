"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";
import { apiFetch } from "@/lib/http/apiClient";

const t = sr.safety;
type ReportReason = keyof typeof t.report.reasons;

export const selectClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/40 flex h-11 w-full rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-[3px]";

/**
 * "Prijavi profil" (docs/ui-spec.md §2): razlog + detalji, a ispod i
 * blokiranje. Blokiranje sakriva korisnika u oba smjera.
 */
export function ReportBlockModal({
  userId,
  open,
  onClose,
  onBlocked,
  onReported,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  onBlocked?: () => void;
  onReported?: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [details, setDetails] = useState("");
  const [reported, setReported] = useState(false);

  const reportMutation = useMutation({
    mutationFn: () =>
      apiFetch<void>("/api/reports", {
        method: "POST",
        json: { reportedId: userId, reason, details: details.trim() || undefined },
      }),
    onSuccess: () => {
      setReported(true);
      // Prijateljska potvrda, pa zatvaranje i (ako ga ima) prelazak na sljedeći profil.
      if (onReported) setTimeout(() => closeAfterReport(), 1400);
    },
  });

  const closeAfterReport = () => {
    close();
    onReported?.();
  };

  const blockMutation = useMutation({
    mutationFn: () => apiFetch<void>("/api/blocks", { method: "POST", json: { userId } }),
    onSuccess: () => {
      onClose();
      onBlocked?.();
    },
  });

  const close = () => {
    setReported(false);
    setDetails("");
    reportMutation.reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title={t.report.title} closeLabel={t.report.close}>
      {reported ? (
        <p role="status" className="text-base font-semibold">
          {t.report.success}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-reason">{t.report.reasonLabel}</Label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              disabled={reportMutation.isPending}
              className={selectClass}
            >
              {Object.entries(t.report.reasons).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-details">{t.report.detailsLabel}</Label>
            <Textarea
              id="report-details"
              value={details}
              maxLength={1000}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t.report.detailsPlaceholder}
              disabled={reportMutation.isPending}
            />
          </div>
          {reportMutation.isError && <p className="text-destructive text-sm">{t.report.generic}</p>}
          <div className="flex gap-3">
            <Button type="button" disabled={reportMutation.isPending} onClick={() => reportMutation.mutate()}>
              {t.report.submit}
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              {t.report.cancel}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t pt-5">
        <p className="font-semibold">{t.block.title}</p>
        <p className="text-muted-foreground text-sm">{t.block.description}</p>
        {blockMutation.isError && <p className="text-destructive text-sm">{t.report.generic}</p>}
        <Button
          type="button"
          variant="destructive"
          className="self-start"
          disabled={blockMutation.isPending}
          onClick={() => blockMutation.mutate()}
        >
          {t.block.action}
        </Button>
      </div>
    </Modal>
  );
}
