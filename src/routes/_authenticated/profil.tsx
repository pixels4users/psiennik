import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Download, Ticket, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import { useIsBehaviorist, useDogAccess, type AccessWithProfile } from "@/lib/access";
import { useDogs, type Dog } from "@/lib/dogs";
import { AccessDialog } from "@/components/invite-dialog";
import { DogAvatar } from "@/components/dog-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BehavioristInviteCard } from "@/components/behaviorist-invite";
import { JoinDialog } from "@/components/join-dialog";
import { StorageCard } from "@/components/storage-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Skeleton } from "@/components/ui/skeleton";

import { socialMeta } from "@/lib/seo";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount, exportMyData } from "@/lib/account.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: socialMeta({
      title: "Ustawienia — Psiennik",
      description: "Ustawienia konta w Psienniku: nazwa, adres e-mail, powiadomienia i dostęp.",
      path: "/profil",
      image: "app",
      privatePage: true,
    }),
  }),
  validateSearch: (search: Record<string, unknown>): { tab: SettingsTab } => ({
    tab: SETTINGS_TABS.includes(search.tab as SettingsTab) ? (search.tab as SettingsTab) : "profil",
  }),
  component: ProfilePage,
});

const SETTINGS_TABS = ["profil", "dostepy", "powiadomienia"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

const STATUS_LABELS: Record<string, string> = {
  active: "aktywna",
  completed: "zakończona",
  pending: "oczekująca",
};

const NOTIFY_KINDS = [
  { key: "notify_entries", label: "Nowe wydarzenia w dzienniku" },
  { key: "notify_comments", label: "Nowe komentarze" },
  { key: "notify_recommendations", label: "Nowe zalecenia behawiorysty" },
  { key: "notify_access", label: "Zaproszenia i dostęp" },
] as const;

type NotifyKey = (typeof NOTIFY_KINDS)[number]["key"];

/** Adres, na który realnie warto wysyłać powiadomienia. */
function isUsableEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return !email.endsWith("privaterelay.appleid.com");
}

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: isBehaviorist } = useIsBehaviorist();
  const queryClient = useQueryClient();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [kinds, setKinds] = useState<Record<NotifyKey, boolean>>({
    notify_entries: true,
    notify_comments: true,
    notify_recommendations: true,
    notify_access: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setEmail(profile.email ?? "");
    setNotifications(profile.email_notifications);
    setKinds({
      notify_entries: profile.notify_entries,
      notify_comments: profile.notify_comments,
      notify_recommendations: profile.notify_recommendations,
      notify_access: profile.notify_access,
    });
  }, [profile]);

  const nameDirty = useMemo(
    () => !!profile && (displayName.trim() || null) !== (profile.display_name ?? null),
    [profile, displayName],
  );
  const notifyDirty = useMemo(() => {
    if (!profile) return false;
    return (
      (email.trim() || null) !== (profile.email ?? null) ||
      notifications !== profile.email_notifications ||
      kinds.notify_entries !== profile.notify_entries ||
      kinds.notify_comments !== profile.notify_comments ||
      kinds.notify_recommendations !== profile.notify_recommendations ||
      kinds.notify_access !== profile.notify_access
    );
  }, [profile, email, notifications, kinds]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Podaj poprawny adres e-mail");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          email: trimmedEmail || null,
          email_notifications: notifications,
          ...kinds,
        })
        .eq("id", user!.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      toast.success("Ustawienia zapisane");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać ustawień");
    } finally {
      setSaving(false);
    }
  };

  const saveButton = (isDirty: boolean) => (
    <div className="flex justify-end gap-2 pt-2">
      {saving ? (
        <Button type="submit" disabled>
          Zapisywanie…
        </Button>
      ) : isDirty ? (
        <Button type="submit">Zapisz zmiany</Button>
      ) : saved ? (
        <p className="flex items-center gap-1.5 text-sm text-foreground">
          <Check className="size-4" aria-hidden="true" />
          Zapisano zmiany
        </p>
      ) : null}
    </div>
  );

  const formSkeleton = (
    <div className="grid gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl">Ustawienia</h1>
          {import.meta.env.DEV && (
            <p className="mt-1 text-xs text-muted-foreground">
              Tryb testowy · {isBehaviorist ? "Behawiorysta" : "Właściciel"}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={() => setJoinOpen(true)}>
          <Ticket aria-hidden="true" />
          Wpisz kod zaproszenia
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({ to: "/profil", search: { tab: value as SettingsTab }, replace: true })
        }
        className="mt-8"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="dostepy">Dostępy</TabsTrigger>
          <TabsTrigger value="powiadomienia">Powiadomienia</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <Card className="mt-6 shadow-none">
            <CardContent className="p-6">
              {isLoading ? (
                formSkeleton
              ) : (
                <form onSubmit={save} className="grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="display-name">Nazwa wyświetlana</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="np. Miłosz"
                    />
                  </div>
                  {saveButton(nameDirty)}
                </form>
              )}
            </CardContent>
          </Card>
          <StorageCard />
          <ChatGptCard />
          <ExportDataCard />
          <DeleteAccountCard />
        </TabsContent>

        <TabsContent value="dostepy">
          <BehavioristCodeCard />
          <DogAccessOverview />
        </TabsContent>

        <TabsContent value="powiadomienia">
          <Card className="mt-6 shadow-none">
            <CardContent className="p-6">
              {isLoading ? (
                formSkeleton
              ) : (
                <form onSubmit={save} className="grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="profile-email">Adres do powiadomień</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="adres do powiadomień"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tu wysyłamy powiadomienia. Sposób logowania pozostaje bez zmian.
                    </p>
                    {notifications && !isUsableEmail(email) && (
                      <p className="text-xs text-primary">
                        Podaj adres, z którego korzystasz na co dzień — inaczej powiadomienia mogą
                        do Ciebie nie dotrzeć.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 rounded-lg border border-primary/10 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="notify-all" className="font-medium">
                        Powiadomienia e-mail
                      </Label>
                      <Switch
                        id="notify-all"
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Powiadomienia w aplikacji (dzwonek) działają zawsze.
                    </p>
                    <div className="grid gap-2.5">
                      {NOTIFY_KINDS.map((kind) => (
                        <div key={kind.key} className="flex items-center justify-between gap-4">
                          <Label
                            htmlFor={`notify-${kind.key}`}
                            className={`text-sm font-normal ${notifications ? "" : "text-muted-foreground"}`}
                          >
                            {kind.label}
                          </Label>
                          <Switch
                            id={`notify-${kind.key}`}
                            disabled={!notifications}
                            checked={kinds[kind.key]}
                            onCheckedChange={(value) =>
                              setKinds((prev) => ({ ...prev, [kind.key]: value }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {saveButton(notifyDirty)}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <JoinDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}

function ExportDataCard() {
  const exportData = useServerFn(exportMyData);
  const [exporting, setExporting] = useState(false);

  const triggerDownload = (href: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const download = async () => {
    setExporting(true);
    try {
      const data = await exportData({});
      const blob = new Blob([data.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, data.fileName);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      // Zdjęcia pobieramy osobno jako oryginalne pliki.
      for (const path of data.photoPaths) {
        const { data: signed, error } = await supabase.storage
          .from("dog-photos")
          .createSignedUrl(path, 60, {
            download: path.split("/").pop() ?? "zdjecie.jpg",
          });
        if (error || !signed) continue;
        triggerDownload(signed.signedUrl, path.split("/").pop() ?? "zdjecie.jpg");
        await new Promise((r) => setTimeout(r, 300));
      }

      toast.success("Pobrano dane. Zdjęcia pobierają się osobno.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się pobrać danych");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Twoje dane</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Możesz pobrać kopię swoich danych: psy, wpisy, zalecenia oraz zdjęcia w oryginalnych
          formatach. Plik tekstowy zawiera czytelny opis Twoich psów, wpisów i zaleceń.
        </p>
        <Button
          variant="outline"
          className="justify-self-start"
          disabled={exporting}
          onClick={() => void download()}
        >
          <Download className="mr-2 size-4" />
          {exporting ? "Pobieranie…" : "Pobierz moje dane"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ChatGptCard() {
  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Połącz swój Psiennik z ChatGPT</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Zadawaj ChatGPT pytania o swoje psy, wpisy i komentarze. ChatGPT może tylko odczytywać
          dane — niczego nie zmieni.
        </p>
        <Button asChild variant="outline" className="justify-self-start">
          <Link to="/psiennik-w-chatgpt">Zobacz, jak to zrobić</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DeleteAccountCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const deleteAccount = useServerFn(deleteMyAccount);
  const [deleting, setDeleting] = useState(false);
  const [confirmWord, setConfirmWord] = useState("");
  const [open, setOpen] = useState(false);

  const { data: impact, isLoading: impactLoading } = useQuery({
    queryKey: ["delete-impact", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const userId = user!.id;
      const { data: dogs, error: dogsError } = await supabase
        .from("dogs")
        .select("id, name")
        .eq("owner_id", userId);
      if (dogsError) throw dogsError;

      const dogIds = (dogs ?? []).map((d) => d.id);
      const { count, error: accessError } =
        dogIds.length > 0
          ? await supabase
              .from("dog_access")
              .select("*", { count: "exact", head: true })
              .in("dog_id", dogIds)
              .neq("user_id", userId)
          : { count: 0, error: null };
      if (accessError) throw accessError;

      return { dogs: dogs ?? [], otherPeople: count ?? 0 };
    },
  });

  const remove = async () => {
    if (confirmWord.trim().toLowerCase() !== "usuń") return;
    setDeleting(true);
    try {
      await deleteAccount({});
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Konto zostało usunięte");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć konta");
      setDeleting(false);
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Konto</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => void signOut()}>
          Wyloguj się
        </Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="mr-2 size-4" />
              Usuń konto
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Potwierdź usunięcie konta</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  <p>Usunięcie konta jest nieodwracalne. Skasujemy:</p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Twój profil i dane logowania,</li>
                    <li>
                      psy, których jesteś głównym właścicielem — razem z wpisami, zaleceniami i
                      zdjęciami,
                    </li>
                    <li>Twoje dostępy do cudzych psów oraz powiązania z behawiorystami.</li>
                  </ul>
                  {impactLoading ? (
                    <p className="mt-3">Obliczam skutki usunięcia…</p>
                  ) : impact && impact.dogs.length > 0 ? (
                    <p className="mt-3">
                      Psy, które znikną: {impact.dogs.map((d) => d.name).join(", ")}.
                      {impact.otherPeople > 0 && (
                        <>
                          {" "}
                          Dostęp straci {impact.otherPeople}{" "}
                          {impact.otherPeople === 1
                            ? "osoba"
                            : impact.otherPeople < 5
                              ? "osoby"
                              : "osób"}
                          , którym udostępniłeś/aś te dzienniki.
                        </>
                      )}
                    </p>
                  ) : null}
                  <p className="mt-3">
                    Jeśli chcesz zachować dane, pobierz je najpierw przyciskiem „Pobierz moje
                    dane”.
                  </p>
                  <p className="mt-3">
                    Aby potwierdzić, wpisz poniżej słowo <strong>usuń</strong>.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value)}
              placeholder="Wpisz usuń"
              autoFocus
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} onClick={() => setConfirmWord("")}>
                Anuluj
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting || confirmWord.trim().toLowerCase() !== "usuń"}
                onClick={(e) => {
                  e.preventDefault();
                  void remove();
                }}
              >
                {deleting ? "Usuwanie…" : "Usuń konto"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function BehavioristCodeCard() {
  const { data: isBehaviorist, isLoading: roleLoading } = useIsBehaviorist();
  if (roleLoading || !isBehaviorist) return null;
  return <BehavioristInviteCard />;
}

function DogAccessOverview() {
  const { data: dogs, isLoading, isError, refetch } = useDogs();

  if (isLoading) {
    return (
      <div className="mt-6 grid gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="mt-6 shadow-none">
        <CardContent className="grid justify-items-start gap-3 p-6">
          <p role="alert" className="text-sm text-muted-foreground">
            Nie udało się wczytać listy psów.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Spróbuj ponownie
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dogs?.length) {
    return (
      <Card className="mt-6 shadow-none">
        <CardContent className="grid justify-items-start gap-3 p-6">
          <p className="text-sm text-muted-foreground">Nie masz jeszcze żadnego psa.</p>
          <Button asChild variant="outline">
            <Link to="/psy">Dodaj psa</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      {dogs.map((dog) => (
        <DogAccessCard key={dog.id} dog={dog} />
      ))}
    </div>
  );
}

function DogAccessCard({ dog }: { dog: Dog }) {
  const { data: access, isLoading } = useDogAccess(dog.id);
  const [open, setOpen] = useState(false);

  const coOwner = access?.find((row) => row.role === "owner" && row.user_id !== dog.owner_id);
  const behaviorist = access?.find((row) => row.role === "behaviorist");
  const personName = (row?: AccessWithProfile) =>
    row ? row.profile?.display_name || row.profile?.email || "Bez nazwy" : "Brak";

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <DogAvatar dog={dog} className="size-12" />
          <div className="min-w-0">
            <p className="break-words font-display text-lg">{dog.name}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-40" />
            ) : (
              <dl className="mt-1 grid gap-0.5 text-sm">
                <div className="flex flex-wrap gap-1">
                  <dt className="text-muted-foreground">Współwłaściciel:</dt>
                  <dd>{personName(coOwner)}</dd>
                </div>
                <div className="flex flex-wrap gap-1">
                  <dt className="text-muted-foreground">Behawiorysta:</dt>
                  <dd>
                    {personName(behaviorist)}
                    {behaviorist &&
                      ` · współpraca ${STATUS_LABELS[behaviorist.process_status] ?? behaviorist.process_status}`}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
        <Button variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
          Zarządzaj dostępem
        </Button>
      </CardContent>
      <AccessDialog dog={dog} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
