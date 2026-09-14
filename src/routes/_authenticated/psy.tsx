import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Clock, PawPrint, Plus, Ticket, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  useDogs,
  useRecentEntries,
  useDogPhotoUrl,
  ACTIVITY_TYPES,
  ACTIVITY_ICONS,
  entryActivities,
  labelFor,
  type DogWithAccess,
  type RecentEntry,
} from "@/lib/dogs";
import {
  useIsOwner,
  useIsBehaviorist,
  useRedeemInvite,
  useSubscriptionLimits,
} from "@/lib/access";
import { DogFormDialog } from "@/components/dog-form-dialog";
import { BehavioristCodeBar, InviteClientDialog } from "@/components/behaviorist-invite";
import { DogAvatar } from "@/components/dog-avatar";
import { RatingBadge } from "@/components/rating-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { socialMeta } from "@/lib/seo";
import sygnetAsset from "@/assets/Psiennik_sygnet.png.asset.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/psy")({
  head: () => ({
    meta: socialMeta({
      title: "Twoje psy — Psiennik",
      description: "Lista psów i szybki dostęp do ich dzienników behawioralnych.",
      path: "/psy",
      image: "app",
      privatePage: true,
    }),
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
      const { dogId } = await redeem.mutateAsync(code);
      if (dogId) {
        toast.success("Pies dodany do Twojej listy");
        onOpenChange(false);
        setCode("");
        navigate({ to: "/pies/$id", params: { id: dogId } });
      } else {
        toast.success("Kod behawiorysty został użyty");
        onOpenChange(false);
        setCode("");
      }
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
          <DialogDescription>
            Wpisz kod zaproszenia otrzymany od właściciela psa lub kod behawiorysty.
          </DialogDescription>
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

function DogCard({ dog }: { dog: DogWithAccess }) {
  const status = dog.dog_access?.[0]?.process_status ?? "active";
  const isPending = status === "pending";
  return (
    <Link to="/pies/$id" params={{ id: dog.id }} className="block">
      <Card className="shadow-none transition-colors hover:bg-keylime">
        <CardContent className="flex items-center gap-4 p-6">
          <DogAvatar dog={dog} />
          <div className="grid flex-1 gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl">{dog.name}</h2>
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warn/10 px-2 py-0.5 text-xs text-warn">
                  <Clock className="size-3" />
                  Oczekujący
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {[dog.breed, dog.age, dog.sex].filter(Boolean).join(" · ") ||
                "Brak dodatkowych informacji"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentEntryDogPhoto({ photoUrl }: { photoUrl: string | null }) {
  const { data: url } = useDogPhotoUrl(photoUrl);

  if (!photoUrl) {
    return (
      <img
        src={sygnetAsset.url}
        alt=""
        className="size-12 shrink-0 rounded-full object-cover bg-secondary p-1.5"
      />
    );
  }

  if (!url) return <Skeleton className="size-12 shrink-0 rounded-full" />;

  return <img src={url} alt="" className="size-12 shrink-0 rounded-full object-cover" />;
}

function RecentEntryCard({ entry }: { entry: RecentEntry }) {
  const activities = entryActivities(entry);

  return (
    <Link to="/pies/$id" params={{ id: entry.dog_id }} className="block">
      <Card className="shadow-none transition-colors hover:bg-keylime">
        <CardContent className="flex items-start gap-4 p-4">
          <RecentEntryDogPhoto photoUrl={entry.dogs?.photo_url ?? null} />
          <div className="grid min-w-0 flex-1 gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-display text-lg leading-tight">{entry.title}</p>
              <RatingBadge rating={entry.rating} />
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.dogs?.name ?? "Pies"} ·{" "}
              {format(parseISO(entry.date), "d MMMM yyyy", { locale: pl })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activities.map((value) => {
                const Icon = ACTIVITY_ICONS[value];
                return (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
                  >
                    {Icon && <Icon className="size-3" aria-hidden="true" />}
                    {labelFor(ACTIVITY_TYPES, value)}
                  </span>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DogsPage() {
  const { data: isOwner, isLoading: ownerLoading } = useIsOwner();
  const { data: isBehaviorist, isLoading: behavioristLoading } = useIsBehaviorist();
  const { data: dogs, isLoading } = useDogs();
  const { data: recent } = useRecentEntries(5);
  const limits = useSubscriptionLimits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const grouped = useMemo(() => {
    const active: DogWithAccess[] = [];
    const completed: DogWithAccess[] = [];
    const pending: DogWithAccess[] = [];
    for (const dog of (dogs as DogWithAccess[] | undefined) ?? []) {
      const status = dog.dog_access?.[0]?.process_status ?? "active";
      if (status === "completed") completed.push(dog);
      else if (status === "pending") pending.push(dog);
      else active.push(dog);
    }
    return { active, completed, pending };
  }, [dogs]);

  const loading = isLoading || ownerLoading || behavioristLoading;
  const recentEntries = (recent ?? []).slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{isBehaviorist ? "Psy pod opieką" : "Twoje psy"}</h1>
          <p className="mt-2 text-muted-foreground">
            {isBehaviorist
              ? "Wybierz psa, aby zobaczyć dziennik i dodać zalecenia."
              : "Wybierz psa, aby zobaczyć jego dziennik, albo dodaj nowego."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isBehaviorist ? (
            <>
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4" />
                Zaproś klienta
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                <Ticket className="size-4" />
                Dołącz kodem
              </Button>
            </>
          ) : (
            <>
              {isOwner && (
                <Button variant="outline" onClick={() => setJoinOpen(true)}>
                  <Ticket className="size-4" />
                  Dołącz kodem
                </Button>
              )}
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Dodaj psa
              </Button>
            </>
          )}
        </div>
      </div>

      {isBehaviorist && (
        <BehavioristCodeBar>
          Aktywne procesy: {limits.active} / {limits.max}
          {limits.pending > 0 && <span className="ml-2">(oczekujące: {limits.pending})</span>}
        </BehavioristCodeBar>
      )}

      {!!recentEntries.length && (
        <div className="mt-10">
          <h2 className="text-2xl">Ostatnie wydarzenia</h2>
          <div className="mt-4 grid gap-3">
            {recentEntries.map((entry) => (
              <RecentEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {loading ? (
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
          <h2 className="mt-4 text-3xl">
            {isBehaviorist ? "Zaproś pierwszego klienta" : "Jeszcze nie ma żadnego psa"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {isBehaviorist
              ? "Wyślij właścicielowi link — po rejestracji jego psy trafią pod Twoją opiekę."
              : "Dodaj pierwszego psa, aby zacząć zapisywać wydarzenia i śledzić postępy."}
          </p>
          {isBehaviorist ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4" />
                Zaproś klienta
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                <Ticket className="size-4" />
                Dołącz kodem
              </Button>
            </div>
          ) : (
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Dodaj psa
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue="active" className="mt-10">
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Aktywne
              <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-xs">
                {grouped.active.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Oczekujące
              <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-xs">
                {grouped.pending.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Zakończone
              <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-xs">
                {grouped.completed.length}
              </span>
            </TabsTrigger>
          </TabsList>
          {(["active", "pending", "completed"] as const).map((key) => (
            <TabsContent key={key} value={key}>
              <div className="grid gap-5 sm:grid-cols-2">
                {grouped[key].length === 0 ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    {key === "active"
                      ? "Brak aktywnych psów."
                      : key === "pending"
                        ? "Brak oczekujących psów."
                        : "Brak zakończonych procesów."}
                  </p>
                ) : (
                  grouped[key].map((dog) => <DogCard key={dog.id} dog={dog} />)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <DogFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <JoinDialog open={joinOpen} onOpenChange={setJoinOpen} />
      <InviteClientDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
