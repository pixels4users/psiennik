/** A convenience preference only. Candidates always come from the existing authorised query. */
const key = (userId: string) => `psiennik:selected-dog:${userId}`;

export function readSelectedDog(dogs: { id: string }[], userId?: string): string | null {
  try {
    const saved =
      userId && typeof window !== "undefined" ? localStorage.getItem(key(userId)) : null;
    if (saved && dogs.some((dog) => dog.id === saved)) return saved;
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
  return dogs[0]?.id ?? null;
}

export function rememberSelectedDog(dogId: string, userId?: string) {
  try {
    if (userId) localStorage.setItem(key(userId), dogId);
  } catch {
    /* Navigation still works without persistence. */
  }
}
