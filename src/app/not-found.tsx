import { sr } from "@/content/sr";

// Jedina 404 stranica sajta: koristi je svaka nepostojeća adresa i svaka skrivena
// admin adresa (proxy ih preusmjerava na nepostojeću rutu), pa se ne mogu razlikovati.
// Namjerno gola, kao standardna greška web servera, bez brenda i linkova.
export default function NotFound() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 font-sans text-black">
      <h1 className="text-3xl font-bold">{sr.notFoundPage.title}</h1>
      <p className="mt-4">{sr.notFoundPage.body}</p>
    </main>
  );
}
