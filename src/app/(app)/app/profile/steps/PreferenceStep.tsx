"use client";

import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";

import { CheckboxGroup, Field, ImportanceRadios, RadioGroup } from "../fields";
import type { ProfileFormValues } from "../types";

interface PreferenceStepProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled?: boolean;
}

const AREA_CODES = ["PRODUCT", "ENGINEERING", "DESIGN", "SALES_MARKETING", "OPERATIONS"] as const;

type ImportanceKey =
  | "ideaImportance"
  | "technicalImportance"
  | "timingImportance"
  | "locationImportance"
  | "ageImportance"
  | "areasImportance"
  | "interestsImportance";

export function PreferenceStep({ form, disabled }: PreferenceStepProps) {
  const { register, watch, setValue } = form;
  const t = sr.profile.steps.preference;
  const more = sr.profile.steps.more;

  const importance = (key: ImportanceKey) => (
    <ImportanceRadios
      name={key}
      disabled={disabled}
      value={watch(key)}
      onChange={(v) => setValue(key, v, { shouldDirty: true })}
    />
  );

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-10">
      <p className="text-foreground/80">{t.subtitle}</p>

      <Field label={t.lookingFor} htmlFor="lookingFor" required>
        <Textarea id="lookingFor" maxLength={1000} className="min-h-32" {...register("lookingFor")} />
      </Field>

      <Field label={t.idea} name="idea">
        <RadioGroup
          name="idea"
          disabled={disabled}
          value={watch("idea")}
          onChange={(v) => setValue("idea", v, { shouldDirty: true })}
          options={(["HAS_IDEA", "OPEN_TO_IDEAS"] as const).map((v) => ({ value: v, label: t.ideaOptions[v] }))}
        />
        {importance("ideaImportance")}
      </Field>

      <Field label={t.technical} name="technical">
        <RadioGroup
          name="technical"
          inline
          disabled={disabled}
          value={watch("technical")}
          onChange={(v) => setValue("technical", v, { shouldDirty: true })}
          options={(["TECHNICAL", "NON_TECHNICAL"] as const).map((v) => ({ value: v, label: t.technicalOptions[v] }))}
        />
        {importance("technicalImportance")}
      </Field>

      <Field label={more.timing} name="timingImportance">{importance("timingImportance")}</Field>

      <Field label={t.location} name="location">
        <RadioGroup
          name="location"
          inline
          disabled={disabled}
          value={watch("location") === "" ? "ANYWHERE" : watch("location")}
          onChange={(v) => {
            setValue("location", v === "ANYWHERE" ? "" : v, { shouldDirty: true });
            if (v === "ANYWHERE") setValue("locationImportance", "", { shouldDirty: true });
          }}
          options={(["SAME_CITY", "SAME_COUNTRY", "ANYWHERE"] as const).map((v) => ({
            value: v,
            label: t.locationOptions[v],
          }))}
        />
        {importance("locationImportance")}
      </Field>

      <Field label={t.ageRange} name="ageMin">
        <div className="flex max-w-sm gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-muted-foreground text-sm">{t.ageMin}</span>
            <Input type="number" min={18} {...register("ageMin")} />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-muted-foreground text-sm">{t.ageMax}</span>
            <Input type="number" min={18} {...register("ageMax")} />
          </label>
        </div>
        {importance("ageImportance")}
      </Field>

      <Field label={t.wantedAreas} name="wantedAreas">
        <CheckboxGroup
          disabled={disabled}
          values={watch("wantedAreas")}
          onChange={(v) => setValue("wantedAreas", v, { shouldDirty: true })}
          options={AREA_CODES.map((code) => ({ value: code, label: more.areaOptions[code] }))}
        />
        {importance("areasImportance")}
      </Field>

      <Field label={more.interests} name="interestsImportance">{importance("interestsImportance")}</Field>
    </fieldset>
  );
}
