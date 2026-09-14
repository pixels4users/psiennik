import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const acceptanceSchema = z.object({
  documentKind: z.enum(["terms", "privacy"]),
  version: z.string().min(1),
  eventKind: z.enum(["acceptance", "notification"]),
  method: z.enum(["email", "google", "apple", "change_screen"]),
});

/**
 * Zapisuje zdarzenie akceptacji lub powiadomienia o dokumencie prawnym.
 * Wywoływane z klienta, bo tabela legal_acceptances ma INSERT tylko dla service_role.
 */
export const recordLegalAcceptance = createServerFn({ method: "POST" })
  .validator((data) => acceptanceSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("legal_acceptances").insert({
      user_id: context.userId,
      document_kind: data.documentKind,
      version: data.version,
      event_kind: data.eventKind,
      method: data.method,
    });
    if (error) throw new Error(error.message);
    return { ok: true } as const;
  });
