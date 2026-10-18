import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_entry_comments",
  title: "Get entry comments",
  description: "List the discussion comments on one diary entry (deleted comments omitted).",
  inputSchema: { entry_id: z.string().uuid().describe("Entry ID from list_entries.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ entry_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("entry_comments")
      .select("id, body, author_role, created_at, deleted_at")
      .eq("entry_id", entry_id)
      .is("deleted_at", null)
      .order("created_at")
      .limit(200);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const comments = (data ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      author_role: c.author_role,
      created_at: c.created_at,
    }));
    const text = comments.length
      ? comments.map((c) => `${c.created_at} ${c.author_role}: ${c.body}`).join("\n")
      : "No comments.";
    return { content: [{ type: "text", text }], structuredContent: { comments } };
  },
});
