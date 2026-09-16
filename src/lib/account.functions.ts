import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Trwale usuwa konto zalogowanego użytkownika: jego psy (wraz z wpisami i
 * zdjęciami), dostępy, zaproszenia, powiązania i sam profil.
 * Psy, w których jest tylko współwłaścicielem lub behawiorystą, zostają
 * u ich głównego właściciela — usuwany jest wyłącznie dostęp.
 *
 * Konto, baza i pliki w magazynie nie dają się usunąć jedną transakcją, dlatego
 * operacja jest zaprojektowana jako odporna na awarię i bezpieczna do ponowienia:
 * każdy krok jest idempotentny, kroki idą w kolejności od danych zależnych do
 * konta, a komunikat o sukcesie pojawia się dopiero po usunięciu konta w
 * uwierzytelnianiu. Przerwanie w dowolnym miejscu zostawia konto nadal aktywne
 * i pozwala powtórzyć całość.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Krok 0: zamknięcie umowy w rejestrze czynności. Termin usunięcia liczymy od
    // zakończenia umowy i wyłącznie dla dowodów akceptacji — terminy powiadomień
    // pozostają nietknięte (i tak nie mogą zostać wydłużone; pilnuje tego baza).
    const endedAt = new Date();
    const purgeAfter = `${endedAt.getUTCFullYear() + 6}-12-31`;
    const { error: legalError } = await supabaseAdmin
      .from("legal_acceptances")
      .update({ contract_ended_at: endedAt.toISOString(), purge_after: purgeAfter })
      .eq("user_id", userId)
      .eq("event_kind", "acceptance");
    if (legalError) throw new Error(legalError.message);

    // Powiadomienia dostają tylko datę zakończenia umowy — bez zmiany terminu usunięcia.
    const { error: noticeError } = await supabaseAdmin
      .from("legal_acceptances")
      .update({ contract_ended_at: endedAt.toISOString() })
      .eq("user_id", userId)
      .eq("event_kind", "notification");
    if (noticeError) throw new Error(noticeError.message);

    // Psy, których użytkownik jest głównym właścicielem.
    const { data: ownedDogs, error: dogsError } = await supabaseAdmin
      .from("dogs")
      .select("id")
      .eq("owner_id", userId);
    if (dogsError) throw new Error(dogsError.message);

    const dogIds = (ownedDogs ?? []).map((d) => d.id);

    // Zdjęcia psów leżą w katalogach nazwanych identyfikatorem psa.
    // Niepowodzenie przerywa operację — nie zgłaszamy sukcesu, gdy pliki zostały.
    for (const dogId of dogIds) {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from("dog-photos")
        .list(dogId);
      if (listError) throw new Error(`Nie udało się odczytać zdjęć: ${listError.message}`);
      if (files && files.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage
          .from("dog-photos")
          .remove(files.map((f) => `${dogId}/${f.name}`));
        if (removeError) throw new Error(`Nie udało się usunąć zdjęć: ${removeError.message}`);
      }
    }

    if (dogIds.length > 0) {
      // Wpisy, dostępy, zaproszenia i odsłony znikają razem z psem (kaskada),
      // ale kasujemy je jawnie, aby nie zależeć od konfiguracji kluczy obcych.
      for (const step of [
        supabaseAdmin.from("entries").delete().in("dog_id", dogIds),
        supabaseAdmin.from("dog_views").delete().in("dog_id", dogIds),
        supabaseAdmin.from("dog_invites").delete().in("dog_id", dogIds),
        supabaseAdmin.from("dog_access").delete().in("dog_id", dogIds),
      ]) {
        const { error } = await step;
        if (error) throw new Error(error.message);
      }
      const { error } = await supabaseAdmin.from("dogs").delete().in("id", dogIds);
      if (error) throw new Error(error.message);
    }

    // Powiązania użytkownika z cudzymi psami i behawiorystami.
    for (const step of [
      supabaseAdmin.from("dog_access").delete().eq("user_id", userId),
      supabaseAdmin.from("dog_views").delete().eq("user_id", userId),
      supabaseAdmin.from("owner_behaviorists").delete().eq("owner_id", userId),
      supabaseAdmin.from("owner_behaviorists").delete().eq("behaviorist_id", userId),
      supabaseAdmin.from("behaviorist_links").delete().eq("behaviorist_id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ]) {
      const { error } = await step;
      if (error) throw new Error(error.message);
    }

    // Ostatni krok: konto w uwierzytelnianiu. Rejestr czynności zachowuje sam
    // identyfikator konta (account_ref) — powiązanie z kontem zostaje zerwane.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);

    return { deleted: true } as const;
  });

/**
 * Zwraca dane użytkownika do eksportu w postaci czytelnego pliku tekstowego
 * oraz listę ścieżek zdjęć (pobierane osobno przez signed URL-e).
 * Eksport działa na uprawnieniach zalogowanego konta (RLS).
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const supabase = context.supabase;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, email, created_at, terms_version, terms_accepted_at, terms_accepted_method")
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
    const roleByDog = new Map((dogAccess ?? []).map((d) => [d.dog_id, d.role]));

    const { data: dogs, error: dogsError } =
      dogIds.length > 0
        ? await supabase.from("dogs").select("*").in("id", dogIds)
        : { data: [], error: null };
    if (dogsError) throw new Error(dogsError.message);

    const { data: entries, error: entriesError } =
      dogIds.length > 0
        ? await supabase.from("entries").select("*").in("dog_id", dogIds).order("date", { ascending: true })
        : { data: [], error: null };
    if (entriesError) throw new Error(entriesError.message);

    // Komentarze z dyskusji przy wpisach (bez treści komentarzy usuniętych).
    const entryIds = (entries ?? []).map((e) => e.id);
    const { data: comments, error: commentsError } =
      entryIds.length > 0
        ? await supabase
            .from("entry_comments")
            .select("entry_id, author_id, author_role, body, created_at, edited_at, deleted_at")
            .in("entry_id", entryIds)
            .order("created_at", { ascending: true })
        : { data: [], error: null };
    if (commentsError) throw new Error(commentsError.message);

    const commentAuthorIds = [
      ...new Set(
        (comments ?? []).map((c) => c.author_id).filter((v): v is string => typeof v === "string"),
      ),
    ];
    const { data: commentAuthors } =
      commentAuthorIds.length > 0
        ? await supabase.from("profiles").select("id, display_name, email").in("id", commentAuthorIds)
        : { data: [] };
    const authorNameById = new Map(
      (commentAuthors ?? []).map((p) => [p.id, p.display_name || p.email || "bez nazwy"]),
    );

    const photoPaths: string[] = [];
    for (const dog of dogs ?? []) {
      if (dog.photo_url) photoPaths.push(dog.photo_url);
    }

    const ratingLabel = (r: string) =>
      r === "green" ? "Dobrze" : r === "orange" ? "Wyzwanie" : r === "red" ? "Trudno" : r;
    const dash = (v: string | null | undefined) => (v && v.trim() !== "" ? v : "—");

    const lines: string[] = [];
    lines.push("PSIENNIK — kopia Twoich danych");
    lines.push(`Data przygotowania: ${new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}`);
    lines.push("");
    lines.push("KONTO");
    lines.push(`  Nazwa: ${dash(profile.display_name)}`);
    lines.push(`  E-mail: ${dash(profile.email)}`);
    lines.push(`  Konto założone: ${new Date(profile.created_at).toLocaleDateString("pl-PL")}`);
    lines.push(`  Zaakceptowana wersja dokumentów: ${dash(profile.terms_version)}`);
    lines.push(
      `  Data akceptacji: ${profile.terms_accepted_at ? new Date(profile.terms_accepted_at).toLocaleString("pl-PL") : "—"}`,
    );
    lines.push("");

    for (const dog of dogs ?? []) {
      lines.push("".padEnd(60, "="));
      lines.push(`PIES: ${dog.name}`);
      lines.push(`  Twoja rola: ${roleByDog.get(dog.id) === "owner" ? "właściciel" : "behawiorysta"}`);
      lines.push(`  Rasa: ${dash(dog.breed)}   Wiek: ${dash(dog.age)}   Płeć: ${dash(dog.sex)}`);
      lines.push(`  Zdjęcie (osobny plik): ${dash(dog.photo_url)}`);
      lines.push("");
      const dogEntries = (entries ?? []).filter((e) => e.dog_id === dog.id);
      lines.push(`  WPISY (${dogEntries.length}):`);
      if (dogEntries.length === 0) lines.push("    brak wpisów");
      for (const e of dogEntries) {
        lines.push("");
        lines.push(`    ${e.date} — ${e.title}`);
        lines.push(`      Ocena: ${ratingLabel(e.rating)}`);
        lines.push(`      Typy: ${(e.activity_types ?? []).join(", ")}`);
        lines.push(`      Pora dnia: ${(e.times_of_day ?? []).join(", ")}`);
        if (e.description) lines.push(`      Opis: ${e.description}`);
        if (e.behaviorist_comment) lines.push(`      Zalecenie behawiorysty: ${e.behaviorist_comment}`);
        const entryComments = (comments ?? []).filter((c) => c.entry_id === e.id);
        if (entryComments.length > 0) {
          lines.push(`      Dyskusja (${entryComments.length}):`);
          for (const c of entryComments) {
            const author = c.author_id
              ? (authorNameById.get(c.author_id) ?? "Usunięty użytkownik")
              : "Usunięty użytkownik";
            const when = new Date(c.created_at).toLocaleString("pl-PL");
            if (c.deleted_at) {
              lines.push(`        - [komentarz usunięty ${new Date(c.deleted_at).toLocaleString("pl-PL")}]`);
            } else {
              const edited = c.edited_at
                ? ` (edytowany ${new Date(c.edited_at).toLocaleString("pl-PL")})`
                : "";
              lines.push(`        - ${author}, ${when}${edited}: ${c.body}`);
            }
          }
        }
      }
      lines.push("");
    }

    if ((dogs ?? []).length === 0) lines.push("Brak psów powiązanych z Twoim kontem.");

    lines.push("".padEnd(60, "="));
    lines.push("Zdjęcia pobierają się jako osobne pliki w oryginalnych formatach.");

    return {
      fileName: `psiennik-moje-dane-${new Date().toISOString().slice(0, 10)}.txt`,
      text: lines.join("\n"),
      photoPaths,
    } as const;
  });
