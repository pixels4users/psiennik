import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Link, RefreshCw, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Mój profil — Psiennik" },
      {
        name: "description",
        content: "Ustawienia konta w Psienniku: nazwa, adres e-mail, powiadomienia i dostęp.",
      },
      { property: "og:title", content: "Mój profil — Psiennik" },
      {
        property: "og:description",
        content: "Ustawienia konta w Psienniku: nazwa, adres e-mail, powiadomienia i dostęp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
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
      <p className="mt-2 text-muted-foreground">
        Ustawienia konta i zarządzanie dostępem.
      </p>

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

      <BehavioristCodeCard />
      <OwnerBehavioristsCard />
      <BehavioristOwnersCard />
    </div>
  );
}

function BehavioristCodeCard() {
  const { data: link, isLoading } = useBehavioristLink();
  const create = useCreateBehavioristLink();
  const { data: isBehaviorist, isLoading: roleLoading } = useIsBehaviorist();

  if (!roleLoading && !isBehaviorist) return null;

  return (
    <Card className="mt-6 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Kod zapraszający behawiorysty</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : link ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-keylime px-4 py-3">
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
                aria-label="Wygeneruj nowy kod"
                disabled={create.isPending}
                onClick={() => create.mutate(undefined, { onSuccess: (l) => copy(l.invite_code) })}
              >
                <RefreshCw className={cn("size-4", create.isPending && "animate-spin")} />
              </Button>
            </div>
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
