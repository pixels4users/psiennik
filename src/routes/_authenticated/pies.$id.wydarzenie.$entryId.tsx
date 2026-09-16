import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pies/$id/wydarzenie/$entryId")({
  component: () => <Outlet />,
});
