import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";

export type DogAccess = Tables<"dog_access">;
export type DogInvite = Tables<"dog_invites">;

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

/** Osoby mające dostęp do psa wraz z ich nazwami. */
export function useDogAccess(dogId: string) {
  return useQuery({
    queryKey: ["dog-access", dogId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("dog_access")
        .select("*")
        .eq("dog_id", dogId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const ids = rows.map((r) => r.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, display_name, email").in("id", ids)
        : { data: [] as { id: string; display_name: string | null; email: string | null }[] };

      return rows.map((row) => ({
        ...row,
        profile: profiles?.find((p) => p.id === row.user_id) ?? null,
      }));
    },
  });
}

export function useDogInvites(dogId: string) {
  return useQuery({
    queryKey: ["dog-invites", dogId],
    queryFn: async (): Promise<DogInvite[]> => {
      const { data, error } = await supabase
        .from("dog_invites")
        .select("*")
        .eq("dog_id", dogId)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInvite(dogId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (): Promise<DogInvite> => {
      const { data, error } = await supabase
        .from("dog_invites")
        .insert({ dog_id: dogId, code: randomCode(), created_by: user!.id })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dog-invites", dogId] }),
  });
}

export function useRevokeAccess(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase.from("dog_access").delete().eq("id", accessId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dog-access", dogId] }),
  });
}

export function useRedeemInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const { data, error } = await supabase.rpc("redeem_dog_invite", { _code: code });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
