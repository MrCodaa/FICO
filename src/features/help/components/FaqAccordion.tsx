import { ChevronDown } from "lucide-react";

import { sr } from "@/content/sr";

type FaqItem = {
  q: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  ordered?: boolean;
  after?: readonly string[];
};

function Answer({ item }: { item: FaqItem }) {
  const ListTag = item.ordered ? "ol" : "ul";
  return (
    <div className="text-muted-foreground flex flex-col gap-3 pb-5 text-base leading-relaxed">
      {item.paragraphs?.map((p) => <p key={p}>{p}</p>)}
      {item.list && (
        <ListTag className={`flex flex-col gap-1.5 pl-6 ${item.ordered ? "list-decimal" : "list-disc"}`}>
          {item.list.map((li) => <li key={li}>{li}</li>)}
        </ListTag>
      )}
      {item.after?.map((p) => <p key={p}>{p}</p>)}
    </div>
  );
}

/** Harmonika bez biblioteka: nativni <details>/<summary> (tastatura i čitači ekrana rade sami). */
export function FaqAccordion() {
  return (
    <div className="flex flex-col gap-10">
      {sr.misc.faq.groups.map((group) => (
        <section key={group.title} aria-labelledby={`faq-${group.title}`} className="flex flex-col gap-2">
          <h2 id={`faq-${group.title}`} className="text-2xl font-bold tracking-tight">
            {group.title}
          </h2>
          <div className="border-t">
            {(group.items as readonly FaqItem[]).map((item) => (
              <details key={item.q} className="group border-b">
                <summary className="focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <Answer item={item} />
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
