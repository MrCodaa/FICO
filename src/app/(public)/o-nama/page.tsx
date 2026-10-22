"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { StaticPageShell } from "../_components/StaticPageShell";
import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";
import { getNextRoute } from "@/lib/nextRoute";
import { fetchMe } from "@/lib/http/apiClient";

export default function AboutPage() {
  const a = sr.about;
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
  });
  const appHref = meQuery.data ? getNextRoute(meQuery.data) : null;

  return (
    <StaticPageShell>
      <div className="bg-beige">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 md:py-14">
          <p className="text-muted-foreground text-lg font-medium">
            {a.eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-5xl">
            {a.title}
          </h1>
          <p className="mt-4 text-xl leading-relaxed">{a.intro}</p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-10 sm:px-6 md:py-14">
        {a.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="flex flex-col gap-4"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              {section.title}
            </h2>
            {"paragraphs" in section &&
              section.paragraphs.map((p) => (
                <p
                  key={p}
                  className="text-foreground/85 text-lg leading-relaxed"
                >
                  {p}
                </p>
              ))}
            {"steps" in section && (
              <ol className="flex flex-col gap-4">
                {section.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="text-foreground/80 mt-1 leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {"values" in section && (
              <div className="grid gap-4 md:grid-cols-3">
                {section.values.map((v) => (
                  <div key={v.title} className="rounded-xl border p-5">
                    <h3 className="text-lg font-semibold">{v.title}</h3>
                    <p className="text-foreground/80 mt-2 leading-relaxed">
                      {v.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        <div className="bg-foreground text-background flex flex-col items-start gap-5 rounded-2xl px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-background text-2xl font-bold tracking-tight">
              {a.cta.title}
            </h2>
            <p className="text-background/70 text-lg">{a.cta.subtitle}</p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={appHref ?? "/registracija"}>
              {appHref ? a.cta.openApp : a.cta.button}
            </Link>
          </Button>
        </div>
      </div>
    </StaticPageShell>
  );
}
