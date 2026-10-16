"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sr } from "@/content/sr";
import { getNextRoute, type MeState } from "@/lib/nextRoute";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

type RegisterForm = z.infer<typeof registerSchema>;

type ApiErrorBody = {
  error?: { code?: string; message?: string; fields?: Record<string, string[]> };
};

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
  const [showPassword, setShowPassword] = useState(false);
  const t = sr.auth.register;

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(body.error?.code ?? "GENERIC");
      }
      return res.json() as Promise<MeState>;
    },
    onSuccess: (me) => {
      router.push(getNextRoute(me));
    },
  });

  const onSubmit = (data: RegisterForm) => {
    mutation.mutate(data);
  };

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
                {form.formState.errors.email && (
                  <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">{t.passwordLabel}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={t.passwordPlaceholder}
                    className="h-11 pr-20"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 px-3 text-sm font-medium"
                  >
                    {showPassword ? t.hidePassword : t.showPassword}
                  </button>
                </div>
                {form.formState.errors.password ? (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.password.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">{t.passwordHint}</p>
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
