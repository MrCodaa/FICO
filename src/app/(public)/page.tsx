"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PublicAuthNav } from "./_components/PublicAuthNav";
import { sr } from "@/content/sr";
import { fetchMe } from "@/lib/http/apiClient";
import { getNextRoute } from "@/lib/nextRoute";

function BrandMark({ brand }: { brand: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="bg-primary text-primary-foreground inline-flex size-8 items-center justify-center rounded-md text-lg leading-none font-bold"
      >
        {brand.charAt(0)}
      </span>
      <span className="text-lg font-bold tracking-tight">{brand}</span>
    </span>
  );
}

function MatchPreview() {
  const p = sr.landing.preview;
  return (
    <div className="bg-card relative w-full max-w-md rounded-2xl border p-6 shadow-[0_24px_60px_-24px_rgba(242,102,37,0.35)] md:p-8">
      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{p.label}</span>
      <div className="mt-5 flex items-center gap-4">
        <span
          aria-hidden
          className="bg-accent text-accent-foreground inline-flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
        >
          {p.name.charAt(0)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-lg font-semibold">{p.name}</span>
          <span className="text-muted-foreground text-sm">{p.location}</span>
          <span className="text-muted-foreground text-sm">{p.role}</span>
        </div>
      </div>
      <p className="mt-6 border-t pt-5 text-sm font-semibold">{p.reasonsTitle}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {p.reasons.map((reason) => (
          <li key={reason} className="flex gap-2.5 text-[0.9375rem] leading-snug">
            <span aria-hidden className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      <div aria-hidden className="mt-6 grid grid-cols-2 gap-3">
        <span className="bg-primary text-primary-foreground inline-flex h-11 items-center justify-center rounded-md text-[0.9375rem] font-semibold">
          {p.like}
        </span>
        <span className="border-input inline-flex h-11 items-center justify-center rounded-md border text-[0.9375rem] font-semibold">
          {p.think}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { brand, nav, hero, how, finalCta, footer } = sr.landing;

  // Landing se uvijek prikazuje. Ulogovan korisnik ne biva preusmjeren, nego
  // umjesto Prijava/Registruj se dobija dugme koje vodi na njegov sljedeći korak.
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const appHref = meQuery.data ? getNextRoute(meQuery.data) : null;

  const primaryCta = appHref ? (
    <Button asChild size="lg">
      <Link href={appHref}>{nav.openApp}</Link>
    </Button>
  ) : (
    <>
      <Button asChild size="lg">
        <Link href="/registracija">{hero.cta}</Link>
      </Button>
      <Link
        href="/prijava"
        className="text-muted-foreground hover:text-foreground text-[0.9375rem] font-medium underline-offset-4 hover:underline"
      >
        {hero.ctaSecondary}
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label={brand}>
            <BrandMark brand={brand} />
          </Link>
          <nav className="flex items-center gap-2" aria-busy={meQuery.isLoading}>
            <PublicAuthNav
              appHref={appHref}
              loading={meQuery.isLoading}
              loginLabel={nav.login}
              registerLabel={nav.register}
            />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-sm font-semibold">
              {hero.eyebrow}
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{hero.title}</h1>
            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed md:text-xl">{hero.subtitle}</p>
            <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              {primaryCta}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <MatchPreview />
          </div>
        </section>

        <section className="bg-surface border-y">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{how.title}</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {how.steps.map((step, index) => (
                <li key={step.title} className="bg-card flex flex-col gap-3 rounded-xl border p-6 md:p-8">
                  <span className="bg-primary text-primary-foreground inline-flex size-9 items-center justify-center rounded-full text-base font-bold">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="bg-foreground text-background flex flex-col items-start gap-6 rounded-2xl px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12 md:py-14">
            <div className="flex flex-col gap-2">
              <h2 className="text-background text-2xl font-bold tracking-tight md:text-3xl">{finalCta.title}</h2>
              <p className="text-background/70 text-lg">{finalCta.subtitle}</p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={appHref ?? "/registracija"}>{appHref ? nav.openApp : hero.cta}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row sm:px-6 lg:px-8">
          <BrandMark brand={brand} />
          <span>
            {brand} — {footer.tagline}
          </span>
        </div>
      </footer>
    </div>
  );
}
