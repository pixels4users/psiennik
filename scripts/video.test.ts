import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVideoUrl, pickVideosToFree, validateVideoFile, MB, STORAGE_LIMIT_BYTES, VIDEO_MAX_BYTES } from "../src/lib/video-core.ts";

test("limit konta to 50 MB, pliku 20 MB", () => {
  assert.equal(STORAGE_LIMIT_BYTES, 50 * MB);
  assert.equal(VIDEO_MAX_BYTES, 20 * MB);
  assert.equal(validateVideoFile({ size: 20 * MB, type: "video/mp4" }), null);
  assert.notEqual(validateVideoFile({ size: 20 * MB + 1, type: "video/mp4" }), null);
  assert.notEqual(validateVideoFile({ size: 1, type: "image/png" }), null);
});

test("linki YouTube, Shorts, Dysk, Vimeo", () => {
  assert.deepEqual(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ"), { kind: "iframe", provider: "youtube", vertical: false, src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" });
  assert.equal((parseVideoUrl("https://www.youtube.com/shorts/abcdefghijk") as { vertical: boolean }).vertical, true);
  assert.equal((parseVideoUrl("https://drive.google.com/file/d/1AbCdEfGhIj/view?usp=sharing") as { src: string }).src, "https://drive.google.com/file/d/1AbCdEfGhIj/preview");
  assert.equal((parseVideoUrl("https://vimeo.com/123456") as { src: string }).src, "https://player.vimeo.com/video/123456");
  assert.equal(parseVideoUrl("https://example.com/v.mp4")?.kind, "link");
  assert.equal(parseVideoUrl("http://youtu.be/x"), null);
  assert.equal(parseVideoUrl("javascript:alert(1)"), null);
});

test("automatycznie usuwa najstarsze wideo, aż zmieści się nowe", () => {
  const videos = [{ path: "a", size: 15 * MB }, { path: "b", size: 15 * MB }, { path: "c", size: 15 * MB }];
  assert.deepEqual(pickVideosToFree(videos, 48 * MB, 18 * MB), { paths: ["a", "b"], enough: true });
  assert.deepEqual(pickVideosToFree(videos, 10 * MB, 18 * MB), { paths: [], enough: true });
  assert.equal(pickVideosToFree([], 45 * MB, 18 * MB).enough, false);
});
