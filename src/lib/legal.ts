/** Dane operatora i wersjonowanie dokumentów prawnych Psiennika. */

export const OPERATOR = {
  name: "Miłosz Michałowski-Żuk Pixels4Users",
  street: "Kościelna 4 m. 5",
  city: "91-437 Łódź",
  nip: "7262448188",
  regon: "382918503",
  /**
   * Adres e-mail do kontaktu i reklamacji.
   * UWAGA: ustaw prawdziwy adres — dopóki jest `null`, dokumenty i stopka
   * pokazują wyraźną informację o brakującym kontakcie.
   */
  email: null as string | null,
} as const;

/** Wersja regulaminu zapisywana w profilu przy akceptacji. */
export const TERMS_VERSION = "2026-09-14";

export const LEGAL_UPDATED = "14 września 2026";

export const CONTACT_PLACEHOLDER = "[adres e-mail do uzupełnienia]";

export function contactEmailLabel(): string {
  return OPERATOR.email ?? CONTACT_PLACEHOLDER;
}
