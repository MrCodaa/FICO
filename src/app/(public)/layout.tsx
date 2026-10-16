// Javne stranice (landing, prijava, registracija, pravila…) zadržavaju YC
// narandžastu kao primarnu boju; aplikacija pod /app koristi zelenu.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-brand">{children}</div>;
}
