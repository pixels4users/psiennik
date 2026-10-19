import { supabase } from "@/integrations/supabase/client";

// Progi aktywności, po których pokazujemy prośbę o wsparcie.
const MIN_ENTRIES = 7;
const MIN_ENTRIES_YOUNG_ACCOUNT = 5;
const YOUNG_ACCOUNT_DAYS = 5;

// Ile dni spokoju po kliknięciu przycisków w modalu.
export const SNOOZE_DAYS_AFTER_SUPPORT = 60;
export const SNOOZE_DAYS_AFTER_LATER = 30;

/**
 * Sprawdza, czy po zapisaniu wydarzenia warto pokazać prośbę o postawienie kawy.
 * Warunek: minął okres wyciszenia ORAZ użytkownik ma co najmniej 7 wpisów
 * (albo 5 wpisów przy koncie starszym niż 5 dni).
 */
export async function checkCoffeePromptEligible(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("coffee_snooze_until, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return false;

  if (
    profile.coffee_snooze_until &&
    new Date(profile.coffee_snooze_until).getTime() > Date.now()
  ) {
    return false;
  }

  // RLS ogranicza zapytanie do psów, do których użytkownik ma dostęp.
  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true });
  const entries = count ?? 0;

  if (entries >= MIN_ENTRIES) return true;
  if (entries >= MIN_ENTRIES_YOUNG_ACCOUNT) {
    const accountAgeDays =
      (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
    return accountAgeDays >= YOUNG_ACCOUNT_DAYS;
  }
  return false;
}

/** Zapisuje w profilu, do kiedy modal ma być wyciszony. */
export async function snoozeCoffeePrompt(days: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({
      coffee_snooze_until: new Date(Date.now() + days * 86_400_000).toISOString(),
    })
    .eq("id", user.id);
}
