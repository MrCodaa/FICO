"use client";

import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

// Komponente polja za "Moj profil" (yc-my-profile.png): podebljan naslov
// pitanja sa crvenom zvjezdicom, opcioni podnaslov, veliki inputi i radio
// dugmad umjesto malih padajućih lista. Isti skup za onboarding i uređivanje.

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-0.5">
        <LabelTag {...(htmlFor ? { htmlFor } : {})} className="text-[1.0625rem] font-semibold">
          {label}
          {required && (
            <span aria-hidden className="text-destructive ml-0.5 align-super text-sm">
              *
            </span>
          )}
        </LabelTag>
        {hint && <p className="text-foreground/80">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const controlClass = "accent-[var(--info)] size-5 shrink-0 cursor-pointer";

export function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled,
  inline,
}: {
  name: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  inline?: boolean;
}) {
  return (
    <div role="radiogroup" className={cn("flex gap-x-6 gap-y-2.5", inline ? "flex-wrap" : "flex-col")}>
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3 text-[1.0625rem]">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
            className={controlClass}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function CheckboxGroup({
  values,
  options,
  onChange,
  disabled,
  columns = 1,
}: {
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  columns?: 1 | 2 | 3;
}) {
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-2.5",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3 text-[1.0625rem]">
          <input
            type="checkbox"
            checked={values.includes(option.value)}
            disabled={disabled}
            onChange={() => toggle(option.value)}
            className={controlClass}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[1.0625rem]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={controlClass}
      />
      {label}
    </label>
  );
}

type Importance = "" | "REQUIRED" | "PREFERRED";

/** "Obavezno / Poželjno / Bez preference" uz svaku preferencu, kao na YC. */
export function ImportanceRadios({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value: Importance;
  onChange: (value: Importance) => void;
  disabled?: boolean;
}) {
  const o = sr.profile.steps.preference.importanceOptions;
  return (
    <div className="bg-surface flex flex-col gap-2 rounded-md border px-4 py-3">
      <span className="text-muted-foreground text-sm font-medium">{sr.profile.steps.preference.importance}</span>
      <RadioGroup<"REQUIRED" | "PREFERRED" | "NONE">
        name={name}
        inline
        disabled={disabled}
        value={value === "" ? "NONE" : value}
        onChange={(v) => onChange(v === "NONE" ? "" : v)}
        options={[
          { value: "REQUIRED", label: o.REQUIRED },
          { value: "PREFERRED", label: o.PREFERRED },
          { value: "NONE", label: o.NONE },
        ]}
      />
    </div>
  );
}
