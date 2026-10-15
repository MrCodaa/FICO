"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

function errorMessage(code: string): string {
  switch (code) {
    case "EMAIL_NOT_VERIFIED":
      return sr.auth.errors.emailNotVerified;
    case "VALIDATION_ERROR":
      return sr.agreement.error;
    default:
      return sr.auth.errors.generic;
  }
}

export default function AgreementPage() {
  const router = useRouter();
  const { title, subtitle, items, submit } = sr.agreement;
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));

  const allChecked = checked.every(Boolean);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmations: checked }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.code ?? "GENERIC");
      }
    },
    onSuccess: () => {
      // Pravila su korak neposredno prije kreiranja profila — normalan tok
      // nakon prihvatanja je uvijek popunjavanje profila.
      router.push("/profil");
    },
  });

  const toggle = (index: number) => {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>

        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`item-${index}`}
                checked={checked[index]}
                onChange={() => toggle(index)}
                className="border-input mt-1 h-4 w-4 shrink-0 rounded"
              />
              <label htmlFor={`item-${index}`} className="text-sm">
                {item}
              </label>
            </li>
          ))}
        </ul>

        {mutation.isError && (
          <p className="text-destructive text-sm">{errorMessage((mutation.error as Error).message)}</p>
        )}

        <Button disabled={!allChecked || mutation.isPending} onClick={() => mutation.mutate()}>
          {submit}
        </Button>
      </div>
    </div>
  );
}
