"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "@/lib/zodErrorMap";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { sr } from "@/content/sr";
import { passwordWithConfirmShape, refinePasswordsMatch } from "@/features/auth/passwordConfirm";
import { getNextRoute, type MeState } from "@/lib/nextRoute";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, sr.profile.errors.required),
    lastName: z.string().trim().min(1, sr.profile.errors.required),
    email: z.string().trim().toLowerCase().email(),
    ...passwordWithConfirmShape,
    linkedinUrl: z.string().trim(),
    noLinkedin: z.boolean(),
  })
  .superRefine((data, ctx) => {
    refinePasswordsMatch(data, ctx);
    if (!data.noLinkedin && !data.linkedinUrl) {
      ctx.addIssue({ code: "custom", path: ["linkedinUrl"], message: sr.profile.errors.linkedinRequired });
    }
  });

type RegisterForm = z.infer<typeof registerSchema>;

type ApiErrorBody = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

class RegisterError extends Error {
  constructor(
    code: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(code);
  }
}

function getErrorMessage(code: string) {
  const { errors } = sr.auth;
  switch (code) {
    case "EMAIL_TAKEN":
      return errors.emailTaken;
    case "VALIDATION_ERROR":
      return errors.validationError;
    default:
      return errors.generic;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = sr.auth.register;

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "", linkedinUrl: "", noLinkedin: false },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...payload } = data;
      void confirmPassword;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        throw new RegisterError(body.error?.code ?? "GENERIC", body.error?.fields);
      }
      return res.json() as Promise<MeState>;
    },
    onSuccess: (me) => {
      // Svjež Me u keš: inače /app vidi stari "odjavljen" (null) iz keša i vrati na prijavu.
      queryClient.setQueryData(["me"], me);
      router.replace(getNextRoute(me));
    },
  });

  const onSubmit = (data: RegisterForm) => {
    mutation.mutate({ ...data, linkedinUrl: data.noLinkedin ? "" : data.linkedinUrl });
  };

  const noLinkedin = useWatch({ control: form.control, name: "noLinkedin" });
  const serverFields = mutation.error instanceof RegisterError ? mutation.error.fields : {};
  const fieldError = (name: keyof RegisterForm) => form.formState.errors[name]?.message ?? serverFields[name];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="bg-primary text-primary-foreground hidden flex-col justify-between p-12 lg:flex">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {sr.landing.brand}
        </Link>

        <div className="flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium tracking-wide uppercase opacity-70">
              {t.asideEyebrow}
            </span>
            <h2 className="text-4xl leading-tight font-bold tracking-tight">{t.asideTitle}</h2>
          </div>
          <ol className="flex flex-col gap-4">
            {t.asideSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="border-primary-foreground/40 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-base opacity-90">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm opacity-60">{sr.landing.footer.tagline}</p>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight lg:invisible">
            {sr.landing.brand}
          </Link>
          <p className="text-muted-foreground text-sm">
            {t.loginPrompt}{" "}
            <Link
              href="/prijava"
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {t.loginLink}
            </Link>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="flex w-full max-w-md flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="firstName">{t.firstNameLabel}</Label>
                  <Input id="firstName" autoComplete="given-name" className="h-11" {...form.register("firstName")} />
                  {fieldError("firstName") && <p className="text-destructive text-sm">{fieldError("firstName")}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lastName">{t.lastNameLabel}</Label>
                  <Input id="lastName" autoComplete="family-name" className="h-11" {...form.register("lastName")} />
                  {fieldError("lastName") && <p className="text-destructive text-sm">{fieldError("lastName")}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  className="h-11"
                  {...form.register("email")}
                />
                {fieldError("email") && <p className="text-destructive text-sm">{fieldError("email")}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="linkedinUrl">{t.linkedinLabel}</Label>
                <Input
                  id="linkedinUrl"
                  inputMode="url"
                  autoComplete="url"
                  placeholder={t.linkedinPlaceholder}
                  disabled={noLinkedin}
                  className="h-11"
                  {...form.register("linkedinUrl")}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="border-input h-4 w-4 rounded" {...form.register("noLinkedin")} />
                  {t.noLinkedinLabel}
                </label>
                {!noLinkedin && fieldError("linkedinUrl") && (
                  <p className="text-destructive text-sm">{fieldError("linkedinUrl")}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t.passwordLabel}</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder={t.passwordPlaceholder}
                  className="h-11"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.password.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">{t.passwordHint}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">{t.confirmPasswordLabel}</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  className="h-11"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-destructive text-sm">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {mutation.isError && (
                <p className="text-destructive text-sm">
                  {getErrorMessage((mutation.error as Error).message)}
                </p>
              )}

              <Button type="submit" size="lg" disabled={mutation.isPending} className="h-11 w-full">
                {mutation.isPending ? t.submitting : t.submit}
              </Button>

              <p className="text-muted-foreground text-xs leading-relaxed">{t.termsNote}</p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
