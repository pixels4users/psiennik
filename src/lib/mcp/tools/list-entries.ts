import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const RATING: Record<string, string> = { green: "good", orange: "challenge", red: "difficult" };

export default defineTool({
  name: "list_entries",
  title: "List diary entries",
  description:
    "List behaviour diary entries for one dog (newest first), including rating and the behaviorist's recommendation.",
  inputSchema: {
    dog_id: z.string().uuid().describe("Dog ID from list_dogs."),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Earliest date, YYYY-MM-DD."),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Latest date, YYYY-MM-DD."),
    limit: z.number().int().min(1).max(100).optional().describe("Max entries (default 30)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ dog_id, from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("entries")
      .select("id, date, title, description, rating, activity_types, times_of_day, behaviorist_comment")
      .eq("dog_id", dog_id)
      .order("date", { ascending: false })
      .limit(limit ?? 30);
    if (from) q = q.gte("date", from);
    if (to) q = q.lte("date", to);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const entries = (data ?? []).map((e) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      description: e.description,
      rating: RATING[e.rating] ?? e.rating,
      activities: [...(e.activity_types ?? [])],
      times_of_day: [...(e.times_of_day ?? [])],
      recommendation: e.behaviorist_comment,
    }));
    const text = entries.length
      ? entries.map((e) => `${e.date} [${e.rating}] ${e.title} (${e.id})`).join("\n")
      : "No entries.";
    return { content: [{ type: "text", text }], structuredContent: { entries } };
  },
});
