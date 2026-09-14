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
