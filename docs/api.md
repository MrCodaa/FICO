# FICO — API specifikacija

REST JSON API pod `/api`. Sesija je JWT u cookie-ju `fico_session` (`httpOnly; Secure; SameSite=Lax`). Šema baze je u `prisma/schema.prisma`.

## Konvencije

- **Uspjeh:** resurs ili `{ items, nextCursor }` za liste. Prazan odgovor je `204`.
- **Greška:** `{ "error": { "code": "LIKE_LIMIT_REACHED", "message": "…", "fields": { "email": "…" } } }`, gdje je `fields` samo za validaciju.
- **Paginacija:** `?cursor=<id>&limit=20` (max 50). Poruke idu sa `?before=<messageId>`.
- **Datumi** su ISO 8601 stringovi. `Message.id` (BigInt) šalje se kao string.
- **DTO:** modeli iz baze nikad ne izlaze direktno. Mapperi su `toMe`, `toProfileView`, `toProfileCard`, `toRequestView`, `toMessageView`.
- **`ProfileView`** ne sadrži email ni datum rođenja (šalje se `age`). Polja `schedulingUrl`, `twitterUrl` i `instagramUrl` vide samo matchevi. Sadrži i `lastActiveAt` ("Aktivan prije X dana") i `preference: { idea, technical, timingImportance, location, interestsImportance, wantedAreas } | null` za rečenicu "Šta tražim u co-founderu".
- **`ProfileCard`**: `{ userId, firstName, lastName, photoUrl, countryCode, city, age, gender, isTechnical, timing, ideaStatus }` (zadnja četiri za rečenicu-rezime na karticama).
- **`relation`** (javni profil): `{ kind: "MATCH", matchId }` · `{ kind: "SENT", requestId, sentAt, message, displayStatus }` · `{ kind: "RECEIVED", requestId, receivedAt, message, expiresAt }` (samo aktivan) · `{ kind: "NONE", decision: THINKING | NOT_INTERESTED | null }`.
- **Origin provjera** važi na svakom POST, PUT, PATCH i DELETE zahtjevu.

### Guardovi (opcija route wrappera `withRoute`)

| Guard | Uslov | Inače |
| --- | --- | --- |
| `public` | — | — |
| `auth` | validan JWT, `tokenVersion` se poklapa, nalog nije deaktiviran | 401 `UNAUTHENTICATED` |
| `verified` | `auth` + potvrđen email | 403 `EMAIL_NOT_VERIFIED` |
| `onboarded` | `verified` + prihvaćena pravila | 403 `AGREEMENT_REQUIRED` |
| `approved` | `onboarded` + profil `APPROVED` | 403 `PROFILE_NOT_APPROVED` |
| `admin` | `auth` + email u `ADMIN_EMAILS` | 403 `FORBIDDEN` |

### Kodovi grešaka

| HTTP | Kodovi |
| --- | --- |
| 400 | `VALIDATION_ERROR`, `TOKEN_INVALID`, `PROFILE_INCOMPLETE` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN`, `EMAIL_NOT_VERIFIED`, `AGREEMENT_REQUIRED`, `PROFILE_NOT_APPROVED`, `NOT_A_MATCH` |
| 404 | `NOT_FOUND` (i za blokirane, deaktivirane i neodobrene, da se ne otkriva postojanje) |
| 409 | `EMAIL_TAKEN`, `PROFILE_LOCKED`, `INVALID_STATUS`, `REQUEST_EXISTS`, `REQUEST_NOT_PENDING` |
| 429 | `LIKE_LIMIT_REACHED`, `TOO_MANY_REQUESTS` |

## Endpointi

### Faza 2: Nalog

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | public | `{ firstName, lastName, email, password (min 8), linkedinUrl?, noLinkedin }` (LinkedIn link ili `noLinkedin: true`) | 201 `Me` + cookie; upisuje Profile(DRAFT) sa imenom i LinkedInom, šalje mail za potvrdu; 400 `VALIDATION_ERROR` (`fields.email` = "Greška: ...") ako domen emaila ne postoji |
| POST | `/api/auth/login` | public | `{ email, password }` | 200 `Me` + cookie |
| POST | `/api/auth/logout` | auth | — | 204, briše cookie |
| POST | `/api/auth/verify-email` | public | `{ token }` | 204 |
| POST | `/api/auth/resend-verification` | auth | — | 204; 429 ako je prethodni mail mlađi od 60 s |
| POST | `/api/auth/forgot-password` | public | `{ email }` | 204 uvijek (ne otkriva da li nalog postoji) |
| POST | `/api/auth/reset-password` | public | `{ token, password }` | 204; `tokenVersion++` odjavljuje sve sesije |
| GET | `/api/me` | auth | — | `{ id, email, emailVerified, agreementAccepted, profileStatus, isAdmin, emailBlocked }` |
| POST | `/api/me/email-unblock` | auth | — | 204; briše `User.emailBlockedAt/emailBlockReason` i šalje novi mejl za potvrdu (Kontrolna tabla → Odblokiraj) |
| POST | `/api/webhooks/resend` | public (Svix potpis) | Resend događaj | 200 `{ blocked }`; 401 bez važećeg potpisa |

### Faza 3: Pravila platforme

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| POST | `/api/agreement` | verified | `{ confirmations: [true × 6] }` | 204 |

### Faza 4: Profil

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| GET | `/api/profile` | onboarded | — | `{ profile, preference }` |
| PATCH | `/api/profile` | onboarded | parcijalna polja profila | 200 `{ profile }`; 409 `PROFILE_LOCKED` dok je na pregledu |
| PATCH | `/api/preference` | onboarded | parcijalna polja preferenci | 200 `{ preference }`; 409 `PROFILE_LOCKED` dok je na pregledu |
| POST | `/api/profile/photo` | onboarded | multipart `file` (jpeg/png/webp, ≤ 4 MB) | 200 `{ photoUrl }`; stara slika se briše |
| POST | `/api/profile/submit` | onboarded | — | 200 `{ status }`; 400 `PROFILE_INCOMPLETE` sa `fields`; 409 ako nije `DRAFT` ili `REJECTED` |

Nacrt prima parcijalna polja (Zod `.partial()`), a `submit` validira kompletan profil strogom šemom. Obje šeme su izvedene iz iste osnove (DRY). Izmjene u statusu `APPROVED` idu odmah uživo.

### Faza 5: Admin pregled

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/profiles` | admin | `?status=PENDING_REVIEW|APPROVED|REJECTED&cursor=` | `{ items: AdminProfileView[], nextCursor }` |
| POST | `/api/admin/profiles/:userId/approve` | admin | — | 204 + zvonce `PROFILE_APPROVED` + mail (link na aplikaciju); 409 `INVALID_STATUS` ako nije na pregledu |
| POST | `/api/admin/profiles/:userId/reject` | admin | `{ reason }` (obavezan, 1–1000) | 204 + zvonce `PROFILE_REJECTED` + mail (razlog + link na ispravku); 409 `INVALID_STATUS` ako nije na pregledu |

`AdminProfileView` je `ProfileView` plus `email` naloga, `hideAge`, `noLinkedin` i `reviewedAt`. Admin uvijek vidi `age` (i kad je `hideAge`). Pending lista ide od najstarije prijave, a odobreni i odbijeni od najnovije obrade. Mailovi idu poslije commita transakcije; dupli klik drugi put dobija 409 (uslovni `updateMany`).

### Faza 6: Discover i odluke

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| GET | `/api/discover/next` | approved | — | `{ candidate: ProfileView \| null, match: { score, reasons[] }, likesRemaining }` |
| GET | `/api/profiles/:userId` | approved | — | `{ profile: ProfileView, match, relation, likesRemaining }`; 404 ako nije vidljiv |
| PUT | `/api/decisions/:targetId` | approved | `{ type: THINKING \| NOT_INTERESTED }` | 200 `{ decision }` (idempotentno) |
| DELETE | `/api/decisions/:targetId` | approved | — | 204 (poništava odluku) |
| GET | `/api/decisions` | approved | `?type=THINKING&cursor=` | `{ items: [{ profile: ProfileCard, match, decidedAt }], nextCursor }` |

### Faza 7: Lajk, zahtjevi, obavještenja

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| POST | `/api/requests` | approved | `{ receiverId, message }` (1–500) | 201 `{ request, likesRemaining }`; 429 `LIKE_LIMIT_REACHED`; 409 `REQUEST_EXISTS` |
| GET | `/api/requests/received` | approved | `?cursor=` | `{ items: [{ id, message, createdAt, expiresAt, sender: ProfileCard, match }], nextCursor }`, samo aktivni |
| GET | `/api/requests/sent` | approved | `?cursor=` | `{ items: [{ id, displayStatus, createdAt, receiver: ProfileCard, matchId? }], nextCursor }` |
| POST | `/api/requests/:id/accept` | approved (primalac) | — | 200 `{ matchId }`; 409 `REQUEST_NOT_PENDING` |
| POST | `/api/requests/:id/decline` | approved (primalac) | — | 204; 409 `REQUEST_NOT_PENDING` |
| GET | `/api/notifications` | auth | `?cursor=` | `{ items: [{ id, type, actor: ProfileCard?, entityId, readAt, createdAt }], nextCursor }` |
| POST | `/api/notifications/read` | auth | `{ ids?: string[] }` (bez `ids` = sve) | 204 |
| GET | `/api/me/counts` | auth | — | `{ notifications, requests, messages }` (nepročitano) |
| GET | `/api/cron/expire-requests` | `Authorization: Bearer CRON_SECRET` | — | 200 `{ expired }` |

`displayStatus` za pošiljaoca: `PENDING` → `PENDING`, `ACCEPTED` → `MATCHED`, a `DECLINED`, `EXPIRED` i istekli `PENDING` → `NOT_ACCEPTED`. Odbijanje ne pravi obavještenje ni mail.

### Faza 8: Poruke

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| GET | `/api/matches` | approved | — | `{ items: [{ id, other: ProfileCard, lastMessage, unread, lastMessageAt }] }` |
| GET | `/api/matches/:id/messages` | approved (član) | `?before=<id>&limit=50` | `{ items: MessageView[], nextBefore }` |
| POST | `/api/matches/:id/messages` | approved (član) | `{ body }` (1–2000) | 201 `MessageView` |
| POST | `/api/matches/:id/read` | approved (član) | — | 204 |
| GET | `/api/matches/:id/stream` | approved (član) | header `Last-Event-ID` | `text/event-stream`: `event: message`, `id: <messageId>`; zatvara se nakon oko 50 s |

Ako nije član matcha ili postoji blokada, odgovor je 403 `NOT_A_MATCH`.

### Faza 9: Sigurnost i admin

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| POST | `/api/blocks` | approved | `{ userId }` | 204 |
| DELETE | `/api/blocks/:userId` | approved | — | 204 |
| POST | `/api/reports` | approved | `{ reportedId, reason, details? }` | 201 |
| GET | `/api/admin/reports` | admin | `?status=OPEN&cursor=` | `{ items, nextCursor }` |
| POST | `/api/admin/reports/:id/resolve` | admin | `{ status: RESOLVED \| DISMISSED, deactivateUser?: boolean }` | 204 |
| POST | `/api/admin/users/:userId/deactivate` | admin | — | 204 |

### Podešavanja i Kontrolna tabla (ui-spec §4, §6, §10)

| Metoda | Putanja | Guard | Tijelo / upit | Odgovor |
| --- | --- | --- | --- | --- |
| GET | `/api/settings` | auth | — | `{ active, emails: { invites, messages, reminders, weekly, newMatchingProfile, announcements, events, none }, cofounderMatchId, cofounderOptions: [{ matchId, name }], hideAge, skippedCount }` |
| PATCH | `/api/settings` | auth | `settingsSchema` (sve opciono): `{ active?, emails?, cofounderMatchId?, hideAge? }` | 200 isti oblik kao GET; 400 ako `cofounderMatchId` nije tvoj match |
| DELETE | `/api/decisions/not-interested` | onboarded | — | 200 `{ deleted }` (briše sve "Ne zanima me" odluke) |
| DELETE | `/api/me` | auth | `{ email }` (potvrda, mora biti email naloga) | 204, briše nalog kaskadno i cookie; 400 ako se email ne poklapa |
| GET | `/api/dashboard` | onboarded | — | `{ profileStatus, rejectionReason, queueCount, thinkingCount, newRequests, unreadMessages, matchCount }` |

- `active: false` upisuje `User.pausedAt`; pauziran nalog je van `visibleTo` (nevidljiv u Discover-u i na javnom profilu).
- `hideAge: true` → `age` je `null` u `ProfileView` i `ProfileCard` za druge (admin pregled ga vidi).
- **Mailovi:** šalju se samo potvrda emaila, reset lozinke i odobren/odbijen profil. Novi zahtjev i match imaju samo zvonce.
- **Blacklist mejlova:** Resend webhook (`email.bounced` samo `Permanent`, i `email.complained`) upisuje `User.emailBlockedAt/emailBlockReason`; `EmailService` ne šalje ništa blokiranoj adresi. Potpis je Svix (`svix-id`, `svix-timestamp`, `svix-signature`, tajna `RESEND_WEBHOOK_SECRET`), stariji od 5 minuta se odbija.
- `emails.newMatchingProfile` je `Preference.alertOnNewMatch`. `emails.none` gasi sve lifecycle mailove u `EmailService`; transakcioni (potvrda emaila, reset lozinke, odobren/odbijen profil) idu uvijek.

## Transakcije (ACID)

Sve što mijenja više redova radi se u jednoj `prisma.$transaction`. Mailovi i ostali spoljni pozivi idu tek poslije commita, pa rollback nikad ne pošalje mail. Unique ograničenja u šemi su posljednja linija odbrane: Prisma `P2002` se mapira u 409.

| Operacija | Šta je u transakciji | Zaštita od trke |
| --- | --- | --- |
| Registracija | User + prazan Profile (DRAFT) + prazan Preference + AuthToken | `email` unique → 409 `EMAIL_TAKEN` |
| Potvrda emaila | `AuthToken.usedAt` + `User.emailVerifiedAt` | uslovni update `usedAt IS NULL AND expiresAt > now` |
| Reset lozinke | `passwordHash` + `tokenVersion++` + `AuthToken.usedAt` | isto kao potvrda |
| Slanje na pregled | status → `PENDING_REVIEW`, `submittedAt` | `updateMany where status IN (DRAFT, REJECTED)`; 0 redova → 409 |
| Odobri / odbij | status + `reviewedAt` (+ razlog) + Notification | `updateMany where status = PENDING_REVIEW` |
| Lajk | zaključaj pošiljaoca (`SELECT … FOR UPDATE` na User) → limit (< 20 u 7 dana) → nema zahtjeva ni matcha u oba smjera, nema blokade, primalac je vidljiv → obriši Decision → Request → Notification | zaključan red pošiljaoca + `@@unique([senderId, receiverId])` |
| Prihvatanje | Request → `ACCEPTED` → Match (normalizovan par) → prva Message (poruka iz zahtjeva, pošiljalac = lajker) → Notification | `updateMany where id, receiverId = ja, status = PENDING, expiresAt > now`; 0 redova → 409 |
| Odbijanje | Request → `DECLINED` | isti uslovni update |
| Poruka | Message + `Match.lastMessageAt` | — |
| Blokiranje | Block + svi `PENDING` zahtjevi između njih → `DECLINED` | `@@id([blockerId, blockedId])` |
| Podešavanja | User (`pausedAt`, `cofounderMatchId`) + Preference (emailovi) + Profile (`hideAge`) | — |
| Rješavanje prijave | Report status (+ `User.deactivatedAt`) | — |

## Zajednička pravila (jedno mjesto u kodu)

- **`visibleTo(viewerId)`:** Prisma `where` fragment koji vraća odobren profil, aktivan (ni deaktiviran ni pauziran) nalog, nije `viewerId` i nema blokade ni u jednom smjeru. Koriste ga Discover, `/api/profiles/:userId`, liste zahtjeva i matchevi.
- **`effectiveStatus(request, now)`:** `PENDING` sa `expiresAt < now` tretira kao `EXPIRED`. Koriste ga sve liste i accept/decline.
- **`toDisplayStatus(request, now)`:** mapiranje za pošiljaoca, opisano gore.
- **`touchLastActive(userId)`:** ažurira `lastActiveAt` najviše jednom na sat. Poziva se iz `withRoute`.
