import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_dogs",
  title: "List dogs",
  description: "List the dogs the signed-in user can access in Psiennik.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("dogs")
      .select("id, name, breed, age, sex")
      .order("name")
      .limit(100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const dogs = (data ?? []).map((d) => ({ id: d.id, name: d.name, breed: d.breed, age: d.age, sex: d.sex }));
    const text = dogs.length
      ? dogs.map((d) => `${d.id}: ${d.name}${d.breed ? ` (${d.breed})` : ""}`).join("\n")
      : "No dogs.";
    return { content: [{ type: "text", text }], structuredContent: { dogs } };
  },
});
