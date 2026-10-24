"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { ApiClientError, apiFetch, fetchMe } from "@/lib/http/apiClient";
import { getNextRoute } from "@/lib/nextRoute";

const t = sr.auth.verifyEmail;

/** Link iz maila: /potvrda-emaila?token=… potvrđuje nalog i vodi dalje. */
function VerifyToken({ token }: { token: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const started = useRef(false);

  const verify = useMutation({
    mutationFn: () => apiFetch<void>("/api/auth/verify-email", { method: "POST", json: { token } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verify.mutate();
  }, [verify]);

  const continueOn = async () => {
    const me = await queryClient.fetchQuery({ queryKey: ["me"], queryFn: fetchMe });
    router.replace(me ? getNextRoute(me) : "/prijava");
  };

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
      {verify.isPending && <p className="text-muted-foreground">{t.pending}</p>}
      {verify.isSuccess && (
        <>
          <p className="text-muted-foreground">{t.success}</p>
          <Button type="button" onClick={continueOn}>
            {t.continue}
          </Button>
        </>
      )}
      {verify.isError && (
        <>
          <p className="text-destructive">{t.error}</p>
          <Link href="/prijava" className="underline-offset-4 hover:underline">
            {t.loginLink}
          </Link>
        </>
      )}
    </>
  );
}

/** Poslije registracije: "Provjeri svoj email" + ponovno slanje linka. */
function CheckInbox() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const me = meQuery.data;

  useEffect(() => {
    if (meQuery.data === null) router.replace("/prijava");
    else if (meQuery.data?.emailVerified) router.replace(getNextRoute(meQuery.data));
  }, [meQuery.data, router]);

  const resend = useMutation({
    mutationFn: () => apiFetch<void>("/api/auth/resend-verification", { method: "POST" }),
  });

  const recheck = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      return queryClient.fetchQuery({ queryKey: ["me"], queryFn: fetchMe });
    },
  });

  const tooSoon = resend.error instanceof ApiClientError && resend.error.status === 429;
  const stillUnverified = recheck.isSuccess && recheck.data && !recheck.data.emailVerified;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t.checkTitle}</h1>
      <p className="text-muted-foreground leading-relaxed">{me ? t.checkText(me.email) : t.pending}</p>
      <div className="flex flex-col gap-3">
        <Button type="button" disabled={recheck.isPending} onClick={() => recheck.mutate()}>
          {t.alreadyVerified}
        </Button>
        <Button type="button" variant="outline" disabled={resend.isPending} onClick={() => resend.mutate()}>
          {t.resend}
        </Button>
      </div>
      {stillUnverified && <p className="text-destructive text-sm">{t.notYet}</p>}
      {resend.isSuccess && <p className="text-sm">{t.resent}</p>}
      {resend.isError && <p className="text-destructive text-sm">{tooSoon ? t.resendTooSoon : sr.auth.errors.generic}</p>}
    </>
  );
}

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-6 text-center">
        {token ? <VerifyToken token={token} /> : <CheckInbox />}
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
