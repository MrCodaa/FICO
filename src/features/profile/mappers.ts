import type { ProfileRecord, PreferenceRecord } from "./repository";

// Vlasnikov sopstveni profil/preferenca — nema skrivenih ni osjetljivih polja za
// uklanjanje (za razliku od ProfileView koji ide drugim korisnicima), pa mapperi
// samo prosljeđuju zapis kao DTO oblik.
export function toProfileDraft(profile: ProfileRecord): ProfileRecord {
  return profile;
}

export function toPreferenceDraft(preference: PreferenceRecord): PreferenceRecord {
  return preference;
}
