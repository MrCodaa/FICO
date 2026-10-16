"use client";

import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { interests } from "@/content/catalog";
import { sr } from "@/content/sr";

import { CheckboxGroup, Field, RadioGroup } from "../fields";
import type { ProfileFormValues } from "../types";

interface MoreStepProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled?: boolean;
}

const AREA_CODES = ["PRODUCT", "ENGINEERING", "DESIGN", "SALES_MARKETING", "OPERATIONS"] as const;

export function MoreStep({ form, disabled }: MoreStepProps) {
  const { register, watch, setValue } = form;
  const t = sr.profile.steps.more;
  const yesNo = sr.profile.steps.basic;

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-8">
      <Field label={t.ideaStatus} required>
        <RadioGroup
          name="ideaStatus"
          disabled={disabled}
          value={watch("ideaStatus")}
          onChange={(v) => setValue("ideaStatus", v, { shouldDirty: true })}
          options={(["COMMITTED", "EXPLORING", "OPEN"] as const).map((v) => ({ value: v, label: t.ideaStatusOptions[v] }))}
        />
      </Field>

      <Field label={t.ideas} htmlFor="ideas">
        <Textarea id="ideas" maxLength={1000} className="min-h-32" {...register("ideas")} />
      </Field>

      <Field label={t.hasCofounder}>
        <RadioGroup
          name="hasCofounder"
          inline
          disabled={disabled}
          value={watch("hasCofounder")}
          onChange={(v) => setValue("hasCofounder", v, { shouldDirty: true })}
          options={[
            { value: "true", label: yesNo.isTechnicalYes },
            { value: "false", label: yesNo.isTechnicalNo },
          ]}
        />
      </Field>

      <Field label={t.timing} required>
        <RadioGroup
          name="timing"
          disabled={disabled}
          value={watch("timing")}
          onChange={(v) => setValue("timing", v, { shouldDirty: true })}
          options={(["ALREADY_FULL_TIME", "READY_ON_MATCH", "WITHIN_YEAR", "NO_PLANS"] as const).map((v) => ({
            value: v,
            label: t.timingOptions[v],
          }))}
        />
      </Field>

      <Field label={t.areas} required>
        <CheckboxGroup
          disabled={disabled}
          values={watch("areas")}
          onChange={(v) => setValue("areas", v, { shouldDirty: true })}
          options={AREA_CODES.map((code) => ({ value: code, label: t.areaOptions[code] }))}
        />
      </Field>

      <Field label={t.interests} required>
        <CheckboxGroup
          columns={3}
          disabled={disabled}
          values={watch("interests")}
          onChange={(v) => setValue("interests", v, { shouldDirty: true })}
          options={interests.map((i) => ({ value: i.code, label: i.label }))}
        />
      </Field>

      <Field label={t.equityExpectations} htmlFor="equityExpectations">
        <Input id="equityExpectations" maxLength={250} {...register("equityExpectations")} />
      </Field>

      <Field label={t.freeTime} htmlFor="freeTime">
        <Textarea id="freeTime" maxLength={500} {...register("freeTime")} />
      </Field>

      <Field label={t.lifePath} htmlFor="lifePath">
        <Textarea id="lifePath" maxLength={500} {...register("lifePath")} />
      </Field>

      <Field label={t.other} htmlFor="other">
        <Textarea id="other" maxLength={500} {...register("other")} />
      </Field>
    </fieldset>
  );
}
