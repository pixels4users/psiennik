import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";

export type DogAccess = Tables<"dog_access">;
export type DogInvite = Tables<"dog_invites">;
export type BehavioristLink = Tables<"behaviorist_links">;
export type OwnerBehaviorist = Tables<"owner_behaviorists">;

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export type AccessWithProfile = DogAccess & {
  profile: { id: string; display_name: string | null; email: string | null } | null;
};

/** Osoby mające dostęp do psa wraz z ich nazwami. */
export function useDogAccess(dogId: string) {
  return useQuery({
    queryKey: ["dog-access", dogId],
    queryFn: async (): Promise<AccessWithProfile[]> => {
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

/** Aktywne zaproszenia dla konkretnego psa. */
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

/** Tworzy nowe zaproszenie dla psa (rola: owner lub behaviorist). */
export function useCreateInvite(dogId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (role: "owner" | "behaviorist"): Promise<DogInvite> => {
      const { data, error } = await supabase
        .from("dog_invites")
        .insert({ dog_id: dogId, code: randomCode(), created_by: user!.id, role })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dog-invites", dogId] }),
  });
}

/** Usuwa dostęp do psa (lub wycofuje zaproszenie). */
export function useRevokeAccess(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase.from("dog_access").delete().eq("id", accessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dog-access", dogId] });
      queryClient.invalidateQueries({ queryKey: ["dog-role", dogId] });
    },
  });
}

export type RedeemResult = {
  dogId: string | null;
  behavioristId: string | null;
};

/** Używa kodu zaproszenia lub kodu behawiorysty. */
export function useRedeemInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<RedeemResult> => {
      const { data, error } = await supabase.rpc("redeem_dog_invite", { _code: code });
      if (error) throw error;
      const result = data as { dog_id: string | null; behaviorist_id: string | null } | null;
      if (!result?.dog_id && !result?.behaviorist_id) {
        throw new Error("Nie udało się użyć kodu. Spróbuj ponownie.");
      }
      return { dogId: result?.dog_id ?? null, behavioristId: result?.behaviorist_id ?? null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      queryClient.invalidateQueries({ queryKey: ["dog-access"] });
      queryClient.invalidateQueries({ queryKey: ["owner-behaviorists"] });
      queryClient.invalidateQueries({ queryKey: ["behaviorist-owners"] });
      queryClient.invalidateQueries({ queryKey: ["behaviorist-link"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-limits"] });
      queryClient.invalidateQueries({ queryKey: ["dog-role"] });
      queryClient.invalidateQueries({ queryKey: ["is-owner"] });
      queryClient.invalidateQueries({ queryKey: ["is-behaviorist"] });
    },
  });
}

/** Zamyka proces terapeutyczny behawiorysty dla danego psa. */
export function useCompleteProcess(dogId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Musisz być zalogowany");
      const { error } = await supabase.rpc("complete_behavioral_process", {
        p_dog_id: dogId,
        p_behaviorist_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dog-access", dogId] });
      queryClient.invalidateQueries({ queryKey: ["dog-role", dogId] });
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-limits"] });
    },
  });
}

/** Kod zapraszający zalogowanego behawiorysty. */
export function useBehavioristLink() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["behaviorist-link", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BehavioristLink | null> => {
      const { data, error } = await supabase
        .from("behaviorist_links")
        .select("*")
        .eq("behaviorist_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Tworzy lub odnawia kod zapraszający behawiorysty. */
export function useCreateBehavioristLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (): Promise<BehavioristLink> => {
      if (!user) throw new Error("Musisz być zalogowany");
      const code = randomCode();
      const { data, error } = await supabase
        .from("behaviorist_links")
        .upsert({ behaviorist_id: user.id, invite_code: code, is_active: true })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behaviorist-link"] });
    },
  });
}

export type OwnerBehavioristWithProfile = OwnerBehaviorist & {
  profile: { id: string; display_name: string | null; email: string | null } | null;
  link: { invite_code: string; is_active: boolean } | null;
};

async function readCollaborationProfiles(ids: string[]) {
  // Keep the same profile visibility rules as the dog page; no extra RPC is required.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", ids);
  if (error) throw error;
  return data;
}

/** Lista behawiorystów powiązanych z właścicielem. */
export function useOwnerBehaviorists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-behaviorists", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<OwnerBehavioristWithProfile[]> => {
      const { data: rows, error } = await supabase
        .from("owner_behaviorists")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const behavioristIds = rows.map((r) => r.behaviorist_id);
      const [profiles, { data: links }] = await Promise.all([
        behavioristIds.length ? readCollaborationProfiles(behavioristIds) : [],
        behavioristIds.length
          ? supabase
              .from("behaviorist_links")
              .select("behaviorist_id, invite_code, is_active")
              .in("behaviorist_id", behavioristIds)
          : { data: [] as { behaviorist_id: string; invite_code: string; is_active: boolean }[] },
      ]);

      return rows.map((row) => ({
        ...row,
        profile: profiles?.find((p) => p.id === row.behaviorist_id) ?? null,
        link: links?.find((l) => l.behaviorist_id === row.behaviorist_id) ?? null,
      }));
    },
  });
}

/** Lista właścicieli powiązanych z behawiorystą. */
export function useBehavioristOwners() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["behaviorist-owners", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<OwnerBehavioristWithProfile[]> => {
      const { data: rows, error } = await supabase
        .from("owner_behaviorists")
        .select("*")
        .eq("behaviorist_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ownerIds = rows.map((r) => r.owner_id);
      const [profiles, { data: links }] = await Promise.all([
        ownerIds.length ? readCollaborationProfiles(ownerIds) : [],
        ownerIds.length
          ? supabase
              .from("behaviorist_links")
              .select("behaviorist_id, invite_code, is_active")
              .in("behaviorist_id", [user!.id])
          : { data: [] as { behaviorist_id: string; invite_code: string; is_active: boolean }[] },
      ]);

      return rows.map((row) => ({
        ...row,
        profile: profiles?.find((p) => p.id === row.owner_id) ?? null,
        link: links?.find((l) => l.behaviorist_id === user!.id) ?? null,
      }));
    },
  });
}

/** Usuwa powiązanie właściciel–behawiorysta. */
export function useRemoveOwnerBehaviorist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (otherId: string) => {
      if (!user) throw new Error("Musisz być zalogowany");
      const { error } = await supabase
        .from("owner_behaviorists")
        .delete()
        .or(`owner_id.eq.${user.id},behaviorist_id.eq.${user.id}`)
        .or(`owner_id.eq.${otherId},behaviorist_id.eq.${otherId}`);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-behaviorists"] });
      queryClient.invalidateQueries({ queryKey: ["behaviorist-owners"] });
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-limits"] });
    },
  });
}

/** Czy użytkownik ma rolę właściciela (lub współwłaściciela) w jakimkolwiek psie. */
export function useIsOwner() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-owner", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from("dog_access")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("role", "owner");
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });
}

/** Czy konto ma rolę behawiorysty (z profilu konta; starsze konta rozpoznajemy po dostępach). */
export function useIsBehaviorist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-behaviorist", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      if ((data ?? []).some((r) => r.role === "behaviorist")) return true;

      // Konta założone przed wyborem roli: rozpoznajemy po opiece nad psem.
      const { count, error: accessError } = await supabase
        .from("dog_access")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("role", "behaviorist");
      if (accessError) throw accessError;
      return (count ?? 0) > 0;
    },
  });
}

/** Limity aktywnych procesów dla behawiorysty. */
export function useSubscriptionLimits() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: accessRows } = useQuery({
    queryKey: ["behaviorist-access", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DogAccess[]> => {
      const { data, error } = await supabase
        .from("dog_access")
        .select("*")
        .eq("user_id", user!.id)
        .eq("role", "behaviorist");
      if (error) throw error;
      return data ?? [];
    },
  });

  const active = accessRows?.filter((row) => row.process_status === "active").length ?? 0;
  const pending = accessRows?.filter((row) => row.process_status === "pending").length ?? 0;
  const max = profile?.max_active_dogs ?? 2;

  return { active, pending, max, atLimit: active >= max };
}

function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Tables<"profiles"> | null> => {
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
