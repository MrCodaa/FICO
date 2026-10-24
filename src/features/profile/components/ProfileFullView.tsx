import type { ReactNode } from "react";
import { Cake, Clock, MapPin } from "lucide-react";

import { SectionCard } from "@/components/ui/card";
import { interests as interestCatalog } from "@/content/catalog";
import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";
import { EXTERNAL_LINK_REL, safeExternalHref } from "../urlSchemas";

import { activeLabel, areasSummary, countryName, idealSummary, selfSummary } from "../summary";
import { ProfileAvatar } from "./ProfileAvatar";
import { SummaryText } from "./SummaryText";

const v = sr.profileView;
const sec = v.sections;
const basic = sr.profile.steps.basic;

// Oblik koji prikaz očekuje — podskup ProfileView DTO-a (JSON: datumi su
// stringovi). Opciona polja popunjava samo onaj ko ih ima (Discover šalje
// lastActiveAt i preference, admin i interna polja).
export interface ProfileFullViewData {
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
  gender?: string | null;
  intro: string | null;
  accomplishment: string | null;
  education: string | null;
  employment: string | null;
  isTechnical: boolean | null;
  ideaStatus: string | null;
  ideas: string | null;
  timing: string | null;
  areas: string[] | null;
  interests: string[] | null;
  equityExpectations: string | null;
  freeTime: string | null;
  lifePath: string | null;
  other: string | null;
  lookingFor?: string | null;
  preference?: {
    idea: string | null;
    technical: string | null;
    timingImportance: string | null;
    location: string | null;
    interestsImportance: string | null;
  } | null;
  lastActiveAt?: string | Date | null;
  linkedinUrl: string | null;
  noLinkedin?: boolean;
  videoUrl?: string | null;
  heardFrom?: string | null;
  submittedAt?: string | null;
  /** Samo admin prijava: email naloga i da li korisnik krije godine od drugih. */
  email?: string;
  hideAge?: boolean;
}

interface ProfileFullViewProps {
  profile: ProfileFullViewData;
  /** Interesi onoga ko gleda — zajednički se ističu zeleno ("Naši zajednički interesi"). */
  viewerInterests?: string[] | null;
  /** Admin vidi i prazna polja ("—") i interne podatke (pol, odakle je čuo za FICO). */
  admin?: boolean;
  className?: string;
}

function interestLabel(code: string): string {
  return interestCatalog.find((i) => i.code === code)?.label ?? code;
}

function has(text: string | null | undefined): boolean {
  return Boolean(text?.trim());
}

function Answer({ title, text, admin }: { title: string; text: string | null | undefined; admin?: boolean }) {
  if (!has(text) && !admin) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-[1.0625rem] leading-relaxed break-words whitespace-pre-line">{text?.trim() || v.empty}</p>
    </div>
  );
}

function Chip({ children, shared }: { children: ReactNode; shared?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-3 py-1.5 text-sm font-semibold",
        shared ? "border-border text-primary bg-card" : "bg-secondary text-foreground/70 border-transparent",
      )}
    >
      {children}
    </span>
  );
}

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {children}
    </span>
  );
}

/**
 * Cijeli profil, redoslijed tačno kao docs/ui-spec.md §2 (yc-discover-1/2/3):
 * zaglavlje, kartica-rezime, O meni, Moja pozadina, Potencijalne ideje,
 * Šta tražim u co-founderu, Interesi, LinkedIn. Prazna polja se ne prikazuju.
 * Isti komponent koriste Discover, javni profil, korak "Pregled profila" i admin.
 */
export function ProfileFullView({ profile, viewerInterests, admin = false, className }: ProfileFullViewProps) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || v.empty;
  const location = [profile.city, countryName(profile.countryCode)].filter(Boolean).join(", ");

  const self = selfSummary(profile);
  const areas = areasSummary(profile);
  const ideal = profile.preference ? idealSummary(profile.preference, profile) : null;

  const interests = profile.interests ?? [];
  const viewerSet = viewerInterests ? new Set(viewerInterests) : null;
  const shared = viewerSet ? interests.filter((i) => viewerSet.has(i)) : [];
  const mine = viewerSet ? interests.filter((i) => !viewerSet.has(i)) : interests;

  const showAbout = admin || [profile.intro, profile.lifePath, profile.freeTime, profile.other].some(has);
  const showBackground = admin || [profile.accomplishment, profile.education, profile.employment].some(has);
  const showLookingFor = admin || Boolean(ideal) || has(profile.lookingFor) || has(profile.equityExpectations);

  return (
    <article className={cn("flex w-full flex-col gap-8", className)}>
      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-12 sm:text-left">
        <ProfileAvatar
          photoUrl={profile.photoUrl}
          firstName={profile.firstName}
          lastName={profile.lastName}
          className="size-36 text-4xl sm:size-44 sm:text-5xl"
        />
        <div className="flex min-w-0 flex-col gap-5">
          <h2 className="text-3xl font-normal tracking-tight break-words sm:text-[2.5rem]">{fullName}</h2>
          <div className="text-foreground/85 flex flex-wrap justify-center gap-x-7 gap-y-2 text-lg sm:justify-start">
            {location && <MetaItem icon={<MapPin className="size-6" />}>{location}</MetaItem>}
            {profile.age != null && <MetaItem icon={<Cake className="size-6" />}>{v.yearsOld(profile.age)}</MetaItem>}
            {profile.lastActiveAt && (
              <MetaItem icon={<Clock className="size-6" />}>
                {activeLabel(profile.lastActiveAt, new Date(), profile.gender)}
              </MetaItem>
            )}
          </div>
        </div>
      </header>

      {(self || areas) && (
        <div className="bg-card flex flex-col gap-1 rounded-md border px-6 py-5 text-[1.0625rem] leading-8 md:px-10">
          {self && <SummaryText parts={self} />}
          {areas && <SummaryText parts={areas} />}
        </div>
      )}

      {showAbout && (
        <SectionCard title={sec.aboutMe}>
          <Answer title={sec.intro} text={profile.intro} admin={admin} />
          <Answer title={sec.lifePath} text={profile.lifePath} admin={admin} />
          <Answer title={sec.freeTime} text={profile.freeTime} admin={admin} />
          <Answer title={sec.other} text={profile.other} admin={admin} />
        </SectionCard>
      )}

      {showBackground && (
        <SectionCard title={sec.background}>
          <Answer title={sec.accomplishment} text={profile.accomplishment} admin={admin} />
          <Answer title={sec.education} text={profile.education} admin={admin} />
          <Answer title={sec.employment} text={profile.employment} admin={admin} />
        </SectionCard>
      )}

      {(has(profile.ideas) || admin) && (
        <SectionCard title={sec.ideas}>
          <p className="text-[1.0625rem] leading-relaxed break-words whitespace-pre-line">
            {profile.ideas?.trim() || v.empty}
          </p>
        </SectionCard>
      )}

      {showLookingFor && (
        <SectionCard title={sec.lookingFor}>
          {ideal && <SummaryText parts={ideal} className="text-[1.0625rem] leading-relaxed" />}
          <Answer title={sec.idealCofounder} text={profile.lookingFor} admin={admin} />
          <Answer title={sec.equity} text={profile.equityExpectations} admin={admin} />
        </SectionCard>
      )}

      {interests.length > 0 && (
        <div className="bg-card flex flex-col gap-7 rounded-md border px-6 py-7 md:px-10">
          {shared.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">{sec.sharedInterests}</h3>
              <div className="flex flex-wrap gap-1.5">
                {shared.map((i) => (
                  <Chip key={i} shared>
                    {interestLabel(i)}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {mine.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">{sec.myInterests}</h3>
              <div className="flex flex-wrap gap-1.5">
                {mine.map((i) => (
                  <Chip key={i}>{interestLabel(i)}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {profile.linkedinUrl && (
        <a
          href={safeExternalHref(profile.linkedinUrl)}
          target="_blank"
          rel={EXTERNAL_LINK_REL}
          className="text-link self-start text-xl italic hover:underline"
        >
          {v.linkedin}
        </a>
      )}

      {admin && (
        <SectionCard title={sec.adminDetails}>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {profile.email && (
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-sm">{sr.admin.queue.accountEmail}</dt>
                <dd className="break-all">{profile.email}</dd>
              </div>
            )}
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-sm">{sec.gender}</dt>
              <dd>
                {profile.gender
                  ? (basic.genderOptions[profile.gender as keyof typeof basic.genderOptions] ?? profile.gender)
                  : v.empty}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-sm">{sec.age}</dt>
              <dd>
                {profile.age ?? v.empty}
                {profile.hideAge && <span className="text-muted-foreground"> ({sr.admin.queue.hideAge})</span>}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-sm">{sec.heardFrom}</dt>
              <dd className="break-words">{profile.heardFrom?.trim() || v.empty}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-sm">{sec.submittedAt}</dt>
              <dd>{profile.submittedAt ? new Date(profile.submittedAt).toLocaleString("sr-Latn") : v.empty}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-sm">{sec.video}</dt>
              <dd className="break-all">
                {profile.videoUrl ? (
                  <a href={safeExternalHref(profile.videoUrl)} target="_blank" rel={EXTERNAL_LINK_REL} className="text-link hover:underline">
                    {profile.videoUrl}
                  </a>
                ) : (
                  v.empty
                )}
              </dd>
            </div>
            {!profile.linkedinUrl && profile.noLinkedin && (
              <div className="flex flex-col">
                <dt className="text-muted-foreground text-sm">LinkedIn</dt>
                <dd>{sec.noLinkedin}</dd>
              </div>
            )}
          </dl>
        </SectionCard>
      )}
    </article>
  );
}
