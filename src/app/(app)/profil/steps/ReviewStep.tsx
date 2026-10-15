"use client";

import { Button } from "@/components/ui/button";
import { interests as interestCatalog } from "@/content/catalog";
import { sr } from "@/content/sr";

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b pb-2 last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
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
  const interestLabels = values.interests
    .map((code) => interestCatalog.find((i) => i.code === code)?.label ?? code)
    .join(", ");
  const areaLabels = values.areas.map((code) => more.areaOptions[code as keyof typeof more.areaOptions]).join(", ");

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

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{basic.title}</h2>
        <SummaryRow label={basic.firstName} value={values.firstName} />
        <SummaryRow label={basic.lastName} value={values.lastName} />
        <SummaryRow label={basic.country} value={values.countryCode} />
        <SummaryRow label={basic.city} value={values.city} />
        <SummaryRow label={basic.intro} value={values.intro} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{more.title}</h2>
        <SummaryRow
          label={more.ideaStatus}
          value={values.ideaStatus ? more.ideaStatusOptions[values.ideaStatus] : ""}
        />
        <SummaryRow label={more.timing} value={values.timing ? more.timingOptions[values.timing] : ""} />
        <SummaryRow label={more.areas} value={areaLabels} />
        <SummaryRow label={more.interests} value={interestLabels} />
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
