import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Trwale usuwa konto zalogowanego użytkownika: jego psy (wraz z wpisami i
 * zdjęciami), dostępy, zaproszenia, powiązania i sam profil.
 * Psy, w których jest tylko współwłaścicielem lub behawiorystą, zostają
 * u ich głównego właściciela — usuwany jest wyłącznie dostęp.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Psy, których użytkownik jest głównym właścicielem.
    const { data: ownedDogs, error: dogsError } = await supabaseAdmin
      .from("dogs")
      .select("id")
      .eq("owner_id", userId);
    if (dogsError) throw new Error(dogsError.message);

    const dogIds = (ownedDogs ?? []).map((d) => d.id);

    // Zdjęcia psów leżą w katalogach nazwanych identyfikatorem psa.
    for (const dogId of dogIds) {
      const { data: files } = await supabaseAdmin.storage.from("dog-photos").list(dogId);
      if (files && files.length > 0) {
        await supabaseAdmin.storage
          .from("dog-photos")
          .remove(files.map((f) => `${dogId}/${f.name}`));
      }
    }

    if (dogIds.length > 0) {
      // Wpisy, dostępy, zaproszenia i odsłony znikają razem z psem (kaskada),
      // ale kasujemy je jawnie, aby nie zależeć od konfiguracji kluczy obcych.
      await supabaseAdmin.from("entries").delete().in("dog_id", dogIds);
      await supabaseAdmin.from("dog_views").delete().in("dog_id", dogIds);
      await supabaseAdmin.from("dog_invites").delete().in("dog_id", dogIds);
      await supabaseAdmin.from("dog_access").delete().in("dog_id", dogIds);
      const { error } = await supabaseAdmin.from("dogs").delete().in("id", dogIds);
      if (error) throw new Error(error.message);
    }

    // Powiązania użytkownika z cudzymi psami i behawiorystami.
    await supabaseAdmin.from("dog_access").delete().eq("user_id", userId);
    await supabaseAdmin.from("dog_views").delete().eq("user_id", userId);
    await supabaseAdmin.from("owner_behaviorists").delete().eq("owner_id", userId);
    await supabaseAdmin.from("owner_behaviorists").delete().eq("behaviorist_id", userId);
    await supabaseAdmin.from("behaviorist_links").delete().eq("behaviorist_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);

    return { deleted: true } as const;
  });

/**
 * Zwraca dane użytkownika do eksportu: psy, wpisy, zalecenia i listę zdjęć.
 * Pliki pobierane są osobno przez signed URL-e; tu zwracamy metadane i tekstową
 * reprezentację danych.
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const supabase = context.supabase;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, email, role, created_at, terms_version, terms_accepted_at, terms_accepted_method")
      .eq("id", userId)
      .single();
    if (profileError) throw new Error(profileError.message);

    // Psy, do których użytkownik ma dostęp (własne + udostępnione).
    const { data: dogAccess, error: accessError } = await supabase
      .from("dog_access")
      .select("dog_id, role")
      .eq("user_id", userId);
    if (accessError) throw new Error(accessError.message);

    const dogIds = (dogAccess ?? []).map((d) => d.dog_id);

    const { data: dogs, error: dogsError } =
      dogIds.length > 0
        ? await supabase.from("dogs").select("*").in("id", dogIds)
        : { data: [], error: null };
    if (dogsError) throw new Error(dogsError.message);

    const { data: entries, error: entriesError } =
      dogIds.length > 0
        ? await supabase.from("entries").select("*").in("dog_id", dogIds)
        : { data: [], error: null };
    if (entriesError) throw new Error(entriesError.message);

    // Lista zdjęć do pobrania osobno.
    const photoPaths: string[] = [];
    for (const dog of dogs ?? []) {
      if (dog.photo_url) photoPaths.push(dog.photo_url);
    }

    return {
      exportedAt: new Date().toISOString(),
      profile,
      dogs: dogs ?? [],
      entries: entries ?? [],
      photoPaths,
    } as const;
  });
