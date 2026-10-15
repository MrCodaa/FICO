"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countries, citiesByCountry } from "@/content/catalog";
import { sr } from "@/content/sr";

import { ApiError, uploadPhoto } from "../api";
import { resizeImageToBlob } from "../resizeImage";
import type { ProfileFormValues } from "../types";
import { checkboxInputClass, checkboxRowClass, selectClass } from "../ui";

interface BasicStepProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function BasicStep({ form }: BasicStepProps) {
  const { register, watch, setValue } = form;
  const t = sr.profile.steps.basic;
  const errors = sr.profile.errors;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const photoUrl = watch("photoUrl");
  const noLinkedin = watch("noLinkedin");
  const countryCode = watch("countryCode");
  const cityOptions = countryCode ? citiesByCountry[countryCode] ?? [] : [];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setPhotoError(null);
    try {
      const blob = await resizeImageToBlob(file, 800);
      const { photoUrl: uploadedUrl } = await uploadPhoto(blob, file.name);
      setValue("photoUrl", uploadedUrl, { shouldDirty: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setPhotoError(err.code === "VALIDATION_ERROR" ? errors.photoInvalidType : errors.generic);
      } else {
        setPhotoError(errors.generic);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{t.photo} *</Label>
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="bg-accent h-20 w-20 rounded-full" />
          )}
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoUrl ? t.photoReplace : t.photoUpload}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-muted-foreground text-xs">{t.photoHint}</p>
          </div>
        </div>
        {photoError && <p className="text-destructive text-sm">{photoError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">{t.firstName} *</Label>
        <Input id="firstName" {...register("firstName")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">{t.lastName} *</Label>
        <Input id="lastName" {...register("lastName")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="linkedinUrl">
          {t.linkedinUrl}
          {!noLinkedin && " *"}
        </Label>
        <Input id="linkedinUrl" disabled={noLinkedin} {...register("linkedinUrl")} />
        <label className={checkboxRowClass}>
          <input type="checkbox" className={checkboxInputClass} {...register("noLinkedin")} />
          {t.noLinkedin}
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="countryCode">{t.country} *</Label>
        <select id="countryCode" className={selectClass} {...register("countryCode")}>
          <option value="">—</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="city">{t.city} *</Label>
        <select
          id="city"
          className={selectClass}
          disabled={!countryCode}
          {...register("city")}
        >
          <option value="">—</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="intro">{t.intro} *</Label>
        <Textarea id="intro" maxLength={1000} {...register("intro")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="videoUrl">{t.videoUrl}</Label>
        <Input id="videoUrl" type="url" {...register("videoUrl")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="accomplishment">{t.accomplishment} *</Label>
        <Textarea id="accomplishment" maxLength={1000} {...register("accomplishment")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="education">{t.education} *</Label>
        <Textarea id="education" maxLength={800} {...register("education")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="employment">{t.employment} *</Label>
        <Textarea id="employment" maxLength={800} {...register("employment")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="isTechnical">{t.isTechnical} *</Label>
        <select id="isTechnical" className={selectClass} {...register("isTechnical")}>
          <option value="">—</option>
          <option value="true">{t.isTechnicalYes}</option>
          <option value="false">{t.isTechnicalNo}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="gender">{t.gender} *</Label>
        <select id="gender" className={selectClass} {...register("gender")}>
          <option value="">—</option>
          <option value="MALE">{t.genderOptions.MALE}</option>
          <option value="FEMALE">{t.genderOptions.FEMALE}</option>
          <option value="OTHER">{t.genderOptions.OTHER}</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="birthDate">{t.birthDate} *</Label>
        <Input id="birthDate" type="date" {...register("birthDate")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="schedulingUrl">{t.schedulingUrl}</Label>
        <Input id="schedulingUrl" type="url" {...register("schedulingUrl")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="twitterUrl">{t.twitterUrl}</Label>
        <Input id="twitterUrl" type="url" {...register("twitterUrl")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="instagramUrl">{t.instagramUrl}</Label>
        <Input id="instagramUrl" type="url" {...register("instagramUrl")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="heardFrom">{t.heardFrom}</Label>
        <Input id="heardFrom" {...register("heardFrom")} />
      </div>
    </div>
  );
}
