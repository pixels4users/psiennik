import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDogs from "./tools/list-dogs";
import listEntries from "./tools/list-entries";
import getEntryComments from "./tools/get-entry-comments";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "psiennik",
  title: "Psiennik",
  version: "0.1.0",
  instructions:
    "Read-only access to the signed-in user's Psiennik dog behaviour diary: dogs, diary entries with ratings and behaviorist recommendations, and entry comments.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listDogs, listEntries, getEntryComments],
});
