import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useDog } from "@/lib/dogs";
import { useDogRole } from "@/lib/auth";
import { EntryForm } from "@/components/entry-form";
import { Button } from "@/components/ui/button";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/pies/$id/wydarzenie/nowe")({
  validateSearch: (search: Record<string, unknown>) => ({
    wroc: search["wroc"] === "kalendarz" ? ("kalendarz" as const) : undefined,
  }),
  head: ({ params }) => ({
    meta: socialMeta({
      title: "Dodaj wydarzenie — Psiennik",
      description: "Zapisz nowe wydarzenie w dzienniku behawioralnym psa.",
      path: `/pies/${params.id}/wydarzenie/nowe`,
      image: "app",
      privatePage: true,
    }),
  }),
  component: NewEntryPage,
});

function NewEntryPage() {
  const { id } = Route.useParams();
  const { wroc } = Route.useSearch();
  const navigate = useNavigate();
  const { data: dog } = useDog(id);
  const { data: role, isLoading: roleLoading } = useDogRole(id);

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

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Button variant="ghost" className="-ml-2 mb-4" onClick={goBack}>
        <ArrowLeft className="size-4" />
        {dog?.name ? `Wróć do dziennika: ${dog.name}` : "Wróć"}
      </Button>
      <h1 className="mb-6 font-display text-3xl font-light text-primary">Dodaj wydarzenie</h1>
      <EntryForm dogId={id} onDone={goBack} onCancel={goBack} />
    </div>
  );
}
