# Entwicklungsnotizen

Ergänzt [AGENTS.md](../AGENTS.md) um Details, die nur für bestimmte Aufgaben nötig sind. Neue Erkenntnisse hier eintragen, Veraltetes löschen.

## URL-Parameter

- Beide Apps: `?debug` (Hooks `window.HL` bzw. `window.FL`, keine Eingangstür), `?welcome` (Eingangstür trotz `debug`, nur ohne gespeichertes `*.seen`, also in einem frischen Profil), `?lang=de|en`, `?spec=`, `?view=`, `?cmp`, `?expert`.
- Herz: `?age=infant|child|adult`, `?h=` (Feldauflösung, Standard 0.14); nur mit `debug` auch `?cut=` und `?phase=`.
- Fuß: `?stage=`, `?xray`, `?tendons`, `?labels`, `?wdbg` (Skin-Gewichte einfärben).

## Layouts

- `desk`: zwei Seitenspalten, Monitor bzw. Plan unten, dazwischen die Erklärbox. Kompaktmodus bis Fensterhöhe 1100 px (Herz) bzw. 880 px (Fuß), noch knapper bis 820 px; `MQ.dense` im JS gleich halten. `--gap` ist der Abstand unter dem Monitor, darin steht die Hinweiszeile.
- `phone` (hoch, < 700 px): ein Panel unter dem Monitor, Tab-Leiste `#app[data-mt]` (Herz: heart/view/values/info, Fuß: foot/view/values/info); den aktiven Tab erneut tippen schließt das Panel (`none`) und gibt dem Modell den Platz.
- `phoneLand` (quer, Höhe < 520 oder Breite < 900): Panel rechts. `stack` (Tablet hoch, ≥ 700 px): Modell oben, beide Panels unten.
- `freeArea()` liefert die Bühne (l/r/t/b); daraus kommen `dx`/`dy`/`cx` für `setViewOffset`, die Schere im Vergleichsmodus, die Vergleichs-Tags und der Gesten-Hinweis.

## Herzlupe

- Präparate 01–10: `normal`, `vsd`, `asd`, `ps`, `coa`, `uvh`, `avsd`, `tof`, `tga`, `pda`. Jedes Experiment-Panel hat einen Behandlungs-Toggle `[data-op]` („Nach OP“ oder „Nach Katheter“ über `byCatheter()`); bei Fallot und TGA sitzt er in der Reihe `.seg.tri.chips`. Steuerung über `setOp()`, `isOp()`, `OPK`; in Tests `HL.setOp(bool)`.
- Einfach-Modus: Ampelzeilen „Auf einen Blick“ (`updateGlance`), Befund ohne Zahlen, Beschriftungen sauerstoffreich/-arm/gemischt. Experte zeigt alle Messwerte (`herzlabor.mode`).
- Altersstufen Säugling (3 Monate), Kind (6 Jahre), Erwachsener; Standard ist Erwachsener, Auswahl als dezentes `<select id="age">` in der Puls-Box (drei Buttons links waren dem Nutzer zu präsent). Der Kern rechnet erwachsenen-äquivalent (Qs = 5, relative Größen); `ageParams()` liefert nur Druckniveau, LA/RA und PVR-Skala. Die Anzeige skaliert: Millimeter × √(BSA/1,9), Fluss × CO/5, PVR bei Kindern als WU·m². Texte mit `{sbp}`, `{cm2}`, `{beats}`, `{rvj}`, `{pvrN}` laufen durch `ageTok()`.
- Herzfrequenz: `cyc`/`cycInv` verzerren die Zyklusphase (Systolenblock ≈ √RR) für EKG, 3D und Ton. Der Monitor zeigt 25 mm/s, die Intervalle müssen im Normbereich des Alters liegen (Erwachsene: PR 120–200, QRS 70–100, QTc 350–440 ms). Prüfen mit `ecgshots.py`.
- Rundgänge: `TOUR` (gesundes Herz, dann VSD), `TOUR_TOF`, `TOURS[spec]`; Texte in `TXT[lang].tour`, `.tourTof`, `.tours`. Jeder Schritt setzt `op` (fehlt = vor der Behandlung).
- Anatomie-Varianten (TGA, UVH) haben eine eigene Primitiv-Welt `W = {PR, BB, ACC}` aus `variantWorld(drop, add, reside)`; `sdf`, `candidates`, `outerAt`, `vertexAppearance`, `buildFieldAsync` und `buildHeartGeometry` nehmen `W` (Standard `W0`). Sie werden nach dem Start im Hintergrund gesampelt (`variantBase`, Busy-Anzeige). Bei TGA ist zusätzlich das rechte Herzohr verkleinert. OP-Stufen sind Feld-Änderungen: `vesselField` (Wand nur außerhalb der Hülle über `outerAt(W)`), `plugField`; Pfade mit `liftTo(p, W, h)` auf die Oberfläche heben.
- Zusätzliche Meshes: Geometrie in Herzkoordinaten backen, `hookBeat(m, '1.0')` und eigener `customProgramCacheKey`.
- Die Herzlupe rendert jedes Frame; die Fußlupe nur nach Änderungen (`invalidate()`, Dirty-Flag), weil die Haut (MeshPhysical, 47k Vertices, 4 Morphs) auf Intel Arc nur etwa 40 fps schafft.
- Start und Leistung (Herz): Das Distanzfeld (Normalherz beim Start, TGA und UVH danach im Hintergrund) und die Oberflächenfarben (`vertexAppearance`) rechnen bis zu vier Web Worker (`fieldWorkers()`, `workerTask()`); der Worker-Quelltext entsteht aus den Funktionen per `toString()` plus Konstanten als JSON, ohne Worker (blockiert, Fehler) rechnet der Hauptthread wie früher. Dringende Aufgaben (Herz im Aufbau) gehen sofort an den freiesten Worker, Hintergrundaufgaben nur an freie. Während die Worker das Feld abtasten, rendert `boot()` die Umgebung (PMREM, früher auf Modulebene) und kompiliert die Flächen-Shader (`warmShaders()`); vor „Bereit“ wartet `boot()` auf `renderer.compileAsync`, und die Schleife zeichnet erst ab `EX.ready`, sonst hängt das erste Bild sekundenlang am Shader-Link. Maßstäbe (1536 × 730, dieser PC): Bereit nach 2,7 s statt 5,4 s, flüssig ab etwa 3 s statt 12 s; mit 4-fach gedrosselter CPU 7,3 s statt 20,5 s, flüssig ab etwa 8,5 s statt 38 s.

## Fußlupe

- Füße 01–05: `normal`, `club`, `posit`, `add`, `calc`. Die Zeitachse ist der Behandlungsverlauf (`COURSES`, `setStage()`, Plan unten); es gibt keinen Altersregler.
- Vorfuß-Winkel = `mAdd + fAdd + cAdd`, gemessen gegen den Unterschenkel (Ponseti-Endstellung 60–70°). Der Pirani-Score (`pirani()`) wird aus der Stellung abgeleitet. Die Stellungstabelle im Hinweise-Dialog kommt aus `COURSES[s][0]` (`renderNormTable`). Experten-Beschriftungen mit Fachbegriffen stehen in `labX`; am Handy zeigt der Plan nur `#planNow`.
- Modell: MTP-Gelenke bei etwa 72 % der Fußlänge, Zehen etwa 25 %. Zehen untereinander mit k = 0,04 vereinigen (Spalten bleiben), dann mit k = 0,2 an den Fuß. Haut aus Loft-Primitiven (Superellipsen-Querschnitt, C1-Hermite-Profile, runde Kappen, Feld = S/|∇S|) statt verketteter Ellipsoide, die wellige „Raupen“-Seiten ergeben. Nägel per Pixel im Ruhe-Frame (Uniform-Arrays), Umgebungsverdeckung pro Vertex aus dem SDF, Falten als Morph-Targets (Normalen-Differenz verschoben minus original).
- Kamera-Fit über gepostete Schlüsselpunkte mit Perspektivkorrektur (k = D/(D − dz)), sonst werden Zehen abgeschnitten.
- Der Unterschenkel läuft oben absichtlich aus dem Bild (auch hinter das Logo).

## UI-Bausteine

- Erstbesuch: `FIRST` gilt, wenn `*.seen` fehlt und kein `?debug` gesetzt ist. Dann öffnet `boot()` sofort die Eingangstür `#door` (modaler `<dialog>`, deckt das Laden ab): was die App ist, für wen, drei Wege hinein. `#doorTour` ruft `doorTour()` (Rundgang, am Handy im Info-Tab; vor Ladeende gemerkt in `EX.goTour`), `#doorPick` ruft `flashSpecs()`, `#doorFree` startet die Kurzeinführung (`startCoach()`, vor Ladeende gemerkt in `CO.go`). Jedes Schließen (auch ×, Esc, Klick daneben) setzt `*.seen`; solange sie offen ist, ignoriert der Keydown-Handler die Tasten. Die Tür hat eine eigene Sprachumschaltung; Buttons im `<form method="dialog">` brauchen `type="button"`, sonst schließen sie den Dialog. Der Gesten-Hinweis `#gesture` verschwindet beim ersten Drehen (`controls` 'start').
- Kurzeinführung »Kurz erklärt« (`#coach`): Coach-Marks über der Oberfläche, getrennt vom fachlichen Rundgang, nur beim Erstbesuch: nach »Selbst erkunden« und nach dem letzten Schritt des an der Tür gewählten Rundgangs (`tourNext()`, `CO.after`). »Herz/Fuß wählen« und das Schließen der Tür starten sie nicht; gespeichert wird nichts. `COACH` = Schritte (Ziel-Selektor, `'stage'` = Bühne aus `freeArea()`, `tab` öffnet am Handy den Tab, `side` = bevorzugte Seite des Popovers), Texte in `TXT[lang].coach` (Schritt 1 mit Maus- und Touch-Variante). Die Abdunklung `.co-shade` hat per `clip-path: path(evenodd, …)` ein Loch: Das Ziel bleibt bedienbar, ein Klick daneben, Esc oder × beenden, Pfeiltasten blättern. `coachFrame()` folgt dem Ziel per rAF bei Scrollen, Moduswechsel und Resize; nur der sichtbare Teil in der scrollenden Spalte zählt. Das Gleiten ist zeitbasiert (lange Bilder holen auf), am Ende scrollen die Tafeln zurück auf ihren Stand vor der Einführung. Tooltips sind währenddessen aus (`#app.coaching`), ein Rundgang-Start beendet sie (`tourGo()` ruft `endCoach()`).
- `.pick-top`: „Herz wählen“ bzw. „Fuß wählen“ mit `#pickName`, dem Klarnamen der Auswahl; nur im Kompaktmodus sichtbar, wo `.lat` ausgeblendet ist.
- Die Erklärbox hat eine feste reservierte Höhe (`freeArea`: 112 bzw. 128 px), damit Textwechsel nicht neu zoomen.
- Fußzeile `.legal`: Hinweistext und Menü (Herz: „Warum die Herzlupe?“, Hinweise, Impressum, Datenschutz; Handy: im Info-Tab, 11,5 px, passt ab 360 px Breite). Dialoge sind native `<dialog>` mit `<form method="dialog">`. Anbieterdaten im `OWNER`-Objekt oben im Skript; fehlende Felder erscheinen gelb als Platzhalter.
- Die Zweckbestimmung (nur Aufklärung, kein Medizinprodukt) steht im Hinweise-Dialog (`.ab-purpose`), im Impressum, in der Fußzeile und in der Promo: bei Änderungen überall anpassen.
- Palette »Nachtblau & Aqua« (seit September 2026, vorher Petrol-Grün), in beiden Apps gleich in `:root`: `--acc` Akzent (Aqua `#4fd4e8`), `--ok` Grün für »unauffällig«, `--dlg` Dialog- und Tooltip-Fläche, `--deep` dunkle Schrift auf hellen Flächen und dunkle Füllungen; im Herz bleibt `--ecg` Grün und gilt nur für den Monitor. Transparente Flächen und Hover-Töne stehen noch als `rgba()` in den Regeln (`7,16,34` bzw. `233,240,251`). Favicon, `theme-color` und Logo-SVG haben die Farben fest eingetragen.
- Farben mit Bedeutung: Rot, Blau und Violett stehen für Sauerstoff, die Punkte in »Auf einen Blick« für unauffällig (`var(--ok)`), verändert (`#efc15c`) und deutlich verändert (`#ff7a6a`). Eine neue Akzentfarbe deshalb nur im Grün-Cyan-Bereich wählen. EKG- und PKG-Kurve sind in `drawMonitor` fest verdrahtet (`#72f59e`, `#efeade`).
- Die rechte Spalte der Herzlupe ist im Experten-Modus bei 1366 × 768 randvoll: neue Zeilen nur mit Ausgleich.
- Die Seitenspalten haben eine versteckte Scrollbar; Überlauf ist also unsichtbar. Mit realistischen Fenstergrößen testen (1920 × 950, 1536 × 730, 1440 × 900).

## Fallen

- Hilfsfunktionen, die `hemodynamics()` nutzt, vor `let HEMO = …` definieren (TDZ bei `?spec=`).
- Klicks während des Ladens: `setSpec()` merkt sich vor Boot-Ende nur den Zustand (Guard `!meshes.tissue`), `boot()` wendet ihn danach an.
- Materialien mit gleichem `onBeforeCompile`-Quelltext teilen sich ein Programm: immer `customProgramCacheKey` setzen.
- Worker-Code (Herz): `smin`, `smax`, `primEval`, `candidates`, `tsepAt`, `sdf`, `hash3`, `vnoise`, `vertexAppearance` laufen als Text im Worker und dürfen nur einander, `clamp`/`sstep`/`lerp` und die dort eingesetzten Konstanten nutzen; neue Abhängigkeiten in `fieldWorkers()` ergänzen. Prüfen mit `heval.py _field.js` (`workers` > 0, 0 Abweichungen), denn ein Fehler im Worker fällt still auf den langsamen Hauptthread zurück.
- Materialien, die erst später an einem Objekt hängen (z. B. Schirmchen, Naht), in `warmShaders()` aufnehmen, sonst stockt das erste Bild mit ihnen. In heißen Schleifen kein `Math.hypot` (langsam), sondern Quadrate vergleichen.
- SDF: Lumen auf derselben Seite (LEFT/RIGHT) verschmelzen bei Lücken unter etwa 0,25 cm (TGA: Aorta und Äste RIGHT, PA und LPA/RPA LEFT). Defekte mit `dh = max(dh, outerAt + 0.28)` ausschneiden, sonst brechen sie nach außen durch. Objekte im Gewebe scheinen im Schnitt durch (die Schnittfläche sind Rückseiten).
- Neue `data-*`-Attribute: vorher nach vorhandenen `[data-x]`-Selektoren suchen (`data-show` löste schon einmal einen globalen Handler aus).
- CSS-Regeln, die `display` von Buttons setzen, überstimmen `[hidden]`: `:not([hidden])` verwenden.
- `.col` hat am Desktop `pointer-events:none`, damit das Modell hinter leeren Spaltenflächen drehbar bleibt. Offene Handy-Panels und die Tablet-Spalten nehmen Berührungen an, sonst dreht ein Wischen in Lücken das Modell statt zu scrollen.
- `controls.maxDistance` folgt der Bühne (`frameCamera()`); eine feste Grenze machte das Herz auf schmalen Handys zu groß.
- Flex-Kinder mit `overflow:hidden` schrumpfen auf 0: `.col>*{flex-shrink:0}`. Breite Tabellen in Grids brauchen `min-width:0` auf den Grid-Kindern.
- Touch: `pointerover` feuert vor `pointerdown`, also `e.pointerType` direkt prüfen. Ein Tipp verschiebt den Fokus; `focusout` blendet Tooltips deshalb nur ohne Touch aus.
- Offline-Build: data:-Module können nicht relativ importieren, daher wird `./three.core.js` auf den Bare-Specifier `three/core` umgeschrieben und gemappt. Schriften sind Fontsource-woff2 (latin, latin-ext) als data:-URLs. Die CSP erlaubt `worker-src blob:` für die Feld-Worker. Wegen der CSP ohne `unsafe-eval` scheitert Playwrights `wait_for_function("…")`; stattdessen `wait_for_selector('#status.done', state='attached')`.
- `vendor/three-importmap.js` ist ein klassisches Skript, das per `document.currentScript.after()` eine Importmap mit data:-Modulen einfügt; so laufen die Apps auch von `file://`.

## Testwerkzeuge

- `regress.py`: Baseline `after_adult.json` (86 Zustände); `NEW=1` → `after_all_adult.json` (122), `OP=1` → `after_op_adult.json`; `HL_PAGE=<pfad>` prüft eine dist-Datei.
- `overflow.py` (Herz), Baseline: 1135 × 638 links 47 / rechts 58 (einfach), rechts 170 (Experte); 1536 × 730 Experte rechts 34; sonst 0. `foverflow.py` entsprechend für den Fuß. `_free.py heart|foot`: freie Höhe je Spalte. `_slack.py`: freier Platz rechts.
- `_mobile.py heart|foot [geräte]`: Tabs nebeneinander, Modellrahmen gegen Monitor/Plan/Logo, Touch-Scrollen über CDP `Input.dispatchTouchEvent`. `Input.synthesizeScrollGesture` mit `touch` scrollt headless nie (falsch negativ).
- Zustände und Geometrie: `hstate.py out.png "js" [w h] [url]`, `heval.py x.js` (JS → Text, auch ASCII-Karten der Scheidewand; Beispiele `_opcheck.js`, `_tours2.js`, `_exp.js`, `_smoke.js`), `hprobe.py` (Marker, 5. Argument = JS danach), `_opshots.py` (behandelte Zustände), `shoot.py` („spec:stage:view:flags“, Fuß), `fshots.py`, `ftouch.py`, `tour.py`, `modeshots.py`, `aboutshots.py`, `devcheck.py`, `phonetabs.py`, `mobileshots.py`.
- `preview.py out.png höhe a.png b.png …` setzt Screenshots nebeneinander, `_crop.py` schneidet aus.
- `_coach.py heart|foot [w h] [en]`: Kurzeinführung beim Erstbesuch; je Schritt Loch und Popover (im Fenster, nicht über dem Loch), Kontaktbogen `_co_<app>.png`; dazu Esc, Klick daneben, Klick ins Loch, Pfeiltasten, »wählen« (ohne Einführung) und die Übergabe nach dem Rundgang.
- `_ipad.py heart|foot [geräte]`: iPad in der Safari-Engine (Playwright WebKit, Touch), Geräte `air-port`, `air-land`, `mini-port`, `mini-land`, `pro-port`, `pro-land` (Safari-Sichtfläche ohne Leisten); Startzeit, Worker, Konsolenfehler, Kurzeinführung je Schritt, Modellrahmen gegen die Tafeln, Kontaktbogen `_ipad_<app>_<gerät>.png`. WebKit rendert unter Windows ohne GPU nur wenige Bilder pro Sekunde: Die Bildrate dort sagt nichts über das iPad, bildweise Animationen hinken dort hinterher.
- Leistung: `_perf.py heart|foot [sekunden] [cpu-drossel] [dist]` (Startphasen mit Zeiten, fps und Long Tasks je Sekunde nach dem Start, beim Herz wann TGA/UVH fertig sind; Drossel 4 ≈ Mittelklasse-Handy), `_prof.py heart|foot [sekunden] [drossel]` (CPU-Profil über CDP: Self- und Gesamtzeit je Funktion, vor und ab `boot()`, Aufrufer der teuersten three.js-Funktion), `heval.py _field.js` (Worker gegen Hauptthread).
- `themes.py [namen]`: Farb-Mock-ups der Herzlupe (VSD, Vierkammerblick, eingefroren); die Paletten-CSS wird nur in die laufende Seite injiziert (`heute` = aktuelle Farben, `petrol` = alte Palette, dazu Graphit, Aubergine, Klinikweiß, Sand) → `_theme_<name>.png`, `_theme_<name>_door.png`, Kontaktbögen `_themes.png` und `_themes_door.png`.
- Integrierter VS-Code-Browser: `setViewportSize` zerschießt Layout und Screenshots, `page.click` scheitert teils (dann `el.click()` per `evaluate`). Für Screenshots headless Playwright mit Edge nutzen.

## Promo

- `promo/render_promo30.py` mit `overlay30.js` (30 s, 9:16, deutsch, für Eltern und Kinderärzte) → `Herzlupe_Promo_30s_9x16.mp4`; `--preview` erzeugt einen Kontaktbogen (`preview_sheet.png`, Einzelbilder in `_frames/`). Rendern dauert einige Minuten, also im Hintergrund starten. Die alte 15-s-Version (`render_promo.py`, `overlay.js`) zeigt noch „Herzlabor“.
- URL `?debug&lang=de&age=adult` (Musik und Herztöne auf 72/min). `clock.js` ersetzt `performance.now` und `requestAnimationFrame` durch eine virtuelle Uhr, das Overlay steuert die Szenen über `window.HL` und blendet die App-UI aus (`.mtabs`, `.legal`, …). Im Overlay keine App-Klassen verwenden (`.brand` wurde von der Handy-CSS erfasst, daher `.pv-brand`). EKG-Streifen = `HL.CY.ecg(HL.cyc(f))`.
- Das 30-s-Video ist in Nachtblau & Aqua gerendert (`overlay30.js`). Grün (`#72f59e`) bleibt nur für den EKG-Streifen und den Hinweis »Ein Flicken verschließt das Loch« (behoben = unauffällig, wie in der App). Die alte 15-s-Version zeigt noch Petrol-Grün und »Herzlabor«.
- Linkvorschau (WhatsApp, iMessage, …): Open-Graph-Tags im `<head>` der Herzlupe mit absoluten URLs auf `https://jddark8.github.io/herzlupe/` (bei Umzug auf eine eigene Domain anpassen), Bild `og.jpg` (1200 × 630) im Hauptordner, erzeugt mit `promo/render_og.py [spec] [view]` aus der laufenden App (VSD im Vierkammerblick, UI ausgeblendet, Logo und Leitsatz darüber). `og.jpg` muss mit hochgeladen werden; Messenger speichern Vorschauen eine Weile, ein angehängtes `?v=2` erzwingt eine neue.

## Weitergabe (ZIPs)

- Erst `build_offline.py` und die Offline-Tests (`offline_new.py`, `offline.py <absoluter pfad>\dist\fusslupe.html`), dann zwei ZIPs in `dist/`: `Herzlupe_App.zip` mit `herzlupe.html` und `fusslupe.html`, `Herzlupe_Projekt.zip` mit dem ganzen Ordner unter `heart/`, ohne `dist/`, `klumpfuss/_shots/*.png` und `promo/*.mp4|png` (sonst etwa 80 MB). Einträge mit `/` schreiben (.NET `ZipFile`, nicht `Compress-Archive`).
- Prüfen: Projekt-ZIP entpacken, dort `build_offline.py` laufen lassen; die neu gebauten Dateien müssen hash-gleich mit `dist/` sein und nichts nachladen.
