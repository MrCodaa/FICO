"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

import {
  ApiError,
  fetchProfile,
  mapServerToForm,
  patchPreference,
  patchProfile,
  submitProfile,
  toBasicPayload,
  toMorePayload,
  toPreferencePayload,
} from "./api";
import { BasicStep } from "./steps/BasicStep";
import { MoreStep } from "./steps/MoreStep";
import { PreferenceStep } from "./steps/PreferenceStep";
import { ReviewStep } from "./steps/ReviewStep";
import { emptyFormValues, type ProfileFormValues } from "./types";

const DRAFT_KEY = "fico:profile-draft";

interface Draft {
  userId: string;
  stepIndex: number;
  values: ProfileFormValues;
}

// Draft je vezan za userId da se na dijeljenom/testnom browseru ne bi
// nacrt jednog korisnika tiho primijenio na nalog drugog (localStorage je
// po porijeklu, ne po sesiji).
function readDraft(userId: string): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Draft;
    return draft.userId === userId ? draft : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage nedostupan (privatni mod i sl.) — nastavi bez autosave-a
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignoriši
  }
}

const STEPS = [
  sr.profile.steps.basic.title,
  sr.profile.steps.more.title,
  sr.profile.steps.preference.title,
  sr.profile.steps.review.title,
];

export default function ProfilePage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<{ code: string; fields?: Record<string, unknown> } | null>(
    null,
  );
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const form = useForm<ProfileFormValues>({ defaultValues: emptyFormValues });

  const viewerId = profileQuery.data?.profile?.userId;

  useEffect(() => {
    if (hydrated || !profileQuery.data || !viewerId) return;
    const serverValues = mapServerToForm(profileQuery.data);
    const draft = readDraft(viewerId);
    const merged = draft ? { ...serverValues, ...draft.values } : serverValues;
    form.reset(merged);
    if (draft && typeof draft.stepIndex === "number") {
      setStepIndex(draft.stepIndex);
    }
    setHydrated(true);
  }, [profileQuery.data, viewerId, hydrated, form]);

  useEffect(() => {
    if (!hydrated || !viewerId) return;
    const subscription = form.watch((values) => {
      writeDraft({ userId: viewerId, stepIndex, values: values as ProfileFormValues });
    });
    return () => subscription.unsubscribe();
  }, [form, hydrated, viewerId, stepIndex]);

  useEffect(() => {
    if (!hydrated || !viewerId) return;
    writeDraft({ userId: viewerId, stepIndex, values: form.getValues() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, hydrated, viewerId]);

  const basicMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => patchProfile(toBasicPayload(values)),
  });
  const moreMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => patchProfile(toMorePayload(values)),
  });
  const preferenceMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => patchPreference(toPreferencePayload(values)),
  });
  const submitMutation = useMutation({
    mutationFn: submitProfile,
    onSuccess: () => {
      setSubmitSuccess(true);
      setSubmitError(null);
      clearDraft();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setSubmitError({ code: err.code, fields: err.fields });
      } else {
        setSubmitError({ code: "GENERIC" });
      }
    },
  });

  const errorMessage = (code: string) => {
    switch (code) {
      case "PROFILE_LOCKED":
        return sr.profile.errors.locked;
      default:
        return sr.profile.errors.generic;
    }
  };

  const handleNext = async () => {
    setPatchError(null);
    const values = form.getValues();
    try {
      if (stepIndex === 0) {
        await basicMutation.mutateAsync(values);
      } else if (stepIndex === 1) {
        await moreMutation.mutateAsync(values);
      } else if (stepIndex === 2) {
        await preferenceMutation.mutateAsync(values);
      }
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    } catch (err) {
      setPatchError(err instanceof ApiError ? errorMessage(err.code) : sr.profile.errors.generic);
    }
  };

  const handleBack = () => {
    setPatchError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const isSaving = basicMutation.isPending || moreMutation.isPending || preferenceMutation.isPending;

  if (profileQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <p className="text-destructive text-sm">{sr.profile.errors.generic}</p>
      </div>
    );
  }

  if (profileQuery.isLoading || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <p className="text-muted-foreground text-sm">…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-center text-2xl font-bold tracking-tight">{sr.profile.wizard.title}</h1>
          <p className="text-muted-foreground text-center text-sm">
            {stepIndex + 1} / {STEPS.length} — {STEPS[stepIndex]}
          </p>
        </div>

        {stepIndex === 0 && <BasicStep form={form} />}
        {stepIndex === 1 && <MoreStep form={form} />}
        {stepIndex === 2 && <PreferenceStep form={form} />}
        {stepIndex === 3 && (
          <ReviewStep
            values={form.getValues()}
            onSubmit={() => submitMutation.mutate()}
            submitting={submitMutation.isPending}
            submitError={submitError}
            submitSuccess={submitSuccess}
            status={profileQuery.data?.profile?.status}
            rejectionReason={profileQuery.data?.profile?.rejectionReason}
          />
        )}

        {patchError && <p className="text-destructive text-sm">{patchError}</p>}

        {stepIndex < 3 && (
          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" disabled={stepIndex === 0} onClick={handleBack}>
              {sr.profile.wizard.back}
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleNext}>
              {sr.profile.wizard.next}
            </Button>
          </div>
        )}

        {stepIndex === 3 && !submitSuccess && (
          <div className="flex justify-start">
            <Button type="button" variant="outline" onClick={handleBack}>
              {sr.profile.wizard.back}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
