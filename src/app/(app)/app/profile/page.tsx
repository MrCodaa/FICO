"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Circle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/card";
import { PageBand } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import { fetchMe } from "@/lib/http/apiClient";
import { cn } from "@/lib/utils";

import {
  ApiError,
  fetchProfile,
  type GetProfileResponse,
  mapServerToForm,
  patchPreference,
  patchProfile,
  submitProfile,
  toBasicPayload,
  toMorePayload,
  toPreferencePayload,
} from "./api";
import { STEP_KEYS, stepCompletion, type StepKey } from "./completion";
import { FieldErrorsContext } from "./fields";
import { BasicStep } from "./steps/BasicStep";
import { MoreStep } from "./steps/MoreStep";
import { PreferenceStep } from "./steps/PreferenceStep";
import { ReviewStep } from "./steps/ReviewStep";
import { emptyFormValues, type ProfileFormValues } from "./types";

const w = sr.profile.wizard;
const NO_FIELD_ERRORS: Record<string, string> = {};
const DRAFT_KEY = "fico:profile-draft";

const STEP_TITLES: Record<StepKey, string> = {
  basic: sr.profile.steps.basic.title,
  more: sr.profile.steps.more.title,
  preference: sr.profile.steps.preference.title,
  preview: sr.profile.steps.review.title,
};

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

const fe = sr.profile.fieldErrors;
// Zod (engleske) poruke bez našeg teksta: zamijeni šablonom sa nazivom polja.
const ZOD_GENERIC = /^(Invalid|Too (small|big)|Expected|Required|String must|Number must)/;

/** Server vraća ključeve polja forme; city i countryCode dijele isto polje "Lokacija". */
function errorTarget(key: string): string {
  const base = key.split(".")[0] ?? key;
  if (base === "city" || base === "countryCode") return "location";
  if (base === "ageMax") return "ageMin";
  return base;
}

function isEmptyValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function buildFieldErrors(fields: Record<string, unknown>, values: ProfileFormValues): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(fields)) {
    const base = key.split(".")[0] ?? key;
    const target = errorTarget(key);
    if (target in result) continue;
    const serverMessage = typeof raw === "string" ? raw : "";
    const value = (values as unknown as Record<string, unknown>)[base];
    if (fe.byField[base]) result[target] = fe.byField[base];
    else if (isEmptyValue(value) || serverMessage === sr.profile.errors.required) result[target] = fe.required;
    else if (serverMessage && !ZOD_GENERIC.test(serverMessage)) result[target] = serverMessage;
    else result[target] = fe.invalid;
  }
  return result;
}

function errorMessage(code: string): string {
  switch (code) {
    case "PROFILE_LOCKED":
      return sr.profile.errors.locked;
    case "PROFILE_INCOMPLETE":
      return sr.profile.errors.incomplete;
    case "VALIDATION_ERROR":
      return sr.profile.errors.validationError;
    default:
      return sr.profile.errors.generic;
  }
}

/** Uredi profil (docs/ui-spec.md §5, yc-my-profile.png) — isti ekran služi i za prvo popunjavanje. */
export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileEditor />
    </Suspense>
  );
}

function ProfileEditor() {
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  if (profileQuery.isError) {
    return (
      <>
        <PageBand eyebrow={w.eyebrow} title={w.title} />
        <p className="text-destructive px-4 py-10 sm:px-8 xl:px-20">{sr.profile.errors.generic}</p>
      </>
    );
  }

  if (!profileQuery.data) {
    return (
      <>
        <PageBand eyebrow={w.eyebrow} title={w.title} />
        <div className="grid items-start gap-6 px-4 py-10 sm:px-8 lg:grid-cols-[22rem_minmax(0,1fr)] xl:px-20">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-[36rem] w-full" />
        </div>
      </>
    );
  }

  // Forma se pravi tek kad stignu podaci, pa početne vrijednosti (server +
  // lokalni nacrt) idu direktno u useForm — bez reset-a u efektu.
  return <ProfileForm data={profileQuery.data} />;
}

function ProfileForm({ data }: { data: GetProfileResponse }) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const viewerId = data.profile.userId ?? "";

  const [initial] = useState(() => {
    const draft = readDraft(viewerId);
    // ?step=preference (link "Uredi" iz "Tvoji filteri") ima prednost nad nacrtom.
    const fromUrl = STEP_KEYS.indexOf(searchParams.get("step") as StepKey);
    return {
      values: { ...mapServerToForm(data), ...draft?.values },
      stepIndex: fromUrl >= 0 ? fromUrl : (draft?.stepIndex ?? 0),
    };
  });
  const [stepIndex, setStepIndex] = useState(initial.stepIndex);
  const [saveError, setSaveError] = useState<{ message: string; fields: Record<string, string> } | null>(null);
  const [savedStep, setSavedStep] = useState<StepKey | null>(null);
  const [submitError, setSubmitError] = useState<{ code: string; fields?: Record<string, unknown> } | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const form = useForm<ProfileFormValues>({ defaultValues: initial.values });
  const watched = useWatch({ control: form.control });

  const status = submitSuccess ? "PENDING_REVIEW" : data.profile.status;
  const locked = status === "PENDING_REVIEW";
  const step = STEP_KEYS[stepIndex] ?? "basic";

  useEffect(() => {
    if (!viewerId) return;
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => writeDraft({ userId: viewerId, stepIndex, values }),
    });
  }, [form, viewerId, stepIndex]);

  const fieldErrors = saveError?.fields ?? NO_FIELD_ERRORS;
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  // Greška nestaje čim korisnik izmijeni to polje.
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        if (!name) return;
        const target = errorTarget(name);
        setSaveError((prev) => {
          if (!prev || !(target in prev.fields)) return prev;
          const rest = { ...prev.fields };
          delete rest[target];
          return { ...prev, fields: rest };
        });
      },
    });
  }, [form]);

  // Pri neuspjelom slanju: skrol do prvog neispravnog polja i fokus na njega.
  useEffect(() => {
    if (!saveError || Object.keys(saveError.fields).length === 0) return;
    const first = document.querySelector<HTMLElement>("[data-field-error]");
    if (!first) return;
    first.scrollIntoView({ behavior: "smooth", block: "center" });
    first
      .querySelector<HTMLElement>("input:not([type=hidden]):not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled)")
      ?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveError?.message, saveError && Object.keys(saveError.fields).join("|")]);

  const saveMutation = useMutation({
    mutationFn: async (key: StepKey) => {
      const values = form.getValues();
      if (key === "basic") await patchProfile(toBasicPayload(values));
      else if (key === "more") await patchProfile(toMorePayload(values));
      else if (key === "preference") await patchPreference(toPreferencePayload(values));
    },
    onSuccess: (_data, key) => {
      setSavedStep(key);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["discover"] });
      goTo(Math.min(stepIndex + 1, STEP_KEYS.length - 1));
    },
    onError: (err) => {
      const fields = err instanceof ApiError && err.fields ? buildFieldErrors(err.fields, form.getValues()) : {};
      setSaveError({
        message: err instanceof ApiError ? errorMessage(err.code) : sr.profile.errors.generic,
        fields,
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitProfile,
    onSuccess: async (res) => {
      setSubmitError(null);
      clearDraft();
      // Otvoren ulaz (lib/devAccess.ts): profil je odmah odobren, pa ide pravo u aplikaciju.
      if (res.status === "APPROVED") {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        router.push("/app");
        return;
      }
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      setSubmitError(err instanceof ApiError ? { code: err.code, fields: err.fields } : { code: "GENERIC" });
    },
  });

  function goTo(index: number) {
    setSaveError(null);
    setStepIndex(index);
    if (viewerId) writeDraft({ userId: viewerId, stepIndex: index, values: form.getValues() });
    window.scrollTo({ top: 0 });
  }

  const values = { ...emptyFormValues, ...watched } as ProfileFormValues;
  const completion = stepCompletion(values, status);

  return (
    <>
      <PageBand eyebrow={w.eyebrow} title={w.title} />
      <div className="flex flex-col gap-8 px-4 py-8 sm:px-8 md:py-10 xl:px-20">
        <p className="max-w-[90rem] text-lg leading-relaxed">{w.intro}</p>

        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <nav className="bg-card flex flex-col gap-3 rounded-md border p-6 lg:sticky lg:top-8">
              <h2 className="px-1 pb-1 text-2xl font-semibold tracking-tight">{w.stepsTitle}</h2>
              <ol className="flex flex-col gap-1">
                {STEP_KEYS.map((key, index) => {
                  const active = index === stepIndex;
                  const done = completion[key];
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        aria-current={active ? "step" : undefined}
                        onClick={() => goTo(index)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-3 text-left text-lg transition-colors",
                          active ? "bg-step-active font-semibold text-white" : "hover:bg-secondary",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="text-primary size-7 shrink-0 fill-current stroke-white" />
                        ) : (
                          <Circle className={cn("size-7 shrink-0", active ? "text-white" : "text-border")} />
                        )}
                        {STEP_TITLES[key]}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <SectionCard title={STEP_TITLES[step]}>
              {locked && (
                <p className="bg-beige border-beige-border rounded-md border px-4 py-3 font-medium">{w.pendingNotice}</p>
              )}

              {step !== "preview" && hasFieldErrors && (
                <p
                  role="alert"
                  className="border-destructive/50 bg-destructive/5 text-destructive rounded-md border px-4 py-3 font-medium"
                >
                  {fe.banner}
                </p>
              )}

              <FieldErrorsContext.Provider value={fieldErrors}>
                {step === "basic" && <BasicStep form={form} email={meQuery.data?.email ?? ""} disabled={locked} />}
                {step === "more" && <MoreStep form={form} disabled={locked} />}
                {step === "preference" && <PreferenceStep form={form} disabled={locked} />}
              </FieldErrorsContext.Provider>
              {step === "preview" && (
                <ReviewStep
                  values={values}
                  onSubmit={() => submitMutation.mutate()}
                  submitting={submitMutation.isPending}
                  submitError={submitError}
                  submitSuccess={submitSuccess}
                  status={status}
                  rejectionReason={data.profile.rejectionReason}
                />
              )}

              {step !== "preview" && (
                <div className="flex flex-col gap-3 border-t pt-6">
                  {saveError && !hasFieldErrors && <p className="text-destructive">{saveError.message}</p>}
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      type="button"
                      size="lg"
                      variant="brand"
                      disabled={locked || saveMutation.isPending}
                      onClick={() => {
                        setSaveError(null);
                        saveMutation.mutate(step);
                      }}
                    >
                      {saveMutation.isPending ? w.saving : w.save}
                    </Button>
                    {status === "APPROVED" && <span className="text-muted-foreground">{w.approvedNotice}</span>}
                  </div>
                </div>
              )}
              {savedStep && step !== savedStep && !saveError && (
                <p className="text-primary font-medium" role="status">
                  {w.saved}
                </p>
              )}
            </SectionCard>
        </div>
      </div>
    </>
  );
}
