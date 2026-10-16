"use client";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { ProfileFullView, type ProfileFullViewData } from "@/features/profile/components/ProfileFullView";
import { computeAge } from "@/lib/age";

import type { ProfileFormValues } from "../types";

interface ReviewStepProps {
  values: ProfileFormValues;
  onSubmit: () => void;
  submitting: boolean;
  submitError: { code: string; fields?: Record<string, unknown> } | null;
  submitSuccess: boolean;
  status?: string;
  rejectionReason?: string | null;
}

const basic = sr.profile.steps.basic;
const more = sr.profile.steps.more;

const FIELD_LABELS: Record<string, string> = {
  firstName: basic.firstName,
  lastName: basic.lastName,
  photoUrl: basic.photo,
  linkedinUrl: basic.linkedinUrl,
  countryCode: basic.country,
  city: basic.city,
  intro: basic.intro,
  accomplishment: basic.accomplishment,
  education: basic.education,
  employment: basic.employment,
  isTechnical: basic.isTechnical,
  gender: basic.gender,
  birthDate: basic.birthDate,
  ideaStatus: more.ideaStatus,
  timing: more.timing,
  areas: more.areas,
  interests: more.interests,
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function boolOrNull(value: "" | "true" | "false"): boolean | null {
  return value === "" ? null : value === "true";
}

// Pregled prije slanja koristi isti prikaz kao Discover i admin, da korisnik
// vidi profil tačno onako kako će ga drugi vidjeti.
function toViewData(values: ProfileFormValues): ProfileFullViewData {
  const birthDate = values.birthDate ? new Date(values.birthDate) : null;
  const age = birthDate && !Number.isNaN(birthDate.getTime()) ? computeAge(birthDate, new Date()) : null;
  const orNull = (s: string) => (s.trim() ? s : null);
  return {
    firstName: orNull(values.firstName),
    lastName: orNull(values.lastName),
    photoUrl: orNull(values.photoUrl),
    countryCode: orNull(values.countryCode),
    city: orNull(values.city),
    age,
    intro: orNull(values.intro),
    accomplishment: orNull(values.accomplishment),
    education: orNull(values.education),
    employment: orNull(values.employment),
    isTechnical: boolOrNull(values.isTechnical),
    ideaStatus: orNull(values.ideaStatus),
    ideas: orNull(values.ideas),
    hasCofounder: boolOrNull(values.hasCofounder),
    timing: orNull(values.timing),
    areas: values.areas,
    interests: values.interests,
    equityExpectations: orNull(values.equityExpectations),
    freeTime: orNull(values.freeTime),
    lifePath: orNull(values.lifePath),
    other: orNull(values.other),
    lookingFor: orNull(values.lookingFor),
    linkedinUrl: values.noLinkedin ? null : orNull(values.linkedinUrl),
    noLinkedin: values.noLinkedin,
    videoUrl: orNull(values.videoUrl),
    schedulingUrl: orNull(values.schedulingUrl),
    twitterUrl: orNull(values.twitterUrl),
    instagramUrl: orNull(values.instagramUrl),
  };
}

export function ReviewStep({
  values,
  onSubmit,
  submitting,
  submitError,
  submitSuccess,
  status,
  rejectionReason,
}: ReviewStepProps) {
  const t = sr.profile.steps.review;
  const incompleteFields = submitError?.code === "PROFILE_INCOMPLETE" ? submitError.fields : undefined;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">{t.description}</p>

      {status === "REJECTED" && rejectionReason && (
        <div className="border-destructive/50 bg-destructive/5 flex flex-col gap-1 rounded-md border p-3">
          <span className="text-destructive text-sm font-medium">{t.rejectedNotice}</span>
          <span className="text-sm">{rejectionReason}</span>
        </div>
      )}

      <div className="rounded-md border p-5 sm:p-6">
        <ProfileFullView profile={toViewData(values)} />
      </div>

      {submitSuccess ? (
        <p className="text-sm font-medium text-green-600">{sr.profile.wizard.saved}</p>
      ) : (
        <>
          {submitError && (
            <div className="flex flex-col gap-2">
              <p className="text-destructive text-sm">
                {submitError.code === "PROFILE_INCOMPLETE"
                  ? t.incomplete
                  : submitError.code === "INVALID_STATUS"
                    ? sr.profile.errors.locked
                    : sr.profile.errors.generic}
              </p>
              {incompleteFields && (
                <ul className="text-destructive list-inside list-disc text-xs">
                  {Object.keys(incompleteFields).map((key) => (
                    <li key={key}>{fieldLabel(key)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Button type="button" disabled={submitting} onClick={onSubmit}>
            {t.submit}
          </Button>
        </>
      )}
    </div>
  );
}
