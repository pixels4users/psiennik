import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "owner" | "behaviorist";

const STORAGE_KEY = "dog-diary-role";

const RoleContext = createContext<{
  role: Role | null;
  setRole: (role: Role) => void;
}>({ role: null, setRole: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "owner" || saved === "behaviorist") setRoleState(saved);
  }, []);

  const setRole = (next: Role) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setRoleState(next);
  };

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
