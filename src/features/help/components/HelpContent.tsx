import Link from "next/link";

import { sr } from "@/content/sr";

const linkClass = "text-primary font-semibold underline underline-offset-2";

export function HelpContent({ faqHref }: { faqHref: string }) {
  const h = sr.misc.help;
  const mail = sr.supportEmail;
  const mailLink = (
    <a href={`mailto:${mail}`} className={linkClass}>
      {mail}
    </a>
  );
  return (
    <div className="flex flex-col gap-10 text-base leading-relaxed">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{h.feedbackTitle}</h2>
        <p>
          {h.feedbackBody}
          {mailLink}.
        </p>
        <p>
          {h.feedbackFaq}
          <Link href={faqHref} className={linkClass}>
            {h.faqLink}
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{h.abuseTitle}</h2>
        <p>{h.abuseBody}</p>
        <p className="font-semibold">{h.abuseHow}</p>
        <ul className="flex list-disc flex-col gap-1.5 pl-6">
          {h.abuseSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p>{mailLink}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{h.techTitle}</h2>
        <p>{h.techBody}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{h.feedbackSectionTitle}</h2>
        <p>{h.feedbackSectionBody}</p>
      </section>
    </div>
  );
}
