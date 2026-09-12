import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile, useRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Mój profil — Psiennik" },
      {
        name: "description",
        content: "Ustawienia konta w Psienniku: nazwa, adres e-mail i powiadomienia.",
      },
      { property: "og:title", content: "Mój profil — Psiennik" },
      {
        property: "og:description",
        content: "Ustawienia konta w Psienniku: nazwa, adres e-mail i powiadomienia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { role } = useRole();
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
        {role === "behaviorist" ? "Konto behawiorysty" : "Konto właściciela"}
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
    </div>
  );
}
