import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsBehaviorist } from "@/lib/access";

export type DogNews = {
  dogId: string;
  dogName: string;
  count: number;
};

/** Nowe wpisy (dla behawiorysty) lub nowe zalecenia (dla właściciela) od ostatniej wizyty. */
export function useNews() {
  const { user } = useAuth();
  const { data: isBehaviorist } = useIsBehaviorist();

  return useQuery({
    queryKey: ["news", user?.id, isBehaviorist],
    enabled: !!user && isBehaviorist !== undefined,
    queryFn: async (): Promise<DogNews[]> => {
      const [{ data: dogs }, { data: entries }, { data: views }] = await Promise.all([
        supabase.from("dogs").select("id, name"),
        supabase.from("entries").select("id, dog_id, created_at, commented_at"),
        supabase.from("dog_views").select("dog_id, last_seen_at"),
      ]);

      const seen = new Map((views ?? []).map((v) => [v.dog_id, v.last_seen_at]));

      return (dogs ?? [])
        .map((dog) => {
          const since = seen.get(dog.id);
          const count = (entries ?? []).filter((entry) => {
            if (entry.dog_id !== dog.id) return false;
            const stamp = isBehaviorist ? entry.created_at : entry.commented_at;
            if (!stamp) return false;
            return !since || stamp > since;
          }).length;
          return { dogId: dog.id, dogName: dog.name, count };
        })
        .filter((item) => item.count > 0);
    },
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
