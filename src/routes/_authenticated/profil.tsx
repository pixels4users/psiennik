import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Ticket, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import {
  useOwnerBehaviorists,
  useBehavioristOwners,
  useRemoveOwnerBehaviorist,
  useSubscriptionLimits,
  useIsBehaviorist,
  type OwnerBehavioristWithProfile,
} from "@/lib/access";
import { BehavioristInviteCard } from "@/components/behaviorist-invite";
import { JoinDialog } from "@/components/join-dialog";
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
  component: ProfilePage,
});

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
      toast.success("Ustawienia zapisane");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać ustawień");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

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

      <Card className="mt-8 shadow-none">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
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
                    Podaj adres, z którego korzystasz na co dzień — inaczej powiadomienia mogą do
                    Ciebie nie dotrzeć.
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

              <div className="flex flex-wrap justify-between gap-2 pt-2">
                <Button type="button" variant="outline" onClick={signOut}>
                  Wyloguj się
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Zapisywanie…" : "Zapisz"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <ExportDataCard />
      <BehavioristCodeCard />
      <OwnerBehavioristsCard />
      <BehavioristOwnersCard />
      <DeleteAccountCard />
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

  return (
    <Card className="mt-6 border-destructive/30 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Usunięcie konta</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-sm leading-relaxed text-muted-foreground">
          <p>Usunięcie konta jest nieodwracalne. Skasujemy:</p>
          <ul className="mt-2 list-disc pl-5">
            <li>Twój profil i dane logowania,</li>
            <li>
              psy, których jesteś głównym właścicielem — razem z wpisami, zaleceniami i zdjęciami,
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
                  {impact.otherPeople === 1 ? "osoba" : impact.otherPeople < 5 ? "osoby" : "osób"},
                  którym udostępniłeś/aś te dzienniki.
                </>
              )}
            </p>
          ) : null}
          <p className="mt-3">
            Jeśli chcesz zachować dane, pobierz je najpierw przyciskiem „Pobierz moje dane".
          </p>
        </div>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="justify-self-start text-destructive"
              disabled={deleting}
            >
              <Trash2 className="mr-2 size-4" />
              Usuń konto
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Potwierdź usunięcie konta</AlertDialogTitle>
              <AlertDialogDescription>
                Tej operacji nie da się cofnąć. Aby potwierdzić, wpisz poniżej słowo{" "}
                <strong>usuń</strong>.
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

function OwnerBehavioristsCard() {
  const { data: rows, isLoading, isError, refetch } = useOwnerBehaviorists();
  const remove = useRemoveOwnerBehaviorist();

  if (isLoading) {
    return (
      <Card className="mt-6 shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Twoi behawioryści</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return <CollaborationErrorCard title="Twoi behawioryści" onRetry={() => void refetch()} />;
  }

  if (!rows?.length) return null;

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Twoi behawioryści</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.map((row) => (
          <BehavioristRow
            key={row.id}
            row={row}
            onRemove={() => remove.mutate(row.behaviorist_id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function BehavioristOwnersCard() {
  const { data: rows, isLoading, isError, refetch } = useBehavioristOwners();
  const limits = useSubscriptionLimits();
  const remove = useRemoveOwnerBehaviorist();

  if (isLoading) {
    return (
      <Card className="mt-6 shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Twoi klienci</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return <CollaborationErrorCard title="Twoi klienci" onRetry={() => void refetch()} />;
  }

  if (!rows?.length) return null;

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Twoi klienci</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="rounded-lg bg-secondary p-3 text-sm">
          Aktywne procesy: {limits.active} / {limits.max}
          {limits.pending > 0 && (
            <span className="ml-3 text-muted-foreground">(oczekujące: {limits.pending})</span>
          )}
        </div>
        {rows.map((row) => (
          <OwnerRow key={row.id} row={row} onRemove={() => remove.mutate(row.owner_id)} />
        ))}
      </CardContent>
    </Card>
  );
}

function CollaborationErrorCard({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid justify-items-start gap-3">
        <p role="alert" className="text-sm text-muted-foreground">
          Nie udało się wczytać listy.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      </CardContent>
    </Card>
  );
}

function BehavioristRow({
  row,
  onRemove,
}: {
  row: OwnerBehavioristWithProfile;
  onRemove: () => void;
}) {
  const name = row.profile?.display_name || row.profile?.email;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium">
          {name ? `Behawiorysta: ${name}` : "Behawiorysta"}
        </p>
        <p className="text-xs text-muted-foreground">
          Współpraca {STATUS_LABELS[row.process_status] ?? row.process_status}
          {row.link && ` · kod ${row.link.invite_code}`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={name ? `Usuń powiązanie: ${name}` : "Usuń powiązanie"}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function OwnerRow({ row, onRemove }: { row: OwnerBehavioristWithProfile; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
      <div>
        <p className="text-sm font-medium">
          {row.profile?.display_name || row.profile?.email || "Właściciel"}
        </p>
        <p className="text-xs text-muted-foreground">
          Współpraca {STATUS_LABELS[row.process_status] ?? row.process_status}
        </p>
      </div>
      <Button variant="ghost" size="icon" aria-label="Usuń powiązanie" onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
