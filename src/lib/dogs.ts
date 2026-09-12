import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Dog = Tables<"dogs">;
export type Entry = Tables<"entries">;

export const ACTIVITY_TYPES = [
  { value: "spacer", label: "Spacer" },
  { value: "trening", label: "Trening / ćwiczenie" },
  { value: "socjalizacja", label: "Socjalizacja" },
  { value: "goscie", label: "Goście / wizyta" },
  { value: "wypoczynek", label: "Wypoczynek" },
  { value: "inne", label: "Inne" },
] as const;

export const TIMES_OF_DAY = [
  { value: "rano", label: "Rano" },
  { value: "poludnie", label: "Południe" },
  { value: "wieczor", label: "Wieczór" },
] as const;

export const RATINGS = [
  { value: "green", label: "Dobrze" },
  { value: "amber", label: "Tak sobie" },
  { value: "red", label: "Trudne" },
] as const;

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string | null,
): string {
  return list.find((item) => item.value === value)?.label ?? value ?? "—";
}

export function useDogs() {
  return useQuery({
    queryKey: ["dogs"],
    queryFn: async (): Promise<Dog[]> => {
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useDog(id: string) {
  return useQuery({
    queryKey: ["dogs", id],
    queryFn: async (): Promise<Dog> => {
      const { data, error } = await supabase.from("dogs").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useEntries(dogId: string) {
  return useQuery({
    queryKey: ["entries", dogId],
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("dog_id", dogId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export async function uploadDogPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("dog-photos").upload(path, file);
  if (error) throw error;
  return path;
}

export function useDogPhotoUrl(path: string | null) {
  return useQuery({
    queryKey: ["dog-photo", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 45,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage
        .from("dog-photos")
        .createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
