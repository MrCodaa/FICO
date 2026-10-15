"use client";

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
  const { title, emailLabel, passwordLabel, passwordHint, submit, loginPrompt, loginLink } =
    sr.auth.register;

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
      return res.json();
    },
    onSuccess: () => {
      router.push("/");
    },
  });

  const onSubmit = (data: RegisterForm) => {
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
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <p className="text-muted-foreground text-xs">{passwordHint}</p>
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
        </form>

        <p className="text-muted-foreground text-center text-sm">
          {loginPrompt}{" "}
          <Link href="/prijava" className="text-foreground underline-offset-4 hover:underline">
            {loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
