import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  photoUrl: string | null | undefined;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  className?: string;
}

function initialsOf(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

// Slika profila je privremeno opciona (dok se ne uključi Vercel Blob), pa
// bez slike prikazujemo inicijale umjesto praznog kruga.
export function ProfileAvatar({ photoUrl, firstName, lastName, className }: ProfileAvatarProps) {
  const alt = [firstName, lastName].filter(Boolean).join(" ");
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt={alt} className={cn("shrink-0 rounded-full object-cover", className)} />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt || undefined}
      className={cn(
        "bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        className,
      )}
    >
      {initialsOf(firstName, lastName)}
    </div>
  );
}
