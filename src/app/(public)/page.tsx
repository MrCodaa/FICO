import Link from "next/link";
import { Button } from "@/components/ui/button";
import { sr } from "@/content/sr";

export default function HomePage() {
  const { brand, nav, hero, how, footer } = sr.landing;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <span className="text-lg font-semibold">{brand}</span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/prijava">{nav.login}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/registracija">{nav.register}</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{hero.title}</h1>
          <p className="text-muted-foreground text-base sm:text-lg">{hero.subtitle}</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/registracija">{hero.cta}</Link>
            </Button>
            <Link
              href="/prijava"
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
            >
              {hero.ctaSecondary}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">{how.title}</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {how.steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-2 text-center sm:text-left">
                <span className="text-muted-foreground text-sm font-medium">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        {brand} — {footer.tagline}
      </footer>
    </div>
  );
}
