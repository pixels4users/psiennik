import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { CircleCheckBig, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { useRedeemInvite } from "@/lib/access";
import {
  DEMO_BEHAVIORIST_EMAIL,
  DEMO_OWNER_EMAIL,
  DEMO_PASSWORD,
  ensureDemoAccounts,
} from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Logowanie — Psiennik" },
      {
        name: "description",
        content: "Zaloguj się lub załóż konto w Psienniku — dzienniku behawioralnym psa.",
      },
      { property: "og:title", content: "Logowanie — Psiennik" },
      {
        property: "og:description",
        content: "Zaloguj się lub załóż konto w Psienniku — dzienniku behawioralnym psa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { code } = useSearch({ from: "/auth" });
  const redeem = useRedeemInvite();
  const [busy, setBusy] = useState(false);
  const redeemedRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const searchCode = code?.trim();

  useEffect(() => {
    if (loading || !user) return;

    if (searchCode && !redeemedRef.current) {
      redeemedRef.current = true;
      redeem.mutate(searchCode, {
        onSuccess: ({ dogId, behavioristId }) => {
          toast.success("Kod został użyty");
          if (dogId) {
            navigate({ to: "/pies/$id", params: { id: dogId }, replace: true });
          } else if (behavioristId) {
            navigate({ to: "/psy", replace: true });
          } else {
            navigate({ to: "/psy", replace: true });
          }
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Nie udało się użyć kodu");
          navigate({ to: "/psy", replace: true });
        },
      });
    } else if (!searchCode) {
      navigate({ to: "/psy", replace: true });
    }
  }, [loading, user, searchCode, navigate, redeem]);

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    try {
      const redirectTo = effectiveCode
        ? `${window.location.origin}/auth?code=${encodeURIComponent(effectiveCode)}`
        : window.location.origin;
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: redirectTo,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/psy", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zalogować");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // redirect handled by useEffect with code
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zalogować");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: effectiveCode
            ? `${window.location.origin}/auth?code=${encodeURIComponent(effectiveCode)}`
            : window.location.origin,
          data: { display_name: name },
        },
      });
      if (error) throw error;
      if (data.session) {
        // redirect handled by useEffect with code
      } else {
        setRegisteredEmail(email.trim());
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się założyć konta");
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async (which: "owner" | "behaviorist") => {
    setBusy(true);
    try {
      await ensureDemoAccounts();
      const { error } = await supabase.auth.signInWithPassword({
        email: which === "owner" ? DEMO_OWNER_EMAIL : DEMO_BEHAVIORIST_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) throw error;
      // redirect handled by useEffect with code
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się wejść na konto demo");
    } finally {
      setBusy(false);
    }
  };

  if (registeredEmail) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center px-5 py-12 text-center">
        <div className="w-full">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-keylime text-primary">
            <CircleCheckBig className="size-8" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-4xl">Konto zostało utworzone</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Wysłaliśmy wiadomość z linkiem potwierdzającym na adres:
          </p>
          <p className="mt-2 break-words font-semibold text-foreground">{registeredEmail}</p>
          <div className="mt-8 flex items-start gap-3 rounded-lg bg-muted p-5 text-left">
            <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Otwórz wiadomość i kliknij link, aby potwierdzić adres e-mail i dokończyć rejestrację.
              Jeśli jej nie widzisz, sprawdź folder spam.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-4xl">Witaj w Psienniku</h1>
      <p className="mt-2 text-muted-foreground">
        Zaloguj się, aby prowadzić dziennik behawioralny swojego psa.
      </p>

      {effectiveCode && (
        <div className="mt-6 rounded-lg bg-keylime p-4 text-center text-sm">
          <p className="font-medium text-foreground">Masz zaproszenie</p>
          <p className="mt-1 text-muted-foreground">
            Zaloguj się lub załóż konto, a kod{" "}
            <span className="font-display text-lg tracking-widest text-primary">{effectiveCode}</span>{" "}
            zostanie automatycznie użyty.
          </p>
        </div>
      )}

      <Card className="mt-8 shadow-none">
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Button variant="outline" disabled={busy} onClick={() => oauth("google")}>
              Kontynuuj z Google
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => oauth("apple")}>
              Kontynuuj z Apple
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs tracking-wide text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            albo e-mailem
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                Logowanie
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                Rejestracja
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={signIn} className="grid gap-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="login-password">Hasło</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  Zaloguj się
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={signUp} className="grid gap-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="reg-name">Imię</Label>
                  <Input
                    id="reg-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reg-email">E-mail</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reg-password">Hasło</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  Załóż konto
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {import.meta.env.DEV && (
        <div className="mt-6 grid gap-2 rounded-xl bg-keylime p-5">
          <p className="text-sm text-secondary-foreground">Konta demo (tylko podgląd):</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => demoLogin("owner")}>
              Demo: właściciel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => demoLogin("behaviorist")}
            >
              Demo: behawiorystka
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
