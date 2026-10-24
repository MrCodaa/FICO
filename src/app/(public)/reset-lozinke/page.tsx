"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "@/lib/zodErrorMap";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { sr } from "@/content/sr";
import { resetPasswordFormSchema } from "@/features/auth/passwordConfirm";

type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { title, passwordLabel, passwordHint, confirmPasswordLabel, submit, success, error, loginLink } =
    sr.auth.resetPassword;

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: data.password }),
      });
      if (!res.ok) {
        throw new Error("TOKEN_INVALID");
      }
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>

        {mutation.isSuccess ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-muted-foreground text-sm">{success}</p>
            <Link href="/prijava" className="text-foreground underline-offset-4 hover:underline">
              {loginLink}
            </Link>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{passwordLabel}</Label>
              <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} />
              <p className="text-muted-foreground text-xs">{passwordHint}</p>
              {form.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">{confirmPasswordLabel}</Label>
              <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <p className="text-destructive text-sm">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {mutation.isError && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={mutation.isPending} className="mt-2">
              {submit}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
