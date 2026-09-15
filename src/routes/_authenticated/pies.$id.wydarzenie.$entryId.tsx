import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useDog, useEntries } from "@/lib/dogs";
import { useDogRole } from "@/lib/auth";
import { EntryForm } from "@/components/entry-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/wydarzenie/$entryId")({
  validateSearch: (search: Record<string, unknown>) => ({
    wroc: search["wroc"] === "kalendarz" ? ("kalendarz" as const) : undefined,
  }),
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Edytuj wydarzenie — Psiennik",
      description: "Zmień szczegóły wydarzenia w dzienniku behawioralnym psa.",
      path: `/pies/${params.id}/wydarzenie/${params.entryId}`,
      image: "app",
      privatePage: true,
    }),
  }),
  component: EditEntryPage,
});

function EditEntryPage() {
  const { id, entryId } = Route.useParams();
  const { wroc } = Route.useSearch();
  const navigate = useNavigate();
  const { data: dog } = useDog(id);
  const { data: role, isLoading: roleLoading } = useDogRole(id);
  const { data: entries, isLoading } = useEntries(id);

  const entry = entries?.find((item) => item.id === entryId) ?? null;

  const goBack = () => {
    if (wroc === "kalendarz") {
      void navigate({ to: "/pies/$id/kalendarz", params: { id } });
    } else {
      void navigate({ to: "/pies/$id", params: { id } });
    }
  };

  if (!roleLoading && role && !role.canEditEntries) {
    goBack();
    return null;
  }

  if (!isLoading && !entry) {
    goBack();
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Button variant="ghost" className="-ml-2 mb-4" onClick={goBack}>
        <ArrowLeft className="size-4" />
        {dog?.name ? `Wróć do dziennika: ${dog.name}` : "Wróć"}
      </Button>
      <h1 className="mb-6 font-display text-3xl font-light text-primary">Edytuj wydarzenie</h1>
      {entry ? (
        <EntryForm dogId={id} entry={entry} onDone={goBack} onCancel={goBack} />
      ) : (
        <div className="grid gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
