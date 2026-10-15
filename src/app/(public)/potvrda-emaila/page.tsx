"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { sr } from "@/content/sr";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { title, pending, success, error, loginLink } = sr.auth.verifyEmail;

  const mutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: verificationToken }),
      });
      if (!res.ok) {
        throw new Error("TOKEN_INVALID");
      }
    },
  });

  useEffect(() => {
    mutation.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

        {mutation.isSuccess && <p className="text-muted-foreground text-sm">{success}</p>}
        {mutation.isError && <p className="text-destructive text-sm">{error}</p>}
        {mutation.isPending && <p className="text-muted-foreground text-sm">{pending}</p>}

        {(mutation.isSuccess || mutation.isError) && (
          <Link href="/prijava" className="text-foreground underline-offset-4 hover:underline">
            {loginLink}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
