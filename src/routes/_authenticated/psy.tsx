import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { PawPrint, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/lib/auth";
import { useDogs, useRecentEntries } from "@/lib/dogs";
import { useRedeemInvite } from "@/lib/access";
import { DogFormDialog } from "@/components/dog-form-dialog";
import { DogAvatar } from "@/components/dog-avatar";
import { RatingBadge } from "@/components/rating-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function JoinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [code, setCode] = useState("");
  const redeem = useRedeemInvite();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dogId = await redeem.mutateAsync(code);
      toast.success("Pies dodany do Twojej listy");
      onOpenChange(false);
      setCode("");
      navigate({ to: "/pies/$id", params: { id: dogId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się użyć kodu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-primary">
            Dołącz kodem
          </DialogTitle>
          <DialogDescription>Wpisz kod zaproszenia otrzymany od właściciela psa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-code">Kod zaproszenia</Label>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="np. K7T2QA"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={redeem.isPending || !code.trim()}>
              {redeem.isPending ? "Sprawdzanie…" : "Dołącz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DogsPage() {
  const { role } = useRole();
  const { data: dogs, isLoading } = useDogs();
  const { data: recent } = useRecentEntries(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{role === "behaviorist" ? "Psy pod opieką" : "Twoje psy"}</h1>
          <p className="mt-2 text-muted-foreground">
            {role === "behaviorist"
              ? "Wybierz psa, aby zobaczyć dziennik i dodać zalecenia."
              : "Wybierz psa, aby zobaczyć jego dziennik, albo dodaj nowego."}
          </p>
        </div>
        {role === "behaviorist" ? (
          <Button variant="outline" onClick={() => setJoinOpen(true)}>
            <Ticket className="size-4" />
            Dołącz kodem
          </Button>
        ) : (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Dodaj psa
          </Button>
        )}
      </div>

      {role === "behaviorist" && !!recent?.length && (
        <div className="mt-10">
          <h2 className="text-2xl">Ostatnie wydarzenia</h2>
          <div className="mt-4 grid gap-2">
            {recent.map((entry) => (
              <Link key={entry.id} to="/pies/$id" params={{ id: entry.dog_id }} className="block">
                <Card className="shadow-none transition-colors hover:bg-keylime">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg leading-tight">{entry.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.dogs?.name ?? "Pies"} ·{" "}
                        {format(parseISO(entry.date), "d MMMM yyyy", { locale: pl })}
                      </p>
                    </div>
                    <RatingBadge rating={entry.rating} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

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
            {role === "behaviorist"
              ? "Poproś właściciela o kod zaproszenia i dołącz do dziennika jego psa."
              : "Dodaj pierwszego psa, aby zacząć zapisywać wydarzenia i śledzić postępy."}
          </p>
          {role === "behaviorist" ? (
            <Button variant="outline" className="mt-6" onClick={() => setJoinOpen(true)}>
              <Ticket className="size-4" />
              Dołącz kodem
            </Button>
          ) : (
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
      <JoinDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
