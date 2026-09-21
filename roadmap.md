# Zadania

- [x] Ustawienia: „Wyloguj się" w osobnej karcie „Konto" nad „Usunięciem konta"; „Zapisz" nieaktywny bez zmian, po zapisie „Zapisano zmiany"


- [x] Migracja bazy: entry_comments + uszczelnienie entries (SQL z zatwierdzonego planu)
- [x] Aplikacja: szczegóły wydarzenia, trasa edycji, dyskusja, RecommendationDialog, liczniki, canDiscuss/canRecommend, eksport
- [x] Testy API/RLS (lista z planu) + Playwright 390×844 i desktop
- [x] Płynne przejście do gotowego formularza edycji wydarzenia
- [x] Poprawki po audycie b934070: stany strony psa (niedostępny/błąd/offline), walidacja kodów zaproszeń w bazie (własny kod behawiorysty, kod własnego psa, duplikaty)
- [x] Nawigacja górna: imiona psów właściciela, Ustawienia i uproszczona sekcja konta
- [x] Nagłówek strony psa: bez „Twoje psy" i „Dodaj psa" (przeniesione do nawigacji), bez „Wasza wspólna historia", lżejsza sekcja bez zielonego tła
- [x] Nawigacja i nagłówek psa: „Dodaj psa” po prawej, statyczna tożsamość, uporządkowana opieka i zakładki bez separatora
- [x] Powiadomienia: tabela notifications z triggerami, dzwonek z listą i oznaczaniem, ustawienia e-mail (główny przełącznik + 4 rodzaje, adres do powiadomień), szablony e-mail i trasa wysyłki z kluczem w bazie (pg_net)
- [x] Zakończenie i wznowienie współpracy przez behawiorystę (przycisk w nagłówku psa i na karcie „Zakończone”, limit aktywnych procesów, komunikat przy odebranym dostępie)
- [ ] Otwarte przed publikacją: okresy retencji powiadomień, odpowiedź Lovable w sprawie powierzenia
