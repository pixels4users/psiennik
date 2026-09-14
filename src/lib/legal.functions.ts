import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

/**
 * Rejestr czynności dotyczących dokumentów prawnych.
 *
 * Zasady bezpieczeństwa:
 * - identyfikator konta pochodzi wyłącznie z uwierzytelnionej sesji serwerowej;
 * - wersja dokumentu pochodzi z podpisanego tokenu wydanego w chwili pokazania
 *   dokumentu — dzięki temu zapisujemy wersję faktycznie widzianą przez
 *   użytkownika, a nie bieżącą wersję serwera;
 * - czas zdarzenia ustawia baza danych (wyzwalacz), nie przeglądarka;
 * - sposób czynności weryfikujemy względem faktycznego sposobu logowania;
 * - powtórzone żądanie nie tworzy duplikatu (klucz idempotencji = nonce tokenu).
 */

/** Ważność tokenu wersji dokumentu (15 minut). */
const TOKEN_TTL_MS = 15 * 60 * 1000;

type DocumentKind = "terms" | "privacy";

type TokenPayload = {
  /** Konto, dla którego token wydano — token jednego użytkownika nie działa u innego. */
  u: string;
  /** Rodzaj dokumentu. */
  k: DocumentKind;
  /** Wersja faktycznie pokazana użytkownikowi. */
  v: string;
  /** Czas wydania (ms). */
  i: number;
  /** Jednorazowy identyfikator — klucz idempotencji zapisu. */
  n: string;
};

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function signingKey(): Promise<CryptoKey> {
  const secret = process.env["LEGAL_TOKEN_SECRET"];
  if (!secret) throw new Error("Brak klucza podpisującego tokeny dokumentów");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signPayload(body: string): Promise<string> {
  const key = await signingKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return b64url(new Uint8Array(sig));
}

/** Porównanie o stałym czasie — chroni przed odgadywaniem podpisu. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Wersja dokumentu obowiązująca na serwerze dla danego rodzaju. */
function currentVersion(kind: DocumentKind): string {
  return kind === "terms" ? TERMS_VERSION : PRIVACY_VERSION;
}

/**
 * Wydaje podpisany token dla dokumentu pokazywanego użytkownikowi.
 * Token trafia do zapisu akceptacji i to z niego bierzemy wersję.
 */
export const issueDocumentToken = createServerFn({ method: "POST" })
  .validator((data) => z.object({ documentKind: z.enum(["terms", "privacy"]) }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const kind = data.documentKind;
    const version = currentVersion(kind);
    const payload: TokenPayload = {
      u: context.userId,
      k: kind,
      v: version,
      i: Date.now(),
      n: crypto.randomUUID(),
    };
    const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
    const token = `${body}.${await signPayload(body)}`;
    return { token, documentKind: kind, version } as const;
  });

async function verifyToken(token: string, userId: string): Promise<TokenPayload> {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("Nieprawidłowy token dokumentu");
  if (!timingSafeEqual(signature, await signPayload(body))) {
    throw new Error("Nieprawidłowy token dokumentu");
  }
  const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as TokenPayload;
  // Token jest związany z konkretnym kontem — cudzego użyć się nie da.
  if (payload.u !== userId) throw new Error("Token dokumentu należy do innego konta");
  if (Date.now() - payload.i > TOKEN_TTL_MS) throw new Error("Token dokumentu wygasł");
  return payload;
}

const acceptanceSchema = z.object({
  /** Podpisany token wydany przy pokazaniu dokumentu. */
  token: z.string().min(1),
  eventKind: z.enum(["acceptance", "notification"]),
  method: z.enum(["email", "google", "apple", "change_screen"]),
  /** Termin usunięcia — wymagany wyłącznie dla powiadomień. */
  purgeAfter: z.string().date().optional(),
});

export const recordLegalAcceptance = createServerFn({ method: "POST" })
  .validator((data) => acceptanceSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const payload = await verifyToken(data.token, context.userId);

    // Wersja z tokenu musi być nadal wersją wymagającą czynności. Jeżeli w trakcie
    // wypełniania formularza opublikowaliśmy nowszy dokument, odrzucamy zapis —
    // użytkownik zobaczy nową treść i ponowi czynność.
    const serverVersion = currentVersion(payload.k);
    if (payload.v !== serverVersion) {
      return {
        ok: false,
        reason: "version_changed",
        documentKind: payload.k,
        currentVersion: serverVersion,
      } as const;
    }

    // Sposób czynności musi odpowiadać faktycznemu sposobowi logowania z sesji.
    const claims = context.claims as { app_metadata?: { provider?: string } } | undefined;
    const provider = claims?.app_metadata?.provider;
    const sessionMethod = provider === "google" ? "google" : provider === "apple" ? "apple" : "email";
    if (data.method !== "change_screen" && data.method !== sessionMethod) {
      throw new Error("Sposób akceptacji nie odpowiada sposobowi logowania");
    }

    // Powiadomienie bez ustalonego terminu usunięcia nie może powstać — dany rodzaj
    // powiadomienia uruchamiamy dopiero po ustaleniu jego celu i retencji.
    if (data.eventKind === "notification" && !data.purgeAfter) {
      throw new Error("Dla tego rodzaju powiadomienia nie ustalono okresu przechowywania");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("legal_acceptances").insert({
      user_id: context.userId,
      account_ref: context.userId,
      document_kind: payload.k,
      version: payload.v,
      event_kind: data.eventKind,
      method: data.method,
      idempotency_key: payload.n,
      purge_after: data.eventKind === "notification" ? (data.purgeAfter ?? null) : null,
    });

    // Powtórzone żądanie z tym samym tokenem nie tworzy drugiego wpisu.
    if (error && error.code !== "23505") throw new Error(error.message);

    return { ok: true, documentKind: payload.k, version: payload.v } as const;
  });
