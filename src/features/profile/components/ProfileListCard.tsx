import Link from "next/link";

import { countryName, plainText, selfSummary } from "../summary";
import { ProfileAvatar } from "./ProfileAvatar";

export interface ProfileCardData {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
  gender?: string | null;
  isTechnical?: boolean | null;
  timing?: string | null;
  ideaStatus?: string | null;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sr-Latn", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Kartica profila u listama (Ponovo pogledaj, Zahtjevi): slika, ime,
 * lokacija, rečenica-rezime i datum. Ime i slika vode na javni profil.
 */
export function ProfileListCard({
  profile,
  meta,
  aside,
  children,
}: {
  profile: ProfileCardData;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const href = `/app/profiles/${profile.userId}`;
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—";
  const location = [profile.city, countryName(profile.countryCode)].filter(Boolean).join(", ");
  const summary = plainText(
    selfSummary({
      gender: profile.gender ?? null,
      isTechnical: profile.isTechnical ?? null,
      timing: profile.timing ?? null,
      ideaStatus: profile.ideaStatus ?? null,
    }),
  );

  return (
    <div className="bg-card flex flex-col gap-5 rounded-md border px-6 py-6 md:px-8">
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <Link href={href} className="shrink-0">
          <ProfileAvatar
            photoUrl={profile.photoUrl}
            firstName={profile.firstName}
            lastName={profile.lastName}
            className="size-20 text-xl"
          />
        </Link>
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <Link href={href} className="text-xl font-semibold hover:underline">
            {name}
          </Link>
          {(location || profile.age != null) && (
            <span className="text-foreground/75">
              {[location, profile.age != null ? String(profile.age) : null].filter(Boolean).join(" · ")}
            </span>
          )}
          {summary && <p className="pt-1 leading-relaxed">{summary}</p>}
          {meta && <span className="text-muted-foreground pt-1 text-sm">{meta}</span>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children}
    </div>
  );
}
