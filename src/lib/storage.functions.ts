import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pickVideosToFree, STORAGE_FULL_MESSAGE, VIDEO_MAX_BYTES } from "@/lib/video-core";

/** Reclaim only the authenticated uploader's objects, never other people's files. */
export const reclaimStorage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { size: number; protectedPaths?: string[] }) => {
    if (!Number.isSafeInteger(input.size) || input.size < 0 || input.size > VIDEO_MAX_BYTES)
      throw new Error("Maksymalny rozmiar pliku to 200 MB.");
    if (input.protectedPaths && (!Array.isArray(input.protectedPaths) || input.protectedPaths.length > 20 || input.protectedPaths.some((p) => typeof p !== "string")))
      throw new Error("Niepoprawna lista plików.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: objects, error } = await context.supabase.rpc("my_owned_storage_files");
    if (error) throw error;
    const owned = objects ?? [];
    const usage = owned.reduce((sum, item) => sum + Number(item.size), 0);
    const candidates = owned.filter((item) => !data.protectedPaths?.includes(item.path));
    const { paths, enough } = pickVideosToFree(candidates, usage, data.size);
    if (!enough) throw new Error(STORAGE_FULL_MESSAGE);
    if (paths.length === 0) return { removed: [] as { bucket: string; path: string }[] };
    // Paths originate solely from an auth.uid()-scoped RPC, not user-supplied deletion targets.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const removed: { bucket: string; path: string }[] = [];
    for (const path of paths) {
      const item = candidates.find((object) => object.path === path);
      if (!item) continue;
      const { error: removeError } = await supabaseAdmin.storage.from(item.bucket).remove([item.path]);
      if (removeError) throw removeError;
      const { error: referenceError } = await supabaseAdmin.rpc("clear_removed_storage_references", {
        _bucket: item.bucket, _paths: [item.path],
      });
      if (referenceError) throw referenceError;
      removed.push({ bucket: item.bucket, path: item.path });
    }
    return { removed };
  });