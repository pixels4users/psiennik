import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Ustawia rolę behawiorysty dla świeżo założonego konta (ścieżka OAuth).
 * Rolę bierzemy z sesji po stronie serwera — identyfikatorowi z przeglądarki nie ufamy.
 * Zmiana jest dopuszczalna wyłącznie dla konta, które nie ma jeszcze żadnego psa
 * ani dostępu do cudzego psa, dzięki czemu nie da się przełączyć roli istniejącemu kontu.
 */
export const claimBehavioristRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => z.object({}).parse({}))
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: dogCount }, { count: accessCount }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("dogs").select("*", { count: "exact", head: true }).eq("owner_id", userId),
      supabaseAdmin
        .from("dog_access")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const alreadyBehaviorist = (roles ?? []).some((r) => r.role === "behaviorist");
    if (alreadyBehaviorist) return { ok: true as const, changed: false };
    if ((dogCount ?? 0) > 0 || (accessCount ?? 0) > 0) {
      return { ok: false as const, changed: false };
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "owner");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "behaviorist" });
    if (roleError) throw roleError;

    const code = `BEH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await supabaseAdmin
      .from("behaviorist_links")
      .upsert({ behaviorist_id: userId, invite_code: code }, { onConflict: "behaviorist_id" });

    return { ok: true as const, changed: true };
  });
