import { StaticPageShell } from "@/app/(public)/_components/StaticPageShell";

/** Okvir javnih informativnih stranica (FAQ, Pomoć): zajednički okvir + naslov u traci i uski sadržaj. */
export function PublicShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <StaticPageShell>
      <div className="bg-beige">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 md:py-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-[2.5rem]">{title}</h1>
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 md:py-10">{children}</div>
    </StaticPageShell>
  );
}
