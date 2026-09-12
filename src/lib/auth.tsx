import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
  /** Czy może dodawać komentarze jako aktywny behawiorysta. */
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
  const queryClient = useQueryClient();

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

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
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

export function useRole() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["role", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Role | null> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as Role | undefined) ?? null;
    },
  });
  return { role: query.data ?? null, isLoading: query.isLoading };
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
          supabase.from("dog_access").select("*").eq("dog_id", dogId),
        ]);
      if (dogError) throw dogError;
      if (accessError) throw accessError;

      const myAccess = accessRows?.find((row) => row.user_id === user!.id);
      const behaviorists = accessRows?.filter((row) => row.role === "behaviorist") ?? [];
      const hasActiveBehaviorist = behaviorists.some((row) => row.process_status === "active");
      const hasBehaviorist = behaviorists.length > 0;
      const allCompleted = hasBehaviorist && !hasActiveBehaviorist;

      if (!myAccess) {
        return {
          role: null,
          processStatus: null,
          canManage: false,
          canEditEntries: false,
          canComment: false,
          isReadOnly: false,
          isPrimaryOwner: false,
        };
      }

      if (myAccess.role === "owner") {
        const isPrimaryOwner = user!.id === dog.owner_id;
        const canManage = true;
        return {
          role: isPrimaryOwner ? "owner" : "coowner",
          processStatus: null,
          canManage,
          canEditEntries: canManage && !allCompleted,
          canComment: false,
          isReadOnly: canManage && allCompleted,
          isPrimaryOwner,
        };
      }

      return {
        role: "behaviorist",
        processStatus: myAccess.process_status,
        canManage: false,
        canEditEntries: false,
        canComment: myAccess.process_status === "active",
        isReadOnly: false,
        isPrimaryOwner: false,
      };
    },
  });
}
