import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowUpRight, Clock, PawPrint, Plus, Ticket, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { readSelectedDog } from "@/lib/selected-dog";
import { JoinDialog } from "@/components/join-dialog";
import { DogDoodle } from "@/components/dog-motifs";
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
import { useIsOwner, useIsBehaviorist, useSubscriptionLimits } from "@/lib/access";
import { DogFormDialog } from "@/components/dog-form-dialog";
import { InviteClientDialog } from "@/components/behaviorist-invite";
import { DogAvatar } from "@/components/dog-avatar";
import { RatingBadge } from "@/components/rating-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { socialMeta } from "@/lib/seo";
import sygnetAsset from "@/assets/Psiennik_sygnet.png.asset.json";

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

function DogCard({ dog, canResume = false }: { dog: DogWithAccess; canResume?: boolean }) {
  const status = dog.dog_access?.[0]?.process_status ?? "active";
  const isPending = status === "pending";
  return (
    <Link to="/pies/$id" params={{ id: dog.id }} className="dog-grid-card group block h-full">
      <Card className="h-full overflow-hidden border-primary/10 shadow-none transition-colors group-hover:border-primary/35 group-hover:bg-secondary/20 group-focus-visible:border-primary/35">
        <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-secondary">
          <DogAvatar dog={dog} className="size-full rounded-none object-cover" />
          {isPending && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs text-foreground">
              <Clock className="size-3" />
              Oczekujący
            </span>
          )}
        </div>
        <CardContent className="grid gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate text-3xl">{dog.name}</h2>
            <ArrowUpRight className="size-5 shrink-0 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            {[dog.breed, dog.age, dog.sex].filter(Boolean).join(" · ") ||
              "Brak dodatkowych informacji"}
          </p>
          {canResume ? (
            <div className="border-t pt-3">
              <ResumeProcessButton
                dogId={dog.id}
                dogName={dog.name}
                variant="outline"
                size="sm"
                className="w-full"
              />
            </div>
          ) : (
            <span className="border-t pt-3 text-xs font-medium text-primary">Otwórz dziennik</span>
          )}
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
    <Link
      to="/pies/$id"
      params={{ id: entry.dog_id }}
      search={{ wpis: entry.id }}
      className="block min-w-0"
    >
      <Card className="shadow-none transition-colors hover:bg-keylime">
        <CardContent className="flex items-start gap-4 p-4">
          <RecentEntryDogPhoto photoUrl={entry.dogs?.photo_url ?? null} />
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
            <p className="font-display text-lg leading-tight [overflow-wrap:anywhere]">
              {entry.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {entry.dogs?.name ?? "Pies"} ·{" "}
              {format(parseISO(entry.date), "d MMMM yyyy", { locale: pl })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <RatingBadge rating={entry.rating} />
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
  const {
    data: isBehaviorist,
    isLoading: behavioristLoading,
    isError: roleError,
    refetch: refetchRole,
  } = useIsBehaviorist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: dogs, isLoading, isError, refetch } = useDogs();
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
  const ownerDestination =
    !loading && !isError && !roleError && isBehaviorist === false && dogs?.length
      ? readSelectedDog(dogs, user?.id)
      : null;

  useEffect(() => {
    if (ownerDestination)
      void navigate({ to: "/pies/$id", params: { id: ownerDestination }, replace: true });
  }, [ownerDestination, navigate]);

  if (ownerDestination)
    return (
      <div
        className="mx-auto max-w-5xl px-5 py-10"
        role="status"
        aria-label="Otwieranie dziennika psa"
      >
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  if (isError || roleError)
    return (
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <h1 className="text-4xl">Nie udało się wczytać psów</h1>
        <Button
          className="mt-5"
          onClick={() => {
            void refetch();
            void refetchRole();
          }}
        >
          Spróbuj ponownie
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{isBehaviorist ? "Twój gabinet" : "Twój dziennik"}</p>
          <h1 className="text-4xl sm:text-5xl">{isBehaviorist ? "Psy pod opieką" : "Twoje psy"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isBehaviorist ? (
            dogs?.length ? (
              <>
                <Button onClick={() => setInviteOpen(true)}>
                  <UserPlus className="size-4" />
                  Zaproś klienta
                </Button>
                <Button variant="outline" onClick={() => setJoinOpen(true)}>
                  <Ticket className="size-4" />
                  Wpisz kod zaproszenia
                </Button>
              </>
            ) : null
          ) : (
            <>
              {isOwner && (
                <Button variant="outline" onClick={() => setJoinOpen(true)}>
                  <Ticket className="size-4" />
                  Wpisz kod zaproszenia
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
        <p className="mt-3 text-sm text-muted-foreground">
          Aktywne procesy: {limits.active} z {limits.max}
          {limits.pending > 0 && ` · oczekujące: ${limits.pending}`}
        </p>
      )}

      {!!recentEntries.length && (
        <div className="mt-10">
          <h2 className="text-2xl">Ostatnie wydarzenia</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recentEntries.map((entry) => (
              <RecentEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="mt-10 rounded-3xl bg-keylime px-6 py-12 text-center">
          <DogDoodle className="mx-auto w-36 text-primary" />
          <h2 className="mt-4 text-3xl">
            {isBehaviorist ? "Zaproś pierwszego klienta" : "Nie masz jeszcze dodanych psów"}
          </h2>
          {isBehaviorist && (
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Wyślij właścicielowi link — po rejestracji jego psy trafią pod Twoją opiekę.
            </p>
          )}
          {isBehaviorist ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4" />
                Zaproś klienta
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                <Ticket className="size-4" />
                Wpisz kod zaproszenia
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
          <TabsList className="mb-6 flex h-auto w-fit max-w-full flex-wrap">
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
              <div className="content-enter grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
