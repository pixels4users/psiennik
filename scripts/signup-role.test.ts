import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emailSignupMetadata,
  rememberOAuthRole,
  takePendingBehavioristRole,
} from "../src/lib/signup-role.ts";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

for (const provider of ["google", "apple"]) {
  test(`${provider}: behaviorist chosen before redirect is claimed after return`, () => {
    const s = memoryStorage();
    rememberOAuthRole(s, "behaviorist");
    assert.equal(takePendingBehavioristRole(s), true);
    assert.equal(takePendingBehavioristRole(s), false); // only once
  });

  test(`${provider}: owner chosen does not claim behaviorist`, () => {
    const s = memoryStorage();
    rememberOAuthRole(s, "behaviorist");
    rememberOAuthRole(s, "owner"); // switched back before clicking
    assert.equal(takePendingBehavioristRole(s), false);
  });
}

test("OAuth login (no role) clears a stale behaviorist choice", () => {
  const s = memoryStorage();
  rememberOAuthRole(s, "behaviorist");
  rememberOAuthRole(s, undefined);
  assert.equal(takePendingBehavioristRole(s), false);
});

test("e-mail signup sends chosen behaviorist role", () => {
  assert.deepEqual(emailSignupMetadata("Ola", "behaviorist"), { display_name: "Ola", role: "behaviorist" });
});

test("e-mail signup sends chosen owner role", () => {
  assert.equal(emailSignupMetadata("Ola", "owner").role, "owner");
});
