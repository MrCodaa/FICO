"use client";

import { useContext, useRef, useState, type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { countries } from "@/content/catalog";
import { sr } from "@/content/sr";
import { birthDateIssue } from "@/lib/age";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { isAcceptablePhoto } from "@/features/profile/photoCheck";
import { isValidInstagramUrl, isValidLinkedinUrl, isValidSchedulingUrl, isValidTwitterUrl, isValidVideoUrl } from "@/features/profile/urlSchemas";

import { ApiError, uploadPhoto } from "../api";
import { CityCombobox } from "../CityCombobox";
import { Checkbox, Field, FieldErrorsContext, RadioGroup } from "../fields";
import { resizeImageToBlob } from "../resizeImage";
import type { ProfileFormValues } from "../types";
import { selectClass } from "../ui";

interface BasicStepProps {
  form: UseFormReturn<ProfileFormValues>;
  email: string;
  disabled?: boolean;
}

export function BasicStep({ form, email, disabled }: BasicStepProps) {
  const { register, watch, setValue } = form;
  const t = sr.profile.steps.basic;
  const errors = sr.profile.errors;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const photoUrl = watch("photoUrl");
  const noLinkedin = watch("noLinkedin");
  const countryCode = watch("countryCode");
  const fieldErrors = useContext(FieldErrorsContext);
  // Živa provjera linka; kad Field već prikazuje grešku za isto polje (poslije slanja), ne dupliraj je.
  const urlError = (name: "linkedinUrl" | "videoUrl" | "schedulingUrl" | "twitterUrl" | "instagramUrl", check: (v: string) => boolean, message: string) => {
    if (fieldErrors[name]) return null;
    const value = (watch(name) ?? "").trim();
    return value && !check(value) ? <p className="text-destructive text-sm">{message}</p> : null;
  };
  // Živa poruka za datum rođenja iz istog pravila kao Zod šema (18+, bez budućnosti i prije 1900).
  const birthDateError = () => {
    if (fieldErrors.birthDate) return null;
    const raw = watch("birthDate");
    if (!raw) return null;
    const issue = birthDateIssue(new Date(raw), new Date());
    if (!issue) return null;
    const msg = issue === "underage" ? sr.profile.fieldErrors.byField.birthDateUnderage : sr.profile.fieldErrors.byField.birthDate;
    return <p className="text-destructive text-sm">{msg}</p>;
  };
  const countryField = register("countryCode");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhotoError(null);
    if (!isAcceptablePhoto(file)) {
      setPhotoError(errors.photoClientInvalid);
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeImageToBlob(file, 800);
      const { photoUrl: uploadedUrl } = await uploadPhoto(blob, file.name);
      setValue("photoUrl", uploadedUrl, { shouldDirty: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        const fileError = err.fields?.file;
        setPhotoError(typeof fileError === "string" ? fileError : errors.photoInvalidType);
      } else {
        setPhotoError(errors.photoUnavailable);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2">
        <ProfileAvatar
          photoUrl={photoUrl}
          firstName={watch("firstName")}
          lastName={watch("lastName")}
          className="size-32 text-3xl"
        />
        <button
          type="button"
          disabled={uploading || disabled}
          onClick={() => fileInputRef.current?.click()}
          className="text-link cursor-pointer text-lg hover:underline disabled:opacity-50"
        >
          {t.photoChange}
          <span className="text-destructive"> *</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-muted-foreground text-sm">{t.photoHint}</p>
        {photoError && <p className="text-destructive text-sm">{photoError}</p>}
      </div>

      <div className="grid gap-x-3 gap-y-8 sm:grid-cols-2">
        <Field label={t.firstName} htmlFor="firstName" required>
          <Input id="firstName" {...register("firstName")} />
        </Field>
        <Field label={t.lastName} htmlFor="lastName" required>
          <Input id="lastName" {...register("lastName")} />
        </Field>
      </div>

      <Field label={t.email} htmlFor="email" required>
        <Input id="email" value={email} readOnly disabled className="bg-surface" />
      </Field>

      <Field label={t.linkedinUrl} htmlFor="linkedinUrl" required={!noLinkedin} hint={t.linkedinHint}>
        <Input id="linkedinUrl" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} disabled={noLinkedin} {...register("linkedinUrl")} />
        {urlError("linkedinUrl", isValidLinkedinUrl, errors.linkedinInvalid)}
        <div className="pt-2">
          <Checkbox
            checked={noLinkedin}
            label={t.noLinkedin}
            disabled={disabled}
            onChange={(checked) => setValue("noLinkedin", checked, { shouldDirty: true })}
          />
        </div>
      </Field>

      <Field label={t.location} name="location" htmlFor="city" required hint={t.locationHint}>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            aria-label={t.country}
            className={selectClass}
            {...countryField}
            onChange={(e) => {
              countryField.onChange(e);
              // Promjena države resetuje grad.
              setValue("city", "", { shouldDirty: true });
            }}
          >
            <option value="">{t.country}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <CityCombobox
            id="city"
            countryCode={countryCode}
            value={watch("city")}
            disabled={disabled}
            invalid={Boolean(fieldErrors.location)}
            describedBy={fieldErrors.location ? "location-error" : undefined}
            onChange={(city) => setValue("city", city, { shouldDirty: true })}
          />
        </div>
      </Field>

      <Field label={t.intro} htmlFor="intro" required>
        <Textarea id="intro" maxLength={1000} className="min-h-32" {...register("intro")} />
      </Field>

      <Field label={t.videoUrl} htmlFor="videoUrl">
        <Input id="videoUrl" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} {...register("videoUrl")} />
        {urlError("videoUrl", isValidVideoUrl, errors.videoInvalid)}
      </Field>

      <Field label={t.accomplishment} htmlFor="accomplishment" required>
        <Textarea id="accomplishment" maxLength={1000} className="min-h-32" {...register("accomplishment")} />
      </Field>

      <Field label={t.education} htmlFor="education" required>
        <Textarea id="education" maxLength={800} {...register("education")} />
      </Field>

      <Field label={t.employment} htmlFor="employment" required>
        <Textarea id="employment" maxLength={800} {...register("employment")} />
      </Field>

      <Field label={t.isTechnical} name="isTechnical" required>
        <RadioGroup
          name="isTechnical"
          inline
          disabled={disabled}
          value={watch("isTechnical")}
          onChange={(v) => setValue("isTechnical", v, { shouldDirty: true })}
          options={[
            { value: "true", label: t.isTechnicalYes },
            { value: "false", label: t.isTechnicalNo },
          ]}
        />
      </Field>

      <Field label={t.gender} name="gender" required>
        <RadioGroup
          name="gender"
          inline
          disabled={disabled}
          value={watch("gender")}
          onChange={(v) => setValue("gender", v, { shouldDirty: true })}
          options={[
            { value: "MALE", label: t.genderOptions.MALE },
            { value: "FEMALE", label: t.genderOptions.FEMALE },
            { value: "OTHER", label: t.genderOptions.OTHER },
          ]}
        />
      </Field>

      <Field label={t.birthDate} htmlFor="birthDate" required>
        <Input id="birthDate" type="date" className="sm:max-w-xs" {...register("birthDate")} />
        {birthDateError()}
      </Field>

      <Field label={t.schedulingUrl} htmlFor="schedulingUrl">
        <Input id="schedulingUrl" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} {...register("schedulingUrl")} />
        {urlError("schedulingUrl", isValidSchedulingUrl, errors.schedulingInvalid)}
      </Field>

      <Field label={t.twitterUrl} htmlFor="twitterUrl">
        <Input id="twitterUrl" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} {...register("twitterUrl")} />
        {urlError("twitterUrl", isValidTwitterUrl, errors.twitterInvalid)}
      </Field>

      <Field label={t.instagramUrl} htmlFor="instagramUrl">
        <Input id="instagramUrl" type="text" inputMode="url" autoCapitalize="none" spellCheck={false} {...register("instagramUrl")} />
        {urlError("instagramUrl", isValidInstagramUrl, errors.instagramInvalid)}
      </Field>

      <Field label={t.heardFrom} htmlFor="heardFrom">
        <Input id="heardFrom" {...register("heardFrom")} />
      </Field>
    </fieldset>
  );
}
