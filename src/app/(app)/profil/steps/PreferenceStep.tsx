"use client";

import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sr } from "@/content/sr";

import type { ProfileFormValues } from "../types";
import { checkboxInputClass, checkboxRowClass, selectClass, toggleValue } from "../ui";

interface PreferenceStepProps {
  form: UseFormReturn<ProfileFormValues>;
}

const AREA_CODES = ["PRODUCT", "ENGINEERING", "DESIGN", "SALES_MARKETING", "OPERATIONS"] as const;

function ImportanceSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ProfileFormValues["ideaImportance"];
  onChange: (value: ProfileFormValues["ideaImportance"]) => void;
}) {
  const t = sr.profile.steps.preference;
  return (
    <select
      id={id}
      className={selectClass}
      value={value}
      onChange={(e) => onChange(e.target.value as ProfileFormValues["ideaImportance"])}
    >
      <option value="">{t.noPreference}</option>
      <option value="REQUIRED">{t.importanceOptions.REQUIRED}</option>
      <option value="PREFERRED">{t.importanceOptions.PREFERRED}</option>
    </select>
  );
}

export function PreferenceStep({ form }: PreferenceStepProps) {
  const { register, watch, setValue } = form;
  const t = sr.profile.steps.preference;
  const more = sr.profile.steps.more;

  const wantedAreas = watch("wantedAreas");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">{t.subtitle}</p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lookingFor">{t.lookingFor}</Label>
        <Textarea id="lookingFor" maxLength={1000} {...register("lookingFor")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="idea">{t.idea}</Label>
        <select id="idea" className={selectClass} {...register("idea")}>
          <option value="">{t.noPreference}</option>
          <option value="HAS_IDEA">{t.ideaOptions.HAS_IDEA}</option>
          <option value="OPEN_TO_IDEAS">{t.ideaOptions.OPEN_TO_IDEAS}</option>
        </select>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ideaImportance" className="text-muted-foreground text-xs font-normal">
            {t.importance}
          </Label>
          <ImportanceSelect
            id="ideaImportance"
            value={watch("ideaImportance")}
            onChange={(v) => setValue("ideaImportance", v, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="technical">{t.technical}</Label>
        <select id="technical" className={selectClass} {...register("technical")}>
          <option value="">{t.noPreference}</option>
          <option value="TECHNICAL">{t.technicalOptions.TECHNICAL}</option>
          <option value="NON_TECHNICAL">{t.technicalOptions.NON_TECHNICAL}</option>
        </select>
        <div className="flex flex-col gap-1">
          <Label htmlFor="technicalImportance" className="text-muted-foreground text-xs font-normal">
            {t.importance}
          </Label>
          <ImportanceSelect
            id="technicalImportance"
            value={watch("technicalImportance")}
            onChange={(v) => setValue("technicalImportance", v, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="timingImportance">{more.timing}</Label>
        <ImportanceSelect
          id="timingImportance"
          value={watch("timingImportance")}
          onChange={(v) => setValue("timingImportance", v, { shouldDirty: true })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">{t.location}</Label>
        <select id="location" className={selectClass} {...register("location")}>
          <option value="">{t.noPreference}</option>
          <option value="SAME_CITY">{t.locationOptions.SAME_CITY}</option>
          <option value="SAME_COUNTRY">{t.locationOptions.SAME_COUNTRY}</option>
          <option value="SAME_REGION">{t.locationOptions.SAME_REGION}</option>
        </select>
        <div className="flex flex-col gap-1">
          <Label htmlFor="locationImportance" className="text-muted-foreground text-xs font-normal">
            {t.importance}
          </Label>
          <ImportanceSelect
            id="locationImportance"
            value={watch("locationImportance")}
            onChange={(v) => setValue("locationImportance", v, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t.ageRange}</Label>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="ageMin" className="text-muted-foreground text-xs font-normal">
              {t.ageMin}
            </Label>
            <Input id="ageMin" type="number" min={18} {...register("ageMin")} />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="ageMax" className="text-muted-foreground text-xs font-normal">
              {t.ageMax}
            </Label>
            <Input id="ageMax" type="number" min={18} {...register("ageMax")} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="ageImportance" className="text-muted-foreground text-xs font-normal">
            {t.importance}
          </Label>
          <ImportanceSelect
            id="ageImportance"
            value={watch("ageImportance")}
            onChange={(v) => setValue("ageImportance", v, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t.wantedAreas}</Label>
        <div className="flex flex-col gap-2">
          {AREA_CODES.map((code) => (
            <label key={code} className={checkboxRowClass}>
              <input
                type="checkbox"
                className={checkboxInputClass}
                checked={wantedAreas.includes(code)}
                onChange={() =>
                  setValue("wantedAreas", toggleValue(wantedAreas, code), { shouldDirty: true })
                }
              />
              {more.areaOptions[code]}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="areasImportance" className="text-muted-foreground text-xs font-normal">
            {t.importance}
          </Label>
          <ImportanceSelect
            id="areasImportance"
            value={watch("areasImportance")}
            onChange={(v) => setValue("areasImportance", v, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="interestsImportance">{more.interests}</Label>
        <ImportanceSelect
          id="interestsImportance"
          value={watch("interestsImportance")}
          onChange={(v) => setValue("interestsImportance", v, { shouldDirty: true })}
        />
      </div>

      <label className={checkboxRowClass}>
        <input type="checkbox" className={checkboxInputClass} {...register("alertOnNewMatch")} />
        {t.alertOnNewMatch}
      </label>
    </div>
  );
}
