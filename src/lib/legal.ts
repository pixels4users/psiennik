/** Dane operatora i wersjonowanie dokumentów prawnych Psiennika. */

export const OPERATOR = {
  name: "Miłosz Michałowski-Żuk Pixels4Users",
  street: "Kościelna 4 m. 5",
  city: "91-437 Łódź",
  nip: "7262448188",
  regon: "382918503",
  /** Adres e-mail do kontaktu i reklamacji. */
  email: "kontakt@psiennik.pl",
} as const;

/** Wersja regulaminu zapisywana w profilu przy akceptacji. */
export const TERMS_VERSION = "2026-09-14";

export const PRIVACY_VERSION = "2026-09-14";

export const LEGAL_UPDATED = "14 września 2026";

/** Minimalny wiek użytkownika Psiennika. */
export const MINIMUM_AGE = 18;

/** Etykieta adresu e-mail — zawsze zwraca faktyczny adres lub wyraźny placeholder. */
export function contactEmailLabel(): string {
  return OPERATOR.email ?? "[adres e-mail do uzupełnienia]";
}

/** Historia wersji dokumentów prawnych. Dodaj nową wersję na górze. */
export const LEGAL_VERSIONS: { version: string; date: string; kind: "terms" | "privacy" }[] = [
  { version: "2026-09-14", date: "14 września 2026", kind: "terms" },
  { version: "2026-09-14", date: "14 września 2026", kind: "privacy" },
];

/** Czy zmiana wersji wymaga wyraźnej akceptacji użytkownika. */
export function versionRequiresAcceptance(kind: "terms" | "privacy", version: string): boolean {
  // Na start wszystkie zmiany wymagają akceptacji. W przyszłości można rozróżniać
  // zmiany wymagające akceptacji od zmian wchodzących w trybie powiadomienia.
  return true;
}
