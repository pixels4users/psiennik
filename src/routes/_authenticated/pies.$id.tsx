import { useEffect } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { isValidDogId, useDog } from "@/lib/dogs";
import {
  DogErrorNotice,
  DogOfflineNotice,
  DogUnavailableNotice,
  useOnlineStatus,
} from "@/components/dog-state";
import { useMarkDogSeen } from "@/lib/notifications";

function DogRouteError({ reset }: { reset: () => void }) {
  return <DogErrorNotice onRetry={reset} />;
}

export const Route = createFileRoute("/_authenticated/pies/$id")({
  component: DogLayout,
  notFoundComponent: DogUnavailableNotice,
  errorComponent: DogRouteError,
});

function DogLayout() {
  const { id } = Route.useParams();
  const valid = isValidDogId(id);
  const online = useOnlineStatus();
  const dogQuery = useDog(valid ? id : null);
  const markSeen = useMarkDogSeen();
  const hasDog = !!dogQuery.data;

  // Oznaczamy psa jako obejrzanego dopiero po potwierdzeniu dostępu.
  useEffect(() => {
    if (!hasDog) return;
    const timer = window.setTimeout(() => markSeen.mutate(id), 1500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasDog]);

  if (!valid) {
    return <DogUnavailableNotice />;
  }

  if (dogQuery.isPending) {
    if (!online || dogQuery.fetchStatus === "paused") {
      return <DogOfflineNotice />;
    }
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (dogQuery.isError) {
    if (!online) return <DogOfflineNotice />;
    return <DogErrorNotice onRetry={() => void dogQuery.refetch()} />;
  }

  if (!dogQuery.data) {
    return <DogUnavailableNotice />;
  }

  return <Outlet />;
}
