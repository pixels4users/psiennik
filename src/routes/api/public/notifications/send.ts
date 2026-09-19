import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

import { sendTemplateEmail } from "@/lib/email-templates/send-email";

type NotificationKind =
  | "entry"
  | "comment"
  | "recommendation"
  | "access_granted"
  | "access_revoked"
  | "process_completed";

const TEMPLATE_BY_KIND: Record<NotificationKind, string> = {
  entry: "notify-entry",
  comment: "notify-comment",
  recommendation: "notify-recommendation",
  access_granted: "notify-access",
  access_revoked: "notify-access",
  process_completed: "notify-access",
};

const PREF_BY_KIND: Record<NotificationKind, string> = {
  entry: "notify_entries",
  comment: "notify_comments",
  recommendation: "notify_recommendations",
  access_granted: "notify_access",
  access_revoked: "notify_access",
  process_completed: "notify_access",
};

const SITE_URL = "https://psiennik.pl";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isUsableEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase();
  if (!email) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return !email.endsWith("privaterelay.appleid.com");
}

export const Route = createFileRoute("/api/public/notifications/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-notify-secret") ?? "";
        if (!provided) return new Response("Unauthorized", { status: 401 });

        let notificationId: unknown;
        try {
          notificationId = (await request.json())?.notification_id;
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        if (typeof notificationId !== "string" || notificationId.length < 10) {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Klucz żyje wyłącznie w bazie — czyta go tylko zaufany kod serwera.
        const { data: secret } = await supabaseAdmin.rpc("notify_dispatch_secret");
        if (typeof secret !== "string" || !safeEqual(provided, secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { data: notification, error } = await supabaseAdmin
          .from("notifications")
          .select("id, user_id, dog_id, entry_id, kind, title, body")
          .eq("id", notificationId)
          .maybeSingle();
        if (error) return new Response("Database error", { status: 500 });
        if (!notification) return new Response("Not found", { status: 404 });

        const kind = notification.kind as NotificationKind;
        const template = TEMPLATE_BY_KIND[kind];
        const pref = PREF_BY_KIND[kind];
        if (!template) return new Response("ok: unknown kind");

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select(
            "email, email_notifications, notify_entries, notify_comments, notify_recommendations, notify_access",
          )
          .eq("id", notification.user_id)
          .maybeSingle();

        if (!profile?.email_notifications) return new Response("ok: disabled");
        if (profile[pref as keyof typeof profile] === false) return new Response("ok: muted");
        if (!isUsableEmail(profile.email)) return new Response("ok: no address");

        const url = notification.entry_id
          ? `${SITE_URL}/pies/${notification.dog_id}/wydarzenie/${notification.entry_id}`
          : notification.dog_id
            ? `${SITE_URL}/pies/${notification.dog_id}`
            : `${SITE_URL}/psy`;

        try {
          const result = await sendTemplateEmail(template, profile.email!, {
            templateData: {
              headline: notification.title,
              detail: notification.body,
              url,
            },
            idempotencyKey: `${template}-${notification.id}`,
          });
          return new Response(result.sent ? "ok: sent" : "ok: suppressed");
        } catch (err) {
          console.error("notification email failed", err);
          return new Response("Send failed", { status: 502 });
        }
      },
    },
  },
});
