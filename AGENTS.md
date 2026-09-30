# Herzlupe & Fußlupe

Zwei Aufklärungs-Apps für Eltern und Patienten, für das ärztliche Aufklärungsgespräch und zum Nachlesen zu Hause:

- **Herzlupe / HeartLens** ([index.html](index.html)): 3D-Herz zum Aufschneiden, gesund und mit neun angeborenen Herzfehlern, mit Blutfluss, Messwerten, EKG und Herztönen.
- **Fußlupe / FootLens** ([klumpfuss/index.html](klumpfuss/index.html)): Babyfuß mit Klumpfuß und anderen Fußstellungen, Behandlung nach Ponseti.

Ausschließlich zur Aufklärung, kein Medizinprodukt (EU 2017/745). Früher hießen die Apps Herzlabor und Fusslabor.

## Aufbau

- Jede App ist eine einzelne HTML-Datei (CSS und JS-Modul inline). Kein npm; GitHub Actions veröffentlicht die Web-App über GitHub Pages.
- three.js 0.186 und die Schriften liegen in `vendor/`. Die Apps laden nichts von fremden Servern.
- Die Modelle entstehen beim Start prozedural: Herz als SDF-Feld → Mesh, Fuß als SDF-Knochen mit gehäuteter Haut. Beim Herz rechnen Feld und Oberflächenfarben in Web Workern (Quelltext per `toString()`, Rückfall auf den Hauptthread).
- `python build_offline.py` schreibt `vendor/fonts.css`, `vendor/three-importmap.js` und die Offline-Einzeldateien `dist/herzlupe.html` und `dist/fusslupe.html` (mit CSP). Nach jeder Änderung an einer App neu bauen.
- `klumpfuss/_shots/` enthält die Test- und Screenshot-Skripte für beide Apps, `promo/` den Promo-Video-Renderer.

## Konventionen

- **Texte**: Deutsch steht im Markup (`data-i18n`, `data-i18n-tip`, `data-i18n-aria`), Englisch in `I18N_EN`, Einfach-Modus-Varianten in `SIMPLE[lang]`, dynamische Texte in `TXT[lang]`. Jeder neue Schlüssel braucht einen englischen Eintrag.
- **Ton**: Eingangstür, Kurzeinführung, Erklärbox und Rundgang duzen („Was du siehst“), Impressum, Datenschutz und „Warum die Herzlupe?“ siezen. Deutsche Anführungszeichen »…«, englische “…”.
- **Modi**: Einfach (Standard, für Eltern, ohne Einheiten) und Experte (Klinikwerte, Fachbegriffe).
- **Medizin**: nur geprüfte Aussagen mit Quelle (Literaturliste im Hinweise-Dialog). Alle Werte sind typische Modellwerte; EKG-Intervalle müssen zur Altersnorm passen. Neue Fakten über Europe PMC gegenprüfen.
- **Speicher**: nur `localStorage` mit `herzlabor.*` bzw. `fusslabor.*` (die alten Namen sind Absicht). Kommt ein Schlüssel dazu, den Datenschutztext deutsch (Markup) und englisch (`I18N_EN.lgPrivacyBody`) in beiden Apps anpassen.
- **Layouts**: Desktop, Kompaktmodus (Fensterhöhe ≤ 1100 px Herz, ≤ 880 px Fuß), Handy hoch mit Tab-Leiste, Handy quer, Tablet hoch. `layout()` und `MQ` im JS spiegeln die Media Queries; `freeArea()` liefert die Bühne für das Modell.
- Beide Apps sollen sich gleich bedienen lassen: UI-Muster in beiden Dateien umsetzen.

## Testen

Im Ordner `klumpfuss/_shots` mit `$env:PYTHONIOENCODING='utf-8'` und `& "C:\Program Files\Python314\python.exe" <skript> 2>&1 | Out-String` (Playwright mit Edge, headless).

- Hämodynamik: `regress.py out.json age=adult`, dann `cmp.py after_adult.json out.json` → 0 Abweichungen.
- Herz: `i18ncheck.py`, `overflow.py` (Spaltenüberlauf am Desktop), `_welcome.py heart` und `_welcome2.py heart` (Erstbesuch), `_coach.py heart` (Kurzeinführung).
- Fuß: `check.py`, `foverflow.py`, `_welcome2.py foot`, `_coach.py foot`.
- Handy und Tablet: `_mobile.py heart|foot` (Modell gegen Monitor/Plan, Touch-Scrollen je Tab), `_welcome2.py <app> phone`; iPad in der Safari-Engine: `_ipad.py heart|foot [air-port,air-land,…]`.
- Offline: im Hauptordner `build_offline.py`, danach `offline_new.py`.
- Leistung (nach Änderungen an Start, Feld oder Materialien): `_perf.py heart 20` und `_perf.py heart 20 4` (4-fach gedrosselte CPU), `heval.py _field.js` (Worker aktiv und bitgleich).
- `?debug` schaltet `window.HL` (Herz) bzw. `window.FL` (Fuß) frei und blendet die Eingangstür (Begrüßung beim Erstbesuch) aus; `?debug&welcome` zeigt sie trotzdem.

## Arbeitsweise

- Standardmäßig Desktop und fachliche Funktion prüfen; die Handy-Ansicht auf Wunsch.
- Screenshots klein halten (Kontaktbogen mit `preview.py`) und nur gezielt ansehen.
- Vor Arbeiten an Geometrie, Layout-Details, Rundgängen, Promo oder Offline-Build [docs/ENTWICKLUNG.md](docs/ENTWICKLUNG.md) lesen; neue Erkenntnisse dort eintragen.
