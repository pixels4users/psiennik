## Sekcja „Połącz swój Psiennik z ChatGPT” w Ustawieniach

Na stronie Ustawienia (dla zalogowanych) dodajemy prostą kartę w tym samym stylu co pozostałe.

- Tytuł: „Połącz swój Psiennik z ChatGPT”
- Krótki opis: „Zadawaj ChatGPT pytania o swoje psy, wpisy i komentarze. ChatGPT może tylko odczytywać dane — niczego nie zmieni.”
- Przycisk (obrys): „Zobacz, jak to zrobić” → strona z instrukcją `/psiennik-w-chatgpt`

Miejsce: pod kartą „Twoje dane”, przed kodem behawiorysty i listami współpracy.

### Szczegóły techniczne
- `src/routes/_authenticated/profil.tsx`: nowy komponent `ChatGptCard` (Card + `Link` z `@tanstack/react-router` w `Button asChild variant="outline"`), wstawiony po `<ExportDataCard />`.
- Bez zmian w bazie i logice.
