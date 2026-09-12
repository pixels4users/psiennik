import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PawPrint, Plus } from "lucide-react";
import { useRole } from "@/lib/role";
import { useDogs } from "@/lib/dogs";
import { DogFormDialog } from "@/components/dog-form-dialog";
import { DogAvatar } from "@/components/dog-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/psy")({
  head: () => ({
    meta: [
      { title: "Psy — Psiennik" },
      {
        name: "description",
        content: "Lista psów w dzienniku behawioralnym. Dodaj psa lub otwórz jego dziennik.",
      },
      { property: "og:title", content: "Psy — Psiennik" },
      {
        property: "og:description",
        content: "Lista psów w dzienniku behawioralnym. Dodaj psa lub otwórz jego dziennik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DogsPage,
});

function DogsPage() {
  const { role } = useRole();
  const { data: dogs, isLoading } = useDogs();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!role) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="text-4xl">Najpierw wybierz rolę</h1>
        <p className="mt-2 text-muted-foreground">
          <Link to="/" className="text-primary underline underline-offset-4">
            Wróć na stronę główną
          </Link>{" "}
          i wybierz, czy jesteś właścicielem, czy behawiorystą.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{role === "owner" ? "Twoje psy" : "Psy pod opieką"}</h1>
          <p className="mt-2 text-muted-foreground">
            {role === "owner"
              ? "Wybierz psa, aby zobaczyć jego dziennik, albo dodaj nowego."
              : "Wybierz psa, aby zobaczyć dziennik i dodać zalecenia."}
          </p>
        </div>
        {role === "owner" && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Dodaj psa
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="shadow-none">
              <CardContent className="flex items-center gap-4 p-6">
                <Skeleton className="size-16 rounded-full" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !dogs?.length ? (
        <div className="mt-10 rounded-xl bg-keylime p-12 text-center">
          <PawPrint className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-3xl">Jeszcze nie ma żadnego psa</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {role === "owner"
              ? "Dodaj pierwszego psa, aby zacząć zapisywać wydarzenia i śledzić postępy."
              : "Poczekaj, aż właściciel doda psa do dziennika."}
          </p>
          {role === "owner" && (
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Dodaj psa
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {dogs.map((dog) => (
            <Link key={dog.id} to="/pies/$id" params={{ id: dog.id }} className="block">
              <Card className="shadow-none transition-colors hover:bg-keylime">
                <CardContent className="flex items-center gap-4 p-6">
                  <DogAvatar dog={dog} />
                  <div className="grid gap-0.5">
                    <h2 className="text-2xl">{dog.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {[dog.breed, dog.age, dog.sex].filter(Boolean).join(" · ") ||
                        "Brak dodatkowych informacji"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <DogFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
