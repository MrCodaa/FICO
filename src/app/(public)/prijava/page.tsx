"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { sr } from "@/content/sr";
import { getNextRoute, type MeState } from "@/lib/nextRoute";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

type LoginForm = z.infer<typeof loginSchema>;

type ApiErrorBody = {
  error?: { code?: string; message?: string; fields?: Record<string, string[]> };
};

function getErrorMessage(code: string) {
  const { errors } = sr.auth;
  switch (code) {
    case "INVALID_CREDENTIALS":
      return errors.invalidCredentials;
    case "VALIDATION_ERROR":
      return errors.validationError;
    default:
      return errors.generic;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { title, emailLabel, passwordLabel, submit, forgotLink, registerPrompt, registerLink } =
    sr.auth.login;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await fetch("/api/auth/login", {
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
      // Svjež Me u keš: inače /app vidi stari "odjavljen" (null) iz keša i vrati na prijavu.
      queryClient.setQueryData(["me"], me);
      router.push(getNextRoute(me));
    },
  });

  const onSubmit = (data: LoginForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{emailLabel}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{passwordLabel}</Label>
            <PasswordInput id="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-destructive text-sm">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {mutation.isError && (
            <p className="text-destructive text-sm">
              {getErrorMessage((mutation.error as Error).message)}
            </p>
          )}

          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {submit}
          </Button>

          <Link
            href="/zaboravljena-lozinka"
            className="text-muted-foreground text-center text-sm underline-offset-4 hover:underline"
          >
            {forgotLink}
          </Link>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {registerPrompt}{" "}
          <Link
            href="/registracija"
            className="text-foreground underline-offset-4 hover:underline"
          >
            {registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
