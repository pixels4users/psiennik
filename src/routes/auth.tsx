import { useEffect, useRef, useState } from "react";
import {
  Link as RouterLink,
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { CircleCheckBig, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { useRedeemInvite } from "@/lib/access";
import { claimBehavioristRole } from "@/lib/role.functions";

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
import { socialMeta } from "@/lib/seo";

const searchSchema = z.object({
  code: z.string().optional(),
  rola: z.enum(["owner", "behaviorist"]).optional(),
});

const PENDING_ROLE_KEY = "psiennik.pending-role";


export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: socialMeta({
      title: "Logowanie i rejestracja — Psiennik",
      description: "Zaloguj się lub załóż konto w Psienniku — dzienniku behawioralnym psa.",
      path: "/auth",
      image: "auth",
      privatePage: true,
    }),
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { code, rola } = useSearch({ from: "/auth" });
  const redeem = useRedeemInvite();
  const queryClient = useQueryClient();
  const claimBehaviorist = useServerFn(claimBehavioristRole);
  const [busy, setBusy] = useState(false);
  const redeemedRef = useRef(false);
  const claimedRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "behaviorist">(rola ?? "owner");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const searchCode = code?.trim();

  // Rejestracja przez Google/Apple: wybraną rolę zapamiętujemy przed przekierowaniem
  // i po powrocie z sesją nadajemy ją na serwerze (tylko dla świeżego konta).
  useEffect(() => {
    if (loading || !user || claimedRef.current) return;
    if (sessionStorage.getItem(PENDING_ROLE_KEY) !== "behaviorist") return;
    claimedRef.current = true;
    sessionStorage.removeItem(PENDING_ROLE_KEY);
    claimBehaviorist({ data: {} })
      .then(() => queryClient.invalidateQueries())
      .catch(() => undefined);
  }, [loading, user, claimBehaviorist, queryClient]);

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


  const oauth = async (provider: "google" | "apple", chosenRole?: "owner" | "behaviorist") => {
    setBusy(true);
    try {
      if (chosenRole === "behaviorist") sessionStorage.setItem(PENDING_ROLE_KEY, "behaviorist");
      else sessionStorage.removeItem(PENDING_ROLE_KEY);
      const redirectTo = searchCode
        ? `${window.location.origin}/auth?code=${encodeURIComponent(searchCode)}`
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
      // redirect handled by useEffect
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
          emailRedirectTo: searchCode
            ? `${window.location.origin}/auth?code=${encodeURIComponent(searchCode)}`
            : window.location.origin,
          data: { display_name: name, role },
        },
      });
      if (error) throw error;
      if (data.session) {
        // redirect handled by useEffect
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
          <h1 className="mt-6 text-4xl">Potwierdź adres e-mail</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Wysłaliśmy link na:
          </p>
          <p className="mt-2 break-words font-semibold text-foreground">{registeredEmail}</p>
          <div className="mt-8 flex items-start gap-3 rounded-lg bg-muted p-5 text-left">
            <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Otwórz link, aby dokończyć rejestrację. Nie widzisz wiadomości? Sprawdź spam.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-4xl">Witaj w Psienniku</h1>

      {searchCode && (
        <div className="mt-6 rounded-lg bg-keylime p-4 text-center text-sm">
          <p className="font-medium text-foreground">Masz zaproszenie</p>
          <p className="mt-1 text-muted-foreground">
            Zaloguj się lub załóż konto, aby z niego skorzystać.
          </p>
        </div>
      )}

      <Card className="mt-8 shadow-none">
        <CardContent className="grid gap-5 p-6">
          <div className="grid gap-2">
            <Button variant="outline" disabled={busy} onClick={() => oauth("google", role)}>
              Kontynuuj z Google
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => oauth("apple", role)}>
              Kontynuuj z Apple
            </Button>

            <LegalNotice />
          </div>

          <div className="flex items-center gap-3 text-xs tracking-wide text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            albo e-mailem
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue={rola ? "register" : "login"}>
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
                <fieldset className="grid gap-2">
                  <legend className="mb-2 text-sm font-medium">Zakładam konto jako</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={role === "owner" ? "default" : "outline"}
                      aria-pressed={role === "owner"}
                      onClick={() => setRole("owner")}
                    >
                      Właściciel psa
                    </Button>
                    <Button
                      type="button"
                      variant={role === "behaviorist" ? "default" : "outline"}
                      aria-pressed={role === "behaviorist"}
                      onClick={() => setRole("behaviorist")}
                    >
                      Behawiorysta
                    </Button>
                  </div>
                </fieldset>
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
                <LegalNotice />
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

function LegalNotice() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      Zakładając konto, akceptujesz{" "}
      <RouterLink to="/regulamin" className="underline">
        Regulamin
      </RouterLink>{" "}
      Psiennika. Informacje o przetwarzaniu danych znajdziesz w{" "}
      <RouterLink to="/prywatnosc" className="underline">
        Polityce prywatności
      </RouterLink>
      .
    </p>
  );
}
