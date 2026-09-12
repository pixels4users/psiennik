import { useEffect } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useMarkDogSeen } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/pies/$id")({
  component: DogLayout,
});

function DogLayout() {
  const { id } = Route.useParams();
  const markSeen = useMarkDogSeen();

  useEffect(() => {
    const timer = window.setTimeout(() => markSeen.mutate(id), 1500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return <Outlet />;
}
