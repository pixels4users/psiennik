import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type NotificationKind =
  | "entry"
  | "comment"
  | "recommendation"
  | "access_granted"
  | "access_revoked"
  | "process_completed"
  | "process_resumed";

export type AppNotification = {
  id: string;
  dog_id: string | null;
  entry_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
};

/** Ostatnie powiadomienia zalogowanej osoby (najnowsze pierwsze). */
export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, dog_id, entry_id, kind, title, body, created_at, read_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Oznacza jedno powiadomienie jako przeczytane. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/** Oznacza wszystkie powiadomienia jako przeczytane. */
export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/** Zapisuje moment ostatniego otwarcia dziennika psa. */
export function useMarkDogSeen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dogId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("dog_views")
        .upsert(
          { dog_id: dogId, user_id: user.id, last_seen_at: new Date().toISOString() },
          { onConflict: "dog_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });
}

/** Czy pozycja jest nowa względem ostatniej wizyty użytkownika w dzienniku psa. */
export function useLastSeen(dogId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dog-view", dogId, user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("dog_views")
        .select("last_seen_at")
        .eq("dog_id", dogId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.last_seen_at ?? null;
    },
  });
}
