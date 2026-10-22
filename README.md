# Vokabelkasten

Eine Vokabelkasten-App für Englisch ab Klasse 5 und weitere Sprachen. Vokabeln lassen sich hineinladen, die ein KI-Chatbot aus dem Foto einer Buchseite erstellt hat.

Die App läuft im Handy-Browser, lässt sich auf den Startbildschirm legen und funktioniert danach offline. Sie braucht keine Anmeldung und keinen API-Schlüssel. Name, Vokabeln und Lernstand bleiben im Browser auf dem Gerät.

## Was die App kann

- **Persönlich:** Beim ersten Start fragt die App nach dem Namen und der ersten Sprache. Jede Sprache hat ihren eigenen Kasten und erscheint oben als Fahne. Weitere Sprachen kommen über das + dazu.
- **Übungskalender:** Tage am Stück, Übungszeit heute und diese Woche, ein Monatskalender (Tag antippen zeigt Übungszeit, abgefragte Wörter, Trefferquote und neue Wörter) und die letzten Wochen im Vergleich.
- **Karteikasten mit 7 Fächern.** Ein Wort kommt nach 1, 2, 4, 8 und 16 Tagen, nach einem Monat und nach einem halben Jahr wieder dran. Richtig heißt ein Fach weiter, falsch heißt zwei Fächer zurück.
- **Kurze Runden** mit 10 Wörtern. Neue Wörter kommen zuerst als Auswahl aus vier Antworten, danach zum Eintippen. Falsche Wörter kommen in derselben Runde noch einmal. Bei kleinen Tippfehlern zeigt die App die richtige Schreibweise.
- **Grammatik** für Englisch nach dem Bildungsplan Baden-Württemberg (G9): Jedes Thema wird erst erklärt, mit Beispielen zum Anhören, danach kommen 8 Aufgaben (Lücke füllen, auswählen, Satz ordnen). Klasse 5 folgt Camden Town 5 (Theme 1 bis 6), Klasse 6 ist fertig, die höheren Klassen und Französisch stehen als Themenliste drin.
- **Freies Üben** jederzeit und **Testtraining** für eine einzelne Unit. Beides ändert die Fächer nicht.
- **Spracheingabe:** Wort sagen oder buchstabieren, wo der Browser Spracherkennung anbietet (Chrome, Safari). Englische Wörter werden vorgelesen.
- **Vokabeln aus einem Foto:** Foto aufnehmen, über das Teilen-Menü an ChatGPT, Claude oder Gemini schicken, die Antwort einfügen und in der Liste korrigieren.
- **Units teilen** per Link oder QR-Code. Der Link enthält nur die Wortliste.
- **KI-Hilfe pro Wort** (in den Einstellungen, anfangs aus): öffnet den eigenen KI-Chat mit einer Frage zum Wort.
- **Lernstand sichern** als Datei und wieder laden.

## Format für Vokabellisten

Eine Vokabel pro Zeile, Felder durch Semikolon getrennt. Der Beispielsatz ist freiwillig, eine Zeile mit `#` setzt den Namen der Unit.

```
# Unit 2 – My family
mother ; Mutter ; My mother is a doctor.
brother ; Bruder
to be late ; zu spät sein
```

## Veröffentlichen mit GitHub Pages

1. Im Repository auf **Settings → Pages** gehen.
2. Bei **Source** „Deploy from a branch“ wählen, Branch `main`, Ordner `/ (root)`, **Save**.
3. Nach ein bis zwei Minuten läuft die App unter `https://davidpricking.github.io/vokabelkasten/`.

Nach jeder Änderung an den Dateien in `sw.js` die `VERSION` erhöhen, damit installierte Apps die neue Fassung laden.

## Aufbau

Reines HTML, CSS und JavaScript ohne Build-Schritt:

- `index.html`, `style.css`, `app.js`: die App
- `grammar.js`: Grammatik-Themen mit Erklärungen und Aufgaben, aufgeteilt nach Klassenstufen
- `sw.js`, `manifest.webmanifest`, `icons/`: Offline-Betrieb und Installation
- `fonts/`: Fredoka und Atkinson Hyperlegible (SIL Open Font License), lokal eingebunden
- `vendor/qrcode.js`: QR-Code-Generator von Kazuhiko Arase (MIT-Lizenz)

Zum lokalen Testen reicht ein einfacher Webserver, zum Beispiel `python3 -m http.server` im Projektordner.
