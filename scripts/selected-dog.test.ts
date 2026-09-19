import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readSelectedDog, rememberSelectedDog } from "../src/lib/selected-dog.ts";

const dogs = [{ id: "first" }, { id: "second" }];
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

beforeEach(() => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    configurable: true,
  });
});

afterEach(() => {
  for (const [key, descriptor] of [
    ["window", originalWindow],
    ["localStorage", originalStorage],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test("opens the first accessible dog without a saved selection", () => {
  assert.equal(readSelectedDog(dogs, "owner"), "first");
});

test("remembers a selection only for the same account", () => {
  rememberSelectedDog("second", "owner-a");
  assert.equal(readSelectedDog(dogs, "owner-a"), "second");
  assert.equal(readSelectedDog(dogs, "owner-b"), "first");
});

test("ignores a saved dog missing from the current accessible list", () => {
  rememberSelectedDog("removed-or-inaccessible", "owner");
  assert.equal(readSelectedDog(dogs, "owner"), "first");
});

test("does not redirect an account without dogs", () => {
  rememberSelectedDog("second", "owner");
  assert.equal(readSelectedDog([], "owner"), null);
});

test("storage failures do not block navigation", () => {
  Object.defineProperty(globalThis, "localStorage", {
    get: () => {
      throw new Error("Storage unavailable");
    },
    configurable: true,
  });
  assert.doesNotThrow(() => rememberSelectedDog("second", "owner"));
  assert.equal(readSelectedDog(dogs, "owner"), "first");
});

test("server rendering works without browser storage", () => {
  Reflect.deleteProperty(globalThis, "window");
  assert.equal(readSelectedDog(dogs, "owner"), "first");
});
