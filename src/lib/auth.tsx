import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";
import { issueDocumentToken, recordLegalAcceptance } from "@/lib/legal.functions";

export type Role = "owner" | "behaviorist";
export type DogRole = "owner" | "coowner" | "behaviorist";
export type Profile = Tables<"profiles">;

export type DogRoleResult = {
  /** Rola użytkownika względem konkretnego psa. */
  role: DogRole | null;
  /** Status procesu dla behawiorysty (aktywny/zakończony/oczekujący). */
  processStatus: string | null;
  /** Czy może zarządzać psem (właściciel/współwłaściciel). */
  canManage: boolean;
  /** Czy może dodawać/edytować wpisy (właściciel/współwłaściciel, gdy proces nie zakończony). */
  canEditEntries: boolean;
  /** Czy może dodawać zalecenia jako aktywny behawiorysta. */
  canComment: boolean;
  /** Czy dziennik jest w trybie tylko do odczytu dla zarządzających. */
  isReadOnly: boolean;
  /** Czy użytkownik jest głównym właścicielem psa. */
  isPrimaryOwner: boolean;
};

const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  loading: boolean;
}>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVersion, setPendingVersion] = useState<{
    kind: "terms" | "privacy";
    version: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const recordAcceptanceFn = useServerFn(recordLegalAcceptance);
  const issueTokenFn = useServerFn(issueDocumentToken);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  // Zapis akceptacji regulaminu/polityki: przy pierwszym zalogowaniu uzupełniamy
  // wersję, datę i sposób (rejestracja e-mailem albo logowanie Google/Apple).
  // Wymagamy też akceptacji, gdy wersja dokumentu jest nowsza niż zapisana w profilu.
  const userId = session?.user?.id;
  const provider = session?.user?.app_metadata?.["provider"] as string | undefined;
  const method = provider === "google" ? "google" : provider === "apple" ? "apple" : "email";

  /**
   * Zapis czynności: najpierw prosimy serwer o podpisany token dla dokumentu,
   * który za chwilę pokazujemy/pokazaliśmy, a dopiero potem zapisujemy czynność.
   * Serwer bierze wersję z tokenu — nie z żadnego pola przesłanego przez przeglądarkę.
   * Gdy w międzyczasie opublikowano nowszą wersję, zapis zostaje odrzucony i
   * użytkownik dostaje ekran z nową treścią.
   */
  const recordWithToken = async (
    kind: "terms" | "privacy",
    how: "email" | "google" | "apple" | "change_screen",
  ): Promise<{ ok: boolean }> => {
    const issued = await issueTokenFn({ data: { documentKind: kind } });
    const result = await recordAcceptanceFn({
      data: { token: issued.token, eventKind: "acceptance", method: how },
    });
    if (!result.ok) {
      setPendingVersion({ kind, version: result.currentVersion });
      return { ok: false };
    }
    return { ok: true };
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("profiles").select("terms_version").eq("id", userId).maybeSingle();
      if (cancelled || !data) return;

      // Brak zapisanej wersji = pierwsze logowanie/rejestracja — zapisujemy bez ekranu blokującego.
      if (!data.terms_version) {
        const terms = await recordWithToken("terms", method);
        const privacy = await recordWithToken("privacy", method);
        if (cancelled || !terms.ok || !privacy.ok) return;
        await supabase
          .from("profiles")
          .update({
            terms_version: TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
            terms_accepted_method: method,
          })
          .eq("id", userId);
        return;
      }

      // Nowsza wersja wymaga wyraźnej akceptacji — blokujemy interfejs.
      if (data.terms_version !== TERMS_VERSION) {
        setPendingVersion({ kind: "terms", version: TERMS_VERSION });
      } else if (data.terms_version !== PRIVACY_VERSION) {
        setPendingVersion({ kind: "privacy", version: PRIVACY_VERSION });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, method]);

  const acceptPending = async () => {
    if (!userId || !pendingVersion) return;
    const result = await recordWithToken(pendingVersion.kind, "change_screen");
    // Wersja zmieniła się w trakcie — ekran pokaże nową treść, nic nie zapisujemy.
    if (!result.ok) return;
    await supabase
      .from("profiles")
      .update({
        terms_version: TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
        terms_accepted_method: "change_screen",
      })
      .eq("id", userId);
    setPendingVersion(null);
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  if (!loading && pendingVersion && userId) {
    return <LegalChangeScreen kind={pendingVersion.kind} onAccept={acceptPending} />;
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function LegalChangeScreen({ kind, onAccept }: { kind: "terms" | "privacy"; onAccept: () => void }) {
  const title = kind === "terms" ? "Nowa wersja regulaminu" : "Nowa wersja polityki prywatności";
  const link = kind === "terms" ? "/regulamin" : "/prywatnosc";
  const label = kind === "terms" ? "regulamin" : "politykę prywatności";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="mx-auto w-full max-w-lg shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="text-muted-foreground">
            Przygotowaliśmy nową wersję {label}. Aby dalej korzystać z Psiennika, zapoznaj się z
            dokumentem i zaakceptuj zmiany.
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary underline"
          >
            Przeczytaj pełny dokument
          </a>
          <Button onClick={onAccept}>Akceptuję i kontynuuję</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Szczegółowa rola i uprawnienia użytkownika dla konkretnego psa. */
export function useDogRole(dogId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dog-role", dogId, user?.id],
    enabled: !!user && !!dogId,
    queryFn: async (): Promise<DogRoleResult> => {
      const [{ data: dog, error: dogError }, { data: accessRows, error: accessError }] =
        await Promise.all([
          supabase.from("dogs").select("owner_id").eq("id", dogId).single(),
          supabase.from("dog_access").select("role, process_status").eq("dog_id", dogId).eq("user_id", user!.id),
        ]);
      if (dogError) throw dogError;
      if (accessError) throw accessError;

      const isOwner = dog.owner_id === user!.id;
      const access = accessRows?.[0];
      const role: DogRole | null = isOwner ? "owner" : access ? (access.role as DogRole) : null;
      const processStatus = access?.process_status ?? null;
      const canManage = role === "owner" || role === "coowner";
      const isReadOnly = processStatus === "completed";
      const canEditEntries = canManage && !isReadOnly;
      const canComment = role === "behaviorist" && processStatus === "active";

      return {
        role,
        processStatus,
        canManage,
        canEditEntries,
        canComment,
        isReadOnly,
        isPrimaryOwner: isOwner,
      };
    },
  });
}
