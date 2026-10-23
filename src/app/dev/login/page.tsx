// Razvojna prijava jednim klikom za test naloge (test1…test10@fico.test iz seed fajla).
// Radi SAMO uz NODE_ENV === "development"; svugdje drugdje je 404. Prijava ide kroz isti
// login servis kao obična prijava (tačna lozinka naloga), pa u produkciji nema zaobilaženja.
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { container } from "@/lib/container";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";
import { getNextRoute } from "@/lib/nextRoute";
import { TEST_ACCOUNT_COUNT, TEST_ACCOUNT_PASSWORD, testAccountEmail } from "../../../../prisma/seed-test-accounts";

export const dynamic = "force-dynamic";

async function loginAs(formData: FormData) {
  "use server";
  if (process.env.NODE_ENV !== "development") notFound();
  const n = Number(formData.get("n"));
  if (!Number.isInteger(n) || n < 1 || n > TEST_ACCOUNT_COUNT) notFound();
  const { me, sessionToken } = await container.authService.login({
    email: testAccountEmail(n),
    password: TEST_ACCOUNT_PASSWORD,
  });
  (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
  redirect(getNextRoute(me));
}

export default function DevLoginPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const accounts = Array.from({ length: TEST_ACCOUNT_COUNT }, (_, i) => i + 1);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Razvojna prijava</h1>
        <p className="text-muted-foreground text-sm">
          Samo za lokalni razvoj. Nalozi moraju biti napravljeni pokretanjem db:seed na lokalnoj bazi.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {accounts.map((n) => (
          <li key={n}>
            <form action={loginAs}>
              <input type="hidden" name="n" value={n} />
              <button
                type="submit"
                className="hover:bg-secondary w-full cursor-pointer rounded-md border px-4 py-3 text-left text-sm"
              >
                {testAccountEmail(n)}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
