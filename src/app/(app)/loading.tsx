import { ListSkeleton, PageContainer } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";

// Prikazuje se odmah pri prelasku između stranica, dok se nova stranica učitava
// (u dev modu i dok se ruta prvi put kompajlira).
export default function AppLoading() {
  return (
    <PageContainer aria-busy="true">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-6 w-full max-w-md" />
      <ListSkeleton />
    </PageContainer>
  );
}
