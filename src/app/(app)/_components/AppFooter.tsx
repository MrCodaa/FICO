"use client";

import Link from "next/link";

import { sr } from "@/content/sr";

import { FicoLogo } from "./FicoLogo";
import { useHomeHref } from "./useHomeHref";
import { useLogout } from "./useLogout";

const linkClass =
  "text-foreground/75 hover:text-foreground cursor-pointer text-[1.0625rem] transition-colors";

/** Footer na dnu sredine, u jednom redu kao na yc-discover-3-dno.png. */
export function AppFooter({
  publicMode = false,
}: { publicMode?: boolean } = {}) {
  const logoutMutation = useLogout();
  const homeHref = useHomeHref(publicMode ? "/" : "/app");
  return (
    <footer className="bg-background border-t">
      <div className="flex flex-wrap items-center gap-x-14 gap-y-4 px-4 py-8 sm:px-8 xl:px-10">
        <Link href={homeHref} aria-label={sr.landing.brand}>
          <FicoLogo className="text-lg" />
        </Link>
        <Link href="/o-nama" className={linkClass}>
          {sr.footer.about}
        </Link>
        <Link href="/privatnost" className={linkClass}>
          {sr.footer.privacy}
        </Link>
        <Link href="/uslovi" className={linkClass}>
          {sr.footer.terms}
        </Link>
        <Link href="/faq" className={linkClass}>
          {sr.footer.faq}
        </Link>
        <Link href="/pomoc" className={linkClass}>
          {sr.footer.help}
        </Link>
        {!publicMode && (
          <button
            type="button"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            className={`${linkClass} disabled:opacity-50`}
          >
            {sr.footer.logout}
          </button>
        )}
      </div>
    </footer>
  );
}
