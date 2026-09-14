import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, Link, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";
import {
  useBehavioristLink,
  useCreateBehavioristLink,
  useOwnerBehaviorists,
  useBehavioristOwners,
  useRemoveOwnerBehaviorist,
  useSubscriptionLimits,
  useIsBehaviorist,
  type OwnerBehavioristWithProfile,
} from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
      title: "Mój profil — Psiennik",
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

function copy(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Skopiowano"),
    () => toast.info(`Kod: ${text}`),
  );
}

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setEmail(profile.email ?? "");
    setNotifications(profile.email_notifications);
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          email: email.trim() || null,
          email_notifications: notifications,
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
      <h1 className="text-4xl">Mój profil</h1>
      <p className="mt-2 text-muted-foreground">Ustawienia konta i zarządzanie dostępem.</p>

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
                <Label htmlFor="profile-email">Adres e-mail</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adres do powiadomień"
                />
                <p className="text-xs text-muted-foreground">
                  Uzupełnij, jeśli logowanie nie przekazało Twojego adresu.
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary p-4">
                <div>
                  <p className="text-sm font-medium">Powiadomienia e-mail</p>
                  <p className="text-xs text-muted-foreground">
                    Wysyłkę wiadomości uruchomimy w kolejnym kroku.
                  </p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
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
    </div>
  );
}

function ExportDataCard() {
  const exportData = useServerFn(exportMyData);
  const [exporting, setExporting] = useState(false);

  const download = async () => {
    setExporting(true);
    try {
      const data = await exportData({});
      const text = JSON.stringify(data, null, 2);
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `psiennik-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Zdjęcia pobieramy osobno jako oryginalne pliki.
      for (const path of data.photoPaths) {
        const { data: signed, error } = await supabase.storage.from("dog-photos").createSignedUrl(path, 60);
        if (error || !signed) continue;
        const img = document.createElement("a");
        img.href = signed.signedUrl;
        img.download = path.split("/").pop() ?? "zdjecie.jpg";
        img.click();
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
          formatach. Plik tekstowy zawiera dane w formacie JSON.
        </p>
        <Button variant="outline" className="justify-self-start" disabled={exporting} onClick={() => void download()}>
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
      const { data: dogs, error: dogsError } = await supabase.from("dogs").select("id, name").eq("owner_id", userId);
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
            <li>psy, których jesteś głównym właścicielem — razem z wpisami, zaleceniami i zdjęciami,</li>
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
                  {impact.otherPeople === 1 ? "osoba" : impact.otherPeople < 5 ? "osoby" : "osób"}, którym udostępniłeś/aś te dzienniki.
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
            <Button variant="outline" className="justify-self-start text-destructive" disabled={deleting}>
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
  const { data: link, isLoading } = useBehavioristLink();
  const create = useCreateBehavioristLink();
  const { data: isBehaviorist, isLoading: roleLoading } = useIsBehaviorist();

  if (!roleLoading && !isBehaviorist) return null;

  const copyLinkUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link skopiowany"),
      () => toast.info(`Link: ${url}`),
    );
  };

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Kod zapraszający behawiorysty</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : link ? (
          <div className="grid gap-2 rounded-lg bg-keylime px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-3xl tracking-widest text-primary">
                  {link.invite_code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Podaj ten kod właścicielom — połączą Cię ze swoim psem.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Kopiuj kod" onClick={() => copy(link.invite_code)}>
                  <Copy className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Kopiuj link"
                  onClick={() =>
                    copyLinkUrl(`${window.location.origin}/auth?code=${encodeURIComponent(link.invite_code)}`)
                  }
                >
                  <Link className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Wygeneruj nowy kod"
                  disabled={create.isPending}
                  onClick={() => create.mutate(undefined, { onSuccess: (l) => copy(l.invite_code) })}
                >
                  <RefreshCw className={cn("size-4", create.isPending && "animate-spin")} />
                </Button>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Wyślij ten link właścicielowi. Po zalogowaniu lub rejestracji zostanie automatycznie połączony z Tobą i nowe psy będą trafiały pod Twoją opiekę.
            </p>
            <p className="truncate text-xs text-primary">
              {`${window.location.origin}/auth?code=${encodeURIComponent(link.invite_code)}`}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-secondary p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Nie masz jeszcze kodu. Wygeneruj go, aby właściciele mogli Cię zaprosić.
            </p>
            <Button
              className="mt-3"
              disabled={create.isPending}
              onClick={() => create.mutate(undefined, { onSuccess: (l) => copy(l.invite_code) })}
            >
              <RefreshCw className={cn("mr-2 size-4", create.isPending && "animate-spin")} />
              Wygeneruj kod
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OwnerBehavioristsCard() {
  const { data: rows, isLoading } = useOwnerBehaviorists();
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

  if (!rows?.length) return null;

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Twoi behawioryści</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.map((row) => (
          <BehavioristRow key={row.id} row={row} onRemove={() => remove.mutate(row.behaviorist_id)} />
        ))}
      </CardContent>
    </Card>
  );
}

function BehavioristOwnersCard() {
  const { data: rows, isLoading } = useBehavioristOwners();
  const limits = useSubscriptionLimits();
  const remove = useRemoveOwnerBehaviorist();

  if (isLoading) {
    return (
      <Card className="mt-6 shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Twoi właściciele</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!rows?.length) return null;

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Twoi właściciele</CardTitle>
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

function BehavioristRow({
  row,
  onRemove,
}: {
  row: OwnerBehavioristWithProfile;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
      <div>
        <p className="text-sm font-medium">
          {row.profile?.display_name || row.profile?.email || "Behawiorysta"}
        </p>
        <p className="text-xs text-muted-foreground">
          Współpraca {STATUS_LABELS[row.process_status] ?? row.process_status}
          {row.link && ` · kod ${row.link.invite_code}`}
        </p>
      </div>
      <Button variant="ghost" size="icon" aria-label="Usuń powiązanie" onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function OwnerRow({
  row,
  onRemove,
}: {
  row: OwnerBehavioristWithProfile;
  onRemove: () => void;
}) {
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
