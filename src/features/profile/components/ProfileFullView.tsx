import type { ReactNode } from "react";

import { countries, interests as interestCatalog } from "@/content/catalog";
import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

import { ProfileAvatar } from "./ProfileAvatar";

const v = sr.profileView;
const more = sr.profile.steps.more;
const basic = sr.profile.steps.basic;

// Oblik koji prikaz očekuje — podskup ProfileView DTO-a (JSON: datumi su
// stringovi). Opciona polja popunjava samo onaj ko ih smije vidjeti
// (vlasnik u pregledu, admin), a ProfileView ih drugim korisnicima ne šalje.
export interface ProfileFullViewData {
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
  intro: string | null;
  accomplishment: string | null;
  education: string | null;
  employment: string | null;
  isTechnical: boolean | null;
  ideaStatus: string | null;
  ideas: string | null;
  hasCofounder: boolean | null;
  timing: string | null;
  areas: string[] | null;
  interests: string[] | null;
  equityExpectations: string | null;
  freeTime: string | null;
  lifePath: string | null;
  other: string | null;
  lookingFor?: string | null;
  linkedinUrl: string | null;
  noLinkedin?: boolean;
  videoUrl: string | null;
  schedulingUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  gender?: string | null;
  heardFrom?: string | null;
  submittedAt?: string | null;
}

interface ProfileFullViewProps {
  profile: ProfileFullViewData;
  /** Admin vidi i prazna polja ("—") i interne podatke (pol, odakle je čuo za FICO). */
  admin?: boolean;
  className?: string;
}

function countryName(code: string | null): string | null {
  if (!code) return null;
  return countries.find((c) => c.code === code)?.name ?? code;
}

function interestLabel(code: string): string {
  return interestCatalog.find((i) => i.code === code)?.label ?? code;
}

function areaLabel(code: string): string {
  return more.areaOptions[code as keyof typeof more.areaOptions] ?? code;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t pt-5">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  );
}

function TextSection({ title, text, admin }: { title: string; text: string | null | undefined; admin?: boolean }) {
  const value = text?.trim();
  if (!value && !admin) return null;
  return (
    <Section title={title}>
      <p className="text-sm leading-relaxed break-words whitespace-pre-line">{value || v.empty}</p>
    </Section>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium break-all underline underline-offset-4 hover:opacity-80"
    >
      {label}
    </a>
  );
}

export function ProfileFullView({ profile, admin = false, className }: ProfileFullViewProps) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || v.empty;
  const location = [profile.city, countryName(profile.countryCode)].filter(Boolean).join(", ");
  const meta = [location, profile.age != null ? v.yearsOld(profile.age) : null].filter(Boolean).join(" · ");

  const chips: string[] = [];
  if (profile.isTechnical != null) chips.push(profile.isTechnical ? v.technical : v.nonTechnical);
  if (profile.hasCofounder != null) chips.push(profile.hasCofounder ? v.hasCofounderYes : v.hasCofounderNo);

  const ideaStatusLabel = profile.ideaStatus
    ? (more.ideaStatusOptions[profile.ideaStatus as keyof typeof more.ideaStatusOptions] ?? profile.ideaStatus)
    : null;
  const timingLabel = profile.timing
    ? (more.timingOptions[profile.timing as keyof typeof more.timingOptions] ?? profile.timing)
    : null;
  const areas = profile.areas ?? [];
  const interests = profile.interests ?? [];

  const links: ({ href: string; label: string } | null)[] = [
    profile.linkedinUrl ? { href: profile.linkedinUrl, label: v.linkedin } : null,
    profile.videoUrl ? { href: profile.videoUrl, label: v.video } : null,
    profile.schedulingUrl ? { href: profile.schedulingUrl, label: v.scheduling } : null,
    profile.twitterUrl ? { href: profile.twitterUrl, label: v.twitter } : null,
    profile.instagramUrl ? { href: profile.instagramUrl, label: v.instagram } : null,
  ];
  const presentLinks = links.filter((l): l is { href: string; label: string } => l !== null);

  return (
    <article className={cn("flex w-full flex-col gap-5", className)}>
      <header className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
        <ProfileAvatar
          photoUrl={profile.photoUrl}
          firstName={profile.firstName}
          lastName={profile.lastName}
          className="h-36 w-36 text-4xl sm:h-44 sm:w-44 sm:text-5xl"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">{fullName}</h2>
          {meta && <p className="text-muted-foreground text-sm">{meta}</p>}
          {chips.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {chips.map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </div>
          )}
        </div>
      </header>

      <TextSection title={v.sections.about} text={profile.intro} admin={admin} />
      <TextSection title={v.sections.accomplishment} text={profile.accomplishment} admin={admin} />
      <TextSection title={v.sections.education} text={profile.education} admin={admin} />
      <TextSection title={v.sections.employment} text={profile.employment} admin={admin} />

      {(ideaStatusLabel || profile.ideas || admin) && (
        <Section title={v.sections.idea}>
          {ideaStatusLabel && <p className="text-sm font-medium">{ideaStatusLabel}</p>}
          {profile.ideas?.trim() ? (
            <p className="text-sm leading-relaxed break-words whitespace-pre-line">{profile.ideas.trim()}</p>
          ) : (
            !ideaStatusLabel && <p className="text-sm">{v.empty}</p>
          )}
        </Section>
      )}

      {(timingLabel || admin) && (
        <Section title={v.sections.timing}>
          <p className="text-sm">{timingLabel ?? v.empty}</p>
        </Section>
      )}

      {(areas.length > 0 || admin) && (
        <Section title={v.sections.areas}>
          {areas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Chip key={a}>{areaLabel(a)}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm">{v.empty}</p>
          )}
        </Section>
      )}

      {(interests.length > 0 || admin) && (
        <Section title={v.sections.interests}>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((i) => (
                <Chip key={i}>{interestLabel(i)}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm">{v.empty}</p>
          )}
        </Section>
      )}

      <TextSection title={v.sections.lookingFor} text={profile.lookingFor} admin={admin} />
      <TextSection title={v.sections.equity} text={profile.equityExpectations} admin={admin} />
      <TextSection title={v.sections.freeTime} text={profile.freeTime} admin={admin} />
      <TextSection title={v.sections.lifePath} text={profile.lifePath} admin={admin} />
      <TextSection title={v.sections.other} text={profile.other} admin={admin} />

      {(presentLinks.length > 0 || profile.noLinkedin || admin) && (
        <Section title={v.links}>
          {presentLinks.length > 0 ? (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {presentLinks.map((l) => (
                <ExternalLink key={l.label} href={l.href} label={l.label} />
              ))}
            </div>
          ) : null}
          {!profile.linkedinUrl && profile.noLinkedin && (
            <p className="text-muted-foreground text-sm">{v.noLinkedin}</p>
          )}
          {presentLinks.length === 0 && !profile.noLinkedin && <p className="text-sm">{v.empty}</p>}
        </Section>
      )}

      {admin && (
        <Section title={v.sections.adminDetails}>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-xs">{v.sections.gender}</dt>
              <dd>
                {profile.gender
                  ? (basic.genderOptions[profile.gender as keyof typeof basic.genderOptions] ?? profile.gender)
                  : v.empty}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-xs">{v.sections.age}</dt>
              <dd>{profile.age ?? v.empty}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-xs">{v.sections.heardFrom}</dt>
              <dd className="break-words">{profile.heardFrom?.trim() || v.empty}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-muted-foreground text-xs">{v.sections.submittedAt}</dt>
              <dd>{profile.submittedAt ? new Date(profile.submittedAt).toLocaleString("sr-Latn") : v.empty}</dd>
            </div>
          </dl>
        </Section>
      )}
    </article>
  );
}
