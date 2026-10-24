"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageBand, PageContainer } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import type { SettingsView } from "@/features/settings/mappers";
import { disableAllEmails, restoreEmails } from "@/features/settings/emailToggle";
import type { EmailSettings, SettingsInput } from "@/features/settings/schemas";
import { ApiClientError, apiFetch } from "@/lib/http/apiClient";

import { Checkbox, Field, RadioGroup } from "../profile/fields";
import { selectClass } from "../profile/ui";

const t = sr.settings;
const EMAIL_KEYS = Object.keys(t.emails) as (keyof EmailSettings)[];

type FormState = Required<Pick<SettingsInput, "active" | "emails" | "cofounderMatchId" | "hideAge">>;

function toForm(view: SettingsView): FormState {
  return { active: view.active, emails: view.emails, cofounderMatchId: view.cofounderMatchId, hideAge: view.hideAge };
}

/** Podešavanja (docs/ui-spec.md §6, yc-settings.png). */
export default function SettingsPage() {
  const query = useQuery({ queryKey: ["settings"], queryFn: () => apiFetch<SettingsView>("/api/settings") });

  return (
    <>
      <PageBand eyebrow={t.eyebrow} title={t.title} />
      <PageContainer width="wide">
        {query.data ? (
          <SettingsForm key={JSON.stringify(toForm(query.data))} view={query.data} />
        ) : query.isError ? (
          <p className="text-destructive">{t.error}</p>
        ) : (
          <Skeleton className="h-[40rem] w-full" />
        )}
      </PageContainer>
    </>
  );
}

function SettingsForm({ view }: { view: SettingsView }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toForm(view));
  const [resetOpen, setResetOpen] = useState(false);
  const [resetDone, setResetDone] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");

  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(view));

  const save = useMutation({
    mutationFn: () => apiFetch<SettingsView>("/api/settings", { method: "PATCH", json: form }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      // Pauza i skrivene godine mijenjaju ono što drugi vide.
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const reset = useMutation({
    mutationFn: () => apiFetch<{ deleted: number }>("/api/decisions/not-interested", { method: "DELETE" }),
    onSuccess: ({ deleted }) => {
      setResetOpen(false);
      setResetDone(deleted);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      queryClient.invalidateQueries({ queryKey: ["discover"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => apiFetch<void>("/api/me", { method: "DELETE", json: { email: deleteEmail } }),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/");
      router.refresh();
    },
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  // Vrijednosti prije uključivanja "Bez ikakvih…", da ih odčekiranje vrati.
  const [previousEmails, setPreviousEmails] = useState<EmailSettings | null>(null);
  const toggleEmail = (key: keyof EmailSettings, checked: boolean) => {
    if (key !== "none") return set("emails", { ...form.emails, [key]: checked });
    if (checked) {
      setPreviousEmails(form.emails);
      set("emails", disableAllEmails());
    } else {
      set("emails", restoreEmails(previousEmails));
    }
  };

  return (
    <div className="flex max-w-[90rem] flex-col gap-10">
      <Field label={t.activeQuestion} required>
        <RadioGroup
          name="active"
          value={form.active ? "yes" : "no"}
          onChange={(v) => set("active", v === "yes")}
          options={[
            { value: "yes", label: t.activeYes },
            { value: "no", label: t.activeNo },
          ]}
        />
      </Field>

      <Field label={t.emailsQuestion}>
        <div className="flex flex-col gap-2.5">
          {EMAIL_KEYS.map((key) => (
            <Checkbox
              key={key}
              label={t.emails[key]}
              checked={form.emails[key]}
              disabled={key !== "none" && form.emails.none}
              onChange={(checked) => toggleEmail(key, checked)}
            />
          ))}
        </div>
      </Field>

      <Field label={t.cofounderQuestion} htmlFor="cofounder" hint={t.cofounderHint}>
        <select
          id="cofounder"
          className={selectClass}
          value={form.cofounderMatchId ?? ""}
          onChange={(e) => set("cofounderMatchId", e.target.value || null)}
        >
          <option value="">{t.cofounderNone}</option>
          {view.cofounderOptions.map((o) => (
            <option key={o.matchId} value={o.matchId}>
              {o.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t.hideAgeQuestion} required>
        <RadioGroup
          name="hideAge"
          value={form.hideAge ? "yes" : "no"}
          onChange={(v) => set("hideAge", v === "yes")}
          options={[
            { value: "yes", label: t.hideAgeYes },
            { value: "no", label: t.hideAgeNo },
          ]}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-5">
        <Button type="button" variant="brand" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {t.save}
        </Button>
        <span className="text-lg">{dirty ? t.unsaved : save.isSuccess ? t.saved : t.noChanges}</span>
        {save.isError && <span className="text-destructive">{t.error}</span>}
      </div>

      <div className="flex flex-col items-start gap-3">
        <Button type="button" variant="info" size="lg" onClick={() => setResetOpen(true)}>
          {t.reset(view.skippedCount)}
        </Button>
        {resetDone !== null && <span className="text-muted-foreground">{t.resetDone(resetDone)}</span>}
      </div>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="self-start cursor-pointer text-lg underline underline-offset-4 hover:opacity-80"
      >
        {t.deleteLink}
      </button>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={t.resetTitle} closeLabel={t.cancel}>
        <p>{t.resetConfirm}</p>
        {reset.isError && <p className="text-destructive text-sm">{t.error}</p>}
        <div className="flex gap-3">
          <Button type="button" variant="info" disabled={reset.isPending} onClick={() => reset.mutate()}>
            {t.resetAction}
          </Button>
          <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
            {t.cancel}
          </Button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t.deleteTitle} closeLabel={t.cancel}>
        <p>{t.deleteText}</p>
        <Field label={t.deleteEmailLabel} htmlFor="delete-email">
          <Input
            id="delete-email"
            type="email"
            autoComplete="off"
            value={deleteEmail}
            onChange={(e) => {
              setDeleteEmail(e.target.value);
              remove.reset();
            }}
          />
        </Field>
        {remove.isError && (
          <p className="text-destructive text-sm">
            {remove.error instanceof ApiClientError && remove.error.code === "VALIDATION_ERROR" ? t.deleteMismatch : t.error}
          </p>
        )}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="destructive"
            disabled={!deleteEmail.trim() || remove.isPending}
            onClick={() => remove.mutate()}
          >
            {t.deleteAction}
          </Button>
          <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
            {t.cancel}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
