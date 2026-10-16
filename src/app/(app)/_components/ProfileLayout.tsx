// Raspored Discover-a i javnog profila (yc-discover-1/2/3): profil u sredini,
// desna kolona sticky (sa sopstvenim skrolom kad je viša od ekrana).
export function ProfileLayout({ main, side }: { main: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className="grid items-start gap-10 px-4 py-8 sm:px-8 md:py-10 xl:grid-cols-[minmax(0,1fr)_27rem] xl:gap-14 xl:px-20 2xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="flex min-w-0 flex-col gap-6">{main}</div>
      <aside className="flex flex-col gap-8 xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto xl:pr-1 xl:pb-4">
        {side}
      </aside>
    </div>
  );
}
