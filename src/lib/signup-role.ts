export type SignupRole = "owner" | "behaviorist";

export const PENDING_ROLE_KEY = "psiennik.pending-role";

type RoleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Before an OAuth (Google/Apple) redirect: remember the role chosen on the signup tab. */
export function rememberOAuthRole(storage: RoleStorage, role: SignupRole | undefined) {
  if (role === "behaviorist") storage.setItem(PENDING_ROLE_KEY, "behaviorist");
  else storage.removeItem(PENDING_ROLE_KEY);
}

/** After returning with a session: returns true once if the behaviorist role must be claimed. */
export function takePendingBehavioristRole(storage: RoleStorage): boolean {
  if (storage.getItem(PENDING_ROLE_KEY) !== "behaviorist") return false;
  storage.removeItem(PENDING_ROLE_KEY);
  return true;
}

/** Metadata sent with e-mail signup. */
export function emailSignupMetadata(displayName: string, role: SignupRole) {
  return { display_name: displayName, role };
}
