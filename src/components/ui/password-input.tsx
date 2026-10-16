"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

import { Input } from "./input";

/** Polje za lozinku sa dugmetom Prikaži / Sakrij (prijava, registracija, reset lozinke). */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);
  const t = sr.auth.register;
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-24", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 inline-flex cursor-pointer items-center gap-1.5 px-3 text-sm font-medium"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        {visible ? t.hidePassword : t.showPassword}
      </button>
    </div>
  );
}

export { PasswordInput };
