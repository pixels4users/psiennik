# Zasady utrzymania refreshu

- Każda czynność korzysta z istniejących warunków `canManage`, `canEditEntries`, `canRecommend`, `canDiscuss`. Sam wygląd nie egzekwuje uprawnień.
- Zachować adresy widoków i linki bezpośrednie. Selektor psa nie zastępuje routera stanem komponentu.
- Animacje nie mogą opóźniać kliknięć ani zasłaniać podstawowej treści. Obsłużyć ograniczenie ruchu i klawiaturę.
- Przejścia treści roboczej zależą od psa i widoku, nie od odświeżania zapytań w tle. Nie zachowywać starej treści pod metryczką nowego psa dla animacji wyjścia.
- W dialogach pierwsze pole wybiera Radix. Unikać natywnego `autoFocus`, które wyprzedza zapamiętanie elementu otwierającego formularz. Po Escape sprawdzać powrót fokusu.
- Ozdobne SVG mają `aria-hidden`; zdjęcia informacyjne mają opisy. Kontrolki z samą ikoną mają nazwy dostępne.
- Na telefonie przewija się pasek widoków, nie cała strona w poziomie. Dialog pozostaje w obszarze ekranu, ma fokus i zamknięcie Escape.
- Nie dodawać fikcyjnych statystyk, ocen klientów, cen ani obietnic wyników. Dane marketingowego podglądu są opisane jako przykładowe.
- Odbiór: desktop, tablet, telefon, 0/1/wiele psów, oba rodzaje konta, zmiana psa, 5 widoków, formularz, komentarze, powrót, stan tylko do odczytu.
- Kolejność wydania: odbiór lokalny → osobna akceptacja → PR/merge → synchronizacja i podgląd Lovable → Publish przez właściciela. Migracje zawsze w osobnym procesie.
