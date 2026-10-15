"use client";

import type { UseFormReturn } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { interests } from "@/content/catalog";
import { sr } from "@/content/sr";

import type { ProfileFormValues } from "../types";
import { checkboxInputClass, checkboxRowClass, selectClass, toggleValue } from "../ui";

interface MoreStepProps {
  form: UseFormReturn<ProfileFormValues>;
}

const AREA_CODES = ["PRODUCT", "ENGINEERING", "DESIGN", "SALES_MARKETING", "OPERATIONS"] as const;

export function MoreStep({ form }: MoreStepProps) {
  const { register, watch, setValue } = form;
  const t = sr.profile.steps.more;

  const areas = watch("areas");
  const selectedInterests = watch("interests");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ideaStatus">{t.ideaStatus} *</Label>
        <select id="ideaStatus" className={selectClass} {...register("ideaStatus")}>
          <option value="">—</option>
          <option value="COMMITTED">{t.ideaStatusOptions.COMMITTED}</option>
          <option value="EXPLORING">{t.ideaStatusOptions.EXPLORING}</option>
          <option value="OPEN">{t.ideaStatusOptions.OPEN}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ideas">{t.ideas}</Label>
        <Textarea id="ideas" maxLength={1000} {...register("ideas")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="hasCofounder">{t.hasCofounder}</Label>
        <select id="hasCofounder" className={selectClass} {...register("hasCofounder")}>
          <option value="">—</option>
          <option value="true">{sr.profile.steps.basic.isTechnicalYes}</option>
          <option value="false">{sr.profile.steps.basic.isTechnicalNo}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="timing">{t.timing} *</Label>
        <select id="timing" className={selectClass} {...register("timing")}>
          <option value="">—</option>
          <option value="ALREADY_FULL_TIME">{t.timingOptions.ALREADY_FULL_TIME}</option>
          <option value="READY_ON_MATCH">{t.timingOptions.READY_ON_MATCH}</option>
          <option value="WITHIN_YEAR">{t.timingOptions.WITHIN_YEAR}</option>
          <option value="NO_PLANS">{t.timingOptions.NO_PLANS}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t.areas} *</Label>
        <div className="flex flex-col gap-2">
          {AREA_CODES.map((code) => (
            <label key={code} className={checkboxRowClass}>
              <input
                type="checkbox"
                className={checkboxInputClass}
                checked={areas.includes(code)}
                onChange={() => setValue("areas", toggleValue(areas, code), { shouldDirty: true })}
              />
              {t.areaOptions[code]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t.interests} *</Label>
        <div className="grid grid-cols-2 gap-2">
          {interests.map((interest) => (
            <label key={interest.code} className={checkboxRowClass}>
              <input
                type="checkbox"
                className={checkboxInputClass}
                checked={selectedInterests.includes(interest.code)}
                onChange={() =>
                  setValue("interests", toggleValue(selectedInterests, interest.code), {
                    shouldDirty: true,
                  })
                }
              />
              {interest.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="equityExpectations">{t.equityExpectations}</Label>
        <Input id="equityExpectations" maxLength={250} {...register("equityExpectations")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="freeTime">{t.freeTime}</Label>
        <Textarea id="freeTime" maxLength={500} {...register("freeTime")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lifePath">{t.lifePath}</Label>
        <Textarea id="lifePath" maxLength={500} {...register("lifePath")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="other">{t.other}</Label>
        <Textarea id="other" maxLength={500} {...register("other")} />
      </div>
    </div>
  );
}
