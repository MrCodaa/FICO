import { StaticPageShell } from "./StaticPageShell";
import type { PolicySection } from "@/content/legal";
import { sr } from "@/content/sr";

export interface LegalDoc {
  title: string;
  updated: string;
  intro: readonly string[];
  definitionsTitle?: string;
  definitions?: readonly string[];
  sections: readonly PolicySection[];
}

/** Zajednički prikaz pravnih dokumenata (Privatnost, Uslovi): naslov, uvod, sadržaj i odjeljci. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <StaticPageShell>
      <div className="bg-beige">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            {doc.title}
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            {doc.updated}
          </p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 md:py-14">
        <div className="flex flex-col gap-4">
          {doc.intro.map((p) => (
            <p key={p} className="text-foreground/85 text-lg leading-relaxed">
              {p}
            </p>
          ))}
          {doc.definitions && (
            <>
              <h2 className="mt-2 text-xl font-bold tracking-tight">
                {doc.definitionsTitle}
              </h2>
              <ul className="text-foreground/85 list-disc space-y-1 pl-6 leading-relaxed">
                {doc.definitions.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <nav aria-label={sr.publicPages.toc} className="rounded-xl border p-5">
          <h2 className="text-lg font-bold">{sr.publicPages.toc}</h2>
          <ol className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-foreground/80 hover:text-foreground underline-offset-4 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {doc.sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="flex scroll-mt-24 flex-col gap-4"
          >
            <h2 className="text-2xl font-bold tracking-tight">{s.title}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p} className="text-foreground/85 leading-relaxed">
                {p}
              </p>
            ))}
            {s.list && (
              <ul className="text-foreground/85 list-disc space-y-2 pl-6 leading-relaxed">
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
            {s.table && (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <caption className="sr-only">{s.table.caption}</caption>
                  <thead className="bg-beige">
                    <tr>
                      {s.table.headers.map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 font-semibold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {s.table.rows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, i) => (
                          <td key={i} className="px-4 py-3 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {s.after?.map((p) => (
              <p key={p} className="text-foreground/85 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
        <a
          href="#"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          {sr.publicPages.backToTop}
        </a>
      </div>
    </StaticPageShell>
  );
}
