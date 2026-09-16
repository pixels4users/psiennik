import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type EntryComment = Tables<"entry_comments"> & {
  /** Nazwa autora z profilu; null gdy konto usunięte. */
  authorName: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Właściciel",
  co_owner: "Współwłaściciel",
  behaviorist: "Behawiorysta",
};

export function commentRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

/** Komentarze jednego wydarzenia, chronologicznie od najstarszego. */
export function useEntryComments(entryId: string | undefined) {
  return useQuery({
    queryKey: ["entry-comments", entryId],
    enabled: !!entryId,
    queryFn: async (): Promise<EntryComment[]> => {
      const { data: comments, error } = await supabase
        .from("entry_comments")
        .select("*")
        .eq("entry_id", entryId!)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });
      if (error) throw error;

      const authorIds = [
        ...new Set(
          (comments ?? [])
            .map((c) => c.author_id)
            .filter((id): id is string => typeof id === "string"),
        ),
      ];
      const { data: profiles, error: profilesError } =
        authorIds.length > 0
          ? await supabase.from("profiles").select("id, display_name, email").in("id", authorIds)
          : { data: [], error: null };
      if (profilesError) throw profilesError;

      const nameById = new Map(
        (profiles ?? []).map((p) => [p.id, p.display_name || p.email || null]),
      );
      return (comments ?? []).map((c) => ({
        ...c,
        authorName: c.author_id ? (nameById.get(c.author_id) ?? null) : null,
      }));
    },
  });
}

/**
 * Liczba nieusuniętych komentarzy dla wszystkich wpisów psa — jedno zapytanie.
 * Zwraca mapę entryId → liczba.
 */
export function useEntryCommentCounts(entryIds: string[]) {
  const key = [...entryIds].sort().join(",");
  return useQuery({
    queryKey: ["entry-comment-counts", key],
    enabled: entryIds.length > 0,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase
        .from("entry_comments")
        .select("entry_id")
        .in("entry_id", entryIds)
        .is("deleted_at", null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.entry_id, (counts.get(row.entry_id) ?? 0) + 1);
      }
      return counts;
    },
  });
}

function useInvalidateComments() {
  const queryClient = useQueryClient();
  return (entryId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["entry-comments", entryId] }),
      queryClient.invalidateQueries({ queryKey: ["entry-comment-counts"] }),
    ]);
}

export function useAddComment() {
  const invalidate = useInvalidateComments();
  return useMutation({
    mutationFn: async ({ entryId, body }: { entryId: string; body: string }) => {
      // author_role i author_id nadpisuje trigger w bazie na podstawie sesji.
      const { error } = await supabase
        .from("entry_comments")
        .insert({ entry_id: entryId, body, author_role: "owner" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidate(vars.entryId),
  });
}

export function useEditComment() {
  const invalidate = useInvalidateComments();
  return useMutation({
    mutationFn: async ({ id, entryId, body }: { id: string; entryId: string; body: string }) => {
      const { error } = await supabase.from("entry_comments").update({ body }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidate(vars.entryId),
  });
}

/** Miękkie usunięcie — baza czyści treść i ustawia własny znacznik czasu. */
export function useDeleteComment() {
  const invalidate = useInvalidateComments();
  return useMutation({
    mutationFn: async ({ id, entryId }: { id: string; entryId: string }) => {
      const { error } = await supabase
        .from("entry_comments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidate(vars.entryId),
  });
}
