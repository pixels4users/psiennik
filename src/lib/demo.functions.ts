import { createServerFn } from "@tanstack/react-start";

export const DEMO_OWNER_EMAIL = "demo.wlasciciel@psiennik.test";
export const DEMO_BEHAVIORIST_EMAIL = "demo.behawiorysta@psiennik.test";
export const DEMO_PASSWORD = "DemoPsiennik123!";

/**
 * Tworzy (jeśli trzeba) konta demo wraz z przykładowym psem, wpisami
 * i nadanym dostępem behawiorystki. Używane tylko przez przyciski demo
 * na stronie logowania w podglądzie deweloperskim.
 */
export const ensureDemoAccounts = createServerFn({ method: "POST" }).handler(async () => {
  // Konta demo istnieją wyłącznie na potrzeby podglądu deweloperskiego —
  // endpoint używa klucza serwisowego, więc w produkcji jest całkowicie wyłączony.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Konta demo są dostępne tylko w środowisku deweloperskim.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  async function ensureUser(email: string, role: "owner" | "behaviorist", name: string) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users.find((u) => u.email === email);
    if (existing) return existing.id;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { role, display_name: name },
    });
    if (error || !data.user) throw new Error(error?.message ?? "Nie udało się utworzyć konta demo");
    return data.user.id;
  }

  const ownerId = await ensureUser(DEMO_OWNER_EMAIL, "owner", "Demo Właściciel");
  const behavioristId = await ensureUser(DEMO_BEHAVIORIST_EMAIL, "behaviorist", "Demo Behawiorystka");

  const { data: dogs } = await supabaseAdmin
    .from("dogs")
    .select("id")
    .eq("owner_id", ownerId)
    .limit(1);

  let dogId = dogs?.[0]?.id;

  if (!dogId) {
    const { data: dog, error } = await supabaseAdmin
      .from("dogs")
      .insert({ name: "Lucy", age: "3 lata", breed: "Kundelek", sex: "suka", owner_id: ownerId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    dogId = dog.id;

    const today = new Date();
    const day = (offset: number) =>
      new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10);

    await supabaseAdmin.from("entries").insert([
      {
        dog_id: dogId,
        date: day(0),
        title: "Spacer po osiedlu",
        activity_type: "spacer",
        time_of_day: "rano",
        description: "Brak zachowań problemowych, spokojne mijanie rowerzystów.",
        rating: "green",
      },
      {
        dog_id: dogId,
        date: day(1),
        title: "Ćwiczenie z miską",
        activity_type: "trening",
        time_of_day: "poludnie",
        description: "Warczenie przy podchodzeniu do miski.",
        rating: "red",
        behaviorist_comment: "Ćwiczymy wymianę na lepszy przysmak, nie zabieramy miski.",
        commented_at: new Date().toISOString(),
      },
      {
        dog_id: dogId,
        date: day(2),
        title: "Goście w domu",
        activity_type: "goscie",
        time_of_day: "wieczor",
        description: "Podekscytowanie przy wejściu, szybko się uspokoiła.",
        rating: "amber",
      },
    ]);
  }

  await supabaseAdmin
    .from("dog_access")
    .upsert(
      { dog_id: dogId, user_id: behavioristId, role: "behaviorist", process_status: "active" },
      { onConflict: "dog_id,user_id" },
    );

  await supabaseAdmin
    .from("owner_behaviorists")
    .upsert(
      { owner_id: ownerId, behaviorist_id: behavioristId, process_status: "active" },
      { onConflict: "owner_id,behaviorist_id" },
    );

  await supabaseAdmin
    .from("behaviorist_links")
    .upsert(
      { behaviorist_id: behavioristId, invite_code: "DEMO12", is_active: true },
      { onConflict: "behaviorist_id" },
    );

  return { ownerEmail: DEMO_OWNER_EMAIL, behavioristEmail: DEMO_BEHAVIORIST_EMAIL };
});
