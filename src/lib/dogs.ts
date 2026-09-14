import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Bone,
  CakeSlice,
  CarFront,
  Dog,
  Dumbbell,
  Footprints,
  Shapes,
  Sparkles,
  Umbrella,
} from "lucide-react";
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
  { value: "podroz", label: "Podróż" },
  { value: "jedzenie", label: "Jedzenie" },
  { value: "czystosc", label: "Czystość" },
  { value: "inne", label: "Inne" },
] as const;

/** Ikony dla każdego typu aktywności — używane w kartach i formularzu. */
export const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  spacer: Footprints,
  trening: Dumbbell,
  socjalizacja: Dog,
  goscie: CakeSlice,
  wypoczynek: Umbrella,
  podroz: CarFront,
  jedzenie: Bone,
  czystosc: Sparkles,
  inne: Shapes,
};

export const TIMES_OF_DAY = [
  { value: "rano", label: "Rano" },
  { value: "poludnie", label: "Południe" },
  { value: "wieczor", label: "Wieczór" },
] as const;

export const RATINGS = [
  { value: "green", label: "Dobrze" },
  { value: "amber", label: "Wyzwanie" },
  { value: "red", label: "Trudno" },
] as const;

export function labelFor(
  list: readonly { value: string; label: string }[],
  value: string | null,
): string {
  return list.find((item) => item.value === value)?.label ?? value ?? "—";
}

/** Etykiety dla listy wartości, np. "Spacer, Socjalizacja". */
export function labelsFor(
  list: readonly { value: string; label: string }[],
  values: string[] | null | undefined,
): string {
  if (!values || values.length === 0) return "—";
  return values.map((value) => labelFor(list, value)).join(", ");
}

/** Typy aktywności wpisu (z fallbackiem na starą pojedynczą kolumnę). */
export function entryActivities(entry: Entry): string[] {
  const list = entry.activity_types ?? [];
  return list.length > 0 ? list : [entry.activity_type];
}

/** Pory dnia wpisu (z fallbackiem na starą pojedynczą kolumnę). */
export function entryTimes(entry: Entry): string[] {
  const list = entry.times_of_day ?? [];
  return list.length > 0 ? list : [entry.time_of_day];
}

/** "Cały dzień" gdy zaznaczono wszystkie pory, inaczej lista etykiet. */
export function timesLabel(values: string[]): string {
  if (values.length === TIMES_OF_DAY.length) return "Cały dzień";
  return labelsFor(TIMES_OF_DAY, values);
}

export type DogWithAccess = Dog & {
  dog_access: { process_status: string; role: string }[] | null;
};

export function useDogs() {
  return useQuery({
    queryKey: ["dogs"],
    queryFn: async (): Promise<DogWithAccess[]> => {
      const { data, error } = await supabase
        .from("dogs")
        .select("*, dog_access(process_status, role)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
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

export type RecentEntry = Entry & {
  dogs: { name: string; photo_url: string | null } | null;
};

/** Najnowsze wpisy ze wszystkich psów, do których użytkownik ma dostęp. */
export function useRecentEntries(limit = 5) {
  return useQuery({
    queryKey: ["recent-entries", limit],
    queryFn: async (): Promise<RecentEntry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("*, dogs(name, photo_url)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as RecentEntry[];
    },
  });
}

export async function uploadDogPhoto(file: File, dogId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${dogId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("dog-photos").upload(path, file);
  if (error) throw error;
  return path;
}

export async function deleteDogPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from("dog-photos").remove([path]);
  if (error) throw error;
}

export function useDogPhotoUrl(path: string | null) {
  return useQuery({
    queryKey: ["dog-photo", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 45,
    queryFn: async (): Promise<string> => {
      if (!path) throw new Error("Brak ścieżki zdjęcia");
      const { data, error } = await supabase.storage
        .from("dog-photos")
        .createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
