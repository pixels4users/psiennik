import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type OAuthResult = {
  data: {
    client?: { name?: string; uri?: string } | null;
    redirect_uri?: string;
    redirect_url?: string;
    redirect_to?: string;
    scope?: string;
    user?: { email?: string } | null;
  } | null;
  error: { message: string } | null;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const SCOPE_LABELS: Record<string, string> = {
  openid: "Potwierdzenie Twojej tożsamości",
  email: "Twój adres e-mail",
  profile: "Twój podstawowy profil",
};

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Połącz aplikację — Psiennik" },
      { name: "description", content: "Zatwierdź dostęp zewnętrznej aplikacji do Twojego konta Psiennik." },
      { property: "og:title", content: "Połącz aplikację — Psiennik" },
      { property: "og:description", content: "Zatwierdź dostęp zewnętrznej aplikacji do Twojego konta Psiennik." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Brak identyfikatora autoryzacji.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.searchStr).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    const { data: u } = await supabase.auth.getUser();
    return { details: data, email: u.user?.email ?? null };
  },
  component: Consent,
  pendingComponent: () => (
    <main className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-muted-foreground">
      Wczytywanie…
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-3xl">Nie udało się wczytać prośby o dostęp</h1>
      <p className="mt-3 text-muted-foreground">
        Prośba mogła wygasnąć. Wróć do aplikacji, z której się łączysz, i spróbuj ponownie.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : String(error)}
      </p>
    </main>
  ),
});

function Consent() {
  const { details, email } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "Zewnętrzna aplikacja";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);
  const redirectUri = details?.redirect_uri ?? details?.client?.uri;

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorization_id)
        : await oauth().denyAuthorization(authorization_id);
      if (error) throw new Error(error.message);
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) throw new Error("Serwer autoryzacji nie zwrócił adresu powrotu.");
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(
        `${approve ? "Nie udało się zatwierdzić" : "Nie udało się anulować"}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <Card className="shadow-none">
        <CardContent className="grid gap-5 p-6 sm:p-8">
          <h1 className="text-3xl leading-tight">Połącz {clientName} z Psiennikiem</h1>
          <p className="text-muted-foreground">
            {clientName} będzie mógł odczytywać Twoje psy, wpisy z dziennika, zalecenia i
            komentarze — tak jakbyś to był(a) Ty.
          </p>
          {email && (
            <p className="text-sm">
              Zalogowano jako <span className="font-medium">{email}</span>
            </p>
          )}
          {redirectUri && (
            <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
              Adres powrotu: {redirectUri}
            </p>
          )}
          {scopes.length > 0 && (
            <ul className="grid gap-1 text-sm">
              {scopes.map((s) => (
                <li key={s}>• {SCOPE_LABELS[s] ?? `Dodatkowe uprawnienie: ${s}`}</li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            To nie omija uprawnień Psiennika — aplikacja zobaczy tylko to, do czego masz dostęp.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => decide(true)}>
              Zezwól
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
              Anuluj połączenie
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
