import type { ProfileRecord } from "@/features/profile/repository";
import { computeAge } from "@/lib/age";

export interface ProfileCard {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  countryCode: string | null;
  city: string | null;
  age: number | null;
}

export function toProfileCard(profile: ProfileRecord, now: Date): ProfileCard {
  return {
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    photoUrl: profile.photoUrl,
    countryCode: profile.countryCode,
    city: profile.city,
    age: profile.birthDate ? computeAge(profile.birthDate, now) : null,
  };
}
