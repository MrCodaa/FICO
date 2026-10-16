import type { SummaryPart } from "../summary";

/** Ispisuje rečenicu-rezime sa podebljanim ključnim riječima. */
export function SummaryText({ parts, className }: { parts: SummaryPart[]; className?: string }) {
  return (
    <p className={className}>
      {parts.map((part, i) =>
        part.bold ? (
          <strong key={i} className="font-bold">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  );
}
