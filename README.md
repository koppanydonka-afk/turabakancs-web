# Túrabakancs

Térképes útvonaltervező és jelölő. Rákattintasz a térképre, kijön a vonal, ráteszed a
jelöléseket, és megosztod egy linkkel.

**Fiók nincs. Adatbekérés nincs. Süti nincs. Szerver nincs.**

## Indítás

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # dist/ mappába épít
```

## Mit hol találsz

| Fájl | Mi van benne |
| --- | --- |
| `src/data/utvonalak.js` | Távolság- és időszámítás, a linkbe kódolás |
| `src/data/ajanlo.js` | Az Ajánló fül tanácsai — mind a saját vonaladból számol |
| `src/data/magassag.js` | Magassági adat és emelkedő (Open-Meteo, kulcs nélkül) |
| `src/data/utvonalkereso.js` | Ösvényre húzás (FOSSGIS OSRM, gyalogos profil) |
| `src/data/idojaras.js` | Öt napos előrejelzés és túrázói figyelmeztetések |
| `public/sw.js` | Offline működés — a service worker |
| `src/data/naptar.js` | Napkelte/napnyugta — tiszta számítás, semmilyen szolgáltatás nélkül |
| `src/data/turautak.js` | Jelzett turistautak az OpenStreetMapből (Overpass) |
| `src/data/szolgaltatasok.js` | Víz, menedék és megálló az útvonal mentén (Overpass) |
| `src/data/jelolesek.js` | A nyolc jelöléstípus: név, szín, rajz |
| `src/data/peldak.js` | A 18 példa útvonal |
| `src/data/gpx.js` | GPX mentése és betöltése — mindkettő a böngészőben |
| `src/data/tarolo.js` | Mentés a localStorage-ba |
| `src/components/Terkep.jsx` | A Leaflet-térkép (szerkesztéshez és nézegetéshez is) |
| `src/components/Vedjegy.jsx` | A szóvédjegy: „Túraba[bakancs]ancs”, SVG-ből |
| `src/components/Fejlec.jsx` | Hamburger menü, szóvédjegy, sötét mód |
| `src/components/FooldalPage.jsx` | A főoldal: mai adatok, jelzésrendszer, példák, vélemények |
| `src/components/TervezoPage.jsx` | A tervező felület (`/tervezo`) |
| `src/components/Velemenyek.jsx` | Név nélküli véleményfal |
| `src/data/erdekessegek.js` | A turistajelzés-rendszer, adatból ellenőrizve |
| `src/data/ertekelesek.js` | **A „szerintünk” csillagok — ezek vázlatok, írd át** |
| `src/data/szures.js` | Szűrés tájegység, hossz és nehézség szerint |
| `src/data/latvanyossagok.js` | 15 látványosság: koordináta, kép, **szerző és licenc** |
| `public/latvany/` | A letöltött képek (528 KB) |
| `src/components/Ertekeles.jsx` | Az értékelődoboz az útvonal oldalán |
| `src/styles/tokens.css` | Az összes szín és méret; máshol ne legyen nyers érték |

## A tervező panelje

- **Terv** — rajzolás, mentés, GPX, megosztás.
- **Ajánló** — menetidő emelkedővel együtt (Naismith), nehézségi besorolás, magassági
  metszet, és hogy beéred-e sötétedés előtt. Minden a saját vonaladból számol.
- **Útvonalak** — a térképen épp látható terület **jelzett turistaútjai**, a magyar
  jelzésrendszerrel (piros sáv, kék kör, OKT-szakaszok). Bármelyik betölthető.

### Miért nincs „népszerű útvonal”

Mert ahhoz tudnunk kellene, ki merre jár — pont azt a figyelést, amit ez az oldal nem
csinál. Helyette azt mutatjuk, ami tényleg ott van a terepen: a hivatalosan jelzett
utakat. Ez nem kompromisszum, hanem jobb adat.

### Miért nincs dugófigyelő

Valós idejű forgalom kétféleképp szerezhető: vagy a felhasználók helyzetét gyűjtöd
folyamatosan (ez a Waze módszere — tömeges adatgyűjtés), vagy fizetsz egy
forgalmi API-ért kulccsal és számlázási fiókkal. Egyik sem fér bele. Ráadásul ez egy
**gyalogos** tervező: a dugó más terméket jelentene.

## Oldalak

| Cím | Mi van rajta |
| --- | --- |
| `/` | Főoldal: mai napkelte/napnyugta, jelzésrendszer, három példa, véleményfal |
| `/tervezo` | A tervező: beírás vagy rajzolás |
| `/utvonalak` | A 18 példa |
| `/utvonalak/:id` | Egy példa térképpel |
| `/rolad` | Mit tudunk rólad (a lábjegyzetből érhető el, nem menüpont) |

## „Szerintünk” — a csillagos értékelés

Minden példa útvonal kap egy **1–5 csillagos összesített értékelést**, négy részponttal
(kilátás, járhatóság, megközelítés, nyugalom), egy egymondatos verdiktet, és két
listát: mi szól mellette, mire számíts.

**A `src/data/ertekelesek.js` tartalma vázlat — írd át a saját véleményedre.**
Közismert tényekből készült (a Normafa busszal is elérhető és hétvégén tömeg van; a
Rám-szakadékban létrák vannak), de ami ennél személyesebb, azt csak az tudja megírni,
aki járt ott.

### Amit nem csinálunk: mások véleményeinek átvétele

A Google, a TripAdvisor és a túraoldalak értékelései a **szerzőik és a platformok
tulajdona**. Átmásolni őket szerzői jogot és felhasználási feltételt sért, ezért az
oldal nem gyűjt véleményt máshonnan. Az oldalon ez ki is van írva: „Ez a mi
véleményünk, nem mások értékeléseinek átlaga.”

Volt egy név nélküli véleményfal is félkészen; kikerült. Nyilvános véleményfal
tárhelyet, moderálást és tárhelyszolgáltatói kötelezettséget (Ekertv.) igényel — ez
külön döntés, nem programozási kérdés.

## Ivóvíz és megállók a térképen

A térkép jobb alsó sarkában két kapcsoló: **ivóvíz/forrás** és **megálló/állomás**.
Bekapcsolva kirajzolja, ami a látható területen van.

Volt ebből egy korábbi változat az oldalsávban, fiókként, az útvonal menti
találatokkal és „hányadik kilométernél éred el" adattal. A felhasználó
elvetette — a térkép a jó helye ennek, nem egy lista. A régi kód a
git-előzményben megvan (`Ellatas.jsx`, `utMentiek`, `megallok`).

### Miért vászon, és nem jelölő

Mért adat (Overpass, 2026 szeptember):

| terület | ivóvíz | megálló |
| --- | --- | --- |
| Budapest belváros | 393 | 863 |
| Budai-hegység | 143 | 485 |
| Pilis | 115 | 82 |

A projekt korábbi mérése szerint **266 hagyományos Leaflet-jelölő már érezhetően
akasztja a pásztázást telefonon**. Ezért ezek `circleMarker`-ek `L.canvas`
felületen: nyolcszáz kör is egyetlen vászonelem, a DOM-jelölők száma változatlan
marad. Élesben mérve: 1039 víz + 2339 megálló találat mellett a DOM 15 jelölőnél
maradt.

Korlátok: rétegenként 400 kirajzolt pont, és 12-es nagyítás alatt nem kérdezünk.

### Két szabály, amit a felület betart

**Elavult adat nem látszhat frissnek.** Ha a nagyítás a küszöb alá megy, a
korábbi találatokat töröljük, és a gomb kiírja, hogy nagyítani kell. Ha
elpásztáznak a lekérdezett területről, megjelenik a „Keresés ezen a területen"
gomb — magától nem kérdez újra, mert az Overpass közös erőforrás.

**A forrás nem ivóvíz.** A `natural=spring` lehet kiszáradva vagy szennyezett;
csak az `amenity=drinking_water` az, amit ivásra szántak. A buborék ezt
kimondja: „iható", „NEM iható" vagy „nincs adat róla, hogy iható-e".

### A rétegek színe

A jelöléstípusok színei (forrás `#0E7490`, megálló `#0F766E`) fehér tűben jól
elválnak, hatpixeles pöttyként viszont nem: egymáshoz mért világosságkontrasztjuk
**1,02:1**. A rétegek ezért saját, mért színt kapnak:

| réteg | szín | fehér kerethez | megjegyzés |
| --- | --- | --- | --- |
| ivóvíz | `#075985` | 7,56:1 | |
| megálló | `#D97706` | 3,19:1 | |

Egymáshoz világosságban 2,37:1. A kék–sárga tengely a vörös-zöld színtévesztésnek
is a legbiztosabb párja. A méret is eltér (6 és 5 képpont), hogy ne csak a szín
különböztesse meg őket.

### Mobilon

A rétegek nevét elhagyjuk (az ikon és a szín elmondja), de az **állapotot soha**:
a „keresem…" és a „nagyíts rá" utasítás, nem díszítés. Ezért van külön span a
névnek és az állapotnak.

A gombsor a felhúzható lap fölé kerül, ugyanarra a magasságra, mint a visszalépő
nyíl. Vízszintesen nem ütközik a súgósávval: az középen ül, ezek a jobb szélen.

## A térképre írt súgó

Felugrik, öt másodperc után elhalványul. Állandóan kint hagyva eltakarja a
térképet, és aki már tudja, mit kell csinálni, annak fölösleges.

Nem vész el: valahányszor **más mondanivalója** lesz — módváltáskor, az első
pont után, ösvényre húzás közben —, újra megjelenik. Az effektus a szövegre
figyel, nem időzítőre.

Csak az átlátszóság animálódik. A `transform` itt a középre igazítást végzi
(`translateX(-50%)`), azt animálva elcsúszna a sáv.

## A forrásmegjelölés mérete

Kisebb lett, mert zavaró volt telefonon és gépen is. Három lépésben:

- a **„Leaflet" előtag** elhagyva (`setPrefix(false)`) — az a könyvtár
  udvariassági megjelölése, nem licencfeltétel;
- a **„Térkép:" előtag** elhagyva — az a mi kiegészítésünk volt;
- a betűméret **10 képpontra** csökkentve.

Ami **marad, és nem is rövidíthető**: `© OpenStreetMap közreműködői`. Ez az
OpenStreetMap licencének feltétele, nem díszítés. A „közreműködői" szó is
része — a puszta „© OpenStreetMap" hiányos megjelölés lenne.

Tíz képpont alá ezért nem megyünk: egy olvashatatlanná zsugorított
forrásmegjelölés ugyanaz, mintha nem lenne ott.

## A halk gomb kerete

A `.gomb--halk` háttere ugyanaz a `--surface-2`, mint a `.fiok`-é. Fiókon belül
ezért **teljesen eltűnt**: a kettő kontrasztja pontosan **1,00:1** volt, a „Mind a
18 példa" és a „GPX betöltése" sima szövegnek látszott sötét módban.

A megoldás keret, nem háttérszín: így a gomb bármilyen felületen gombnak látszik.
A `--gomb-keret` külön token a `--line`-tól, mert annak halk elválasztóként
kevesebb is elég, egy gomb határa viszont a WCAG 1.4.11 szerint **3:1**-et kíván
a saját hátteréhez képest:

| mód | keret | kontraszt a gomb hátteréhez |
| --- | --- | --- |
| világos | `#888276` | 3,04:1 |
| sötét | `#6F746B` | 3,01:1 |

Az első nekifutás `--line`-t használt: az 1,29:1-et adott. Képernyőképen jónak
látszott, mérve nem volt elég.

## Overpass: tartaléktükör

A `src/data/overpass.js` közös a jelzett utaknak és az ellátás-rétegeknek. A fő
példány (`overpass-api.de`) terhelés alatt rendszeresen 504-gyel vagy 429-cel
válaszol; ilyenkor a `overpass.private.coffee` tükör következik. Húsz másodperc
után megszakítjuk a kérést — enélkül egy elakadt kiszolgáló örökre pörgetné a
gombot.

A hibák megőrzik a `cause`-t (melyik példány mit felelt). Bare `catch {}`-szel
minden hiba egyformán néz ki, és utólag nem lehet megmondani, a hálózat, az
időkorlát vagy a kiszolgáló volt-e a baj.

## GPX betöltése

Sokáig csak kifelé nyílt az ajtó: exportálni lehetett, betölteni nem. Aki kapott
egy nyomvonalat egy ismerőstől vagy a régi GPS-éről, az nem tudta megnyitni,
pedig minden más megvolt hozzá.

A `gpxBeolvas` a `trkpt`-t részesíti előnyben a `rtept`-vel szemben (a bejárt nyom
beszédesebb, mint a megtervezett), a `wpt`-kből jelölés lesz, a `sym` mezőből
pedig típus — amit nem ismer fel, az „látnivaló", ami nem hazudik.

**A betöltött nyomvonalat nem húzzuk ösvényre.** Ez a felhasználó saját adata;
nem a mi dolgunk átrajzolni. Ezért kap üres horgonylistát.

A több ezer pontos nyomvonalakat (másodpercenkénti GPS-rögzítés) 300 pontra
ritkítjuk, különben szerkeszthetetlen lenne és a megosztható linkbe sem férne be.

## Ösvényre húzás

A „Terv” fülön az **Ösvényre húzás** gomb a kattintott pontokat ráteszi a tényleges
gyalogutakra. Ez nem kozmetika: a Dobogókő–Rám–Dömös egyenesben 5,2 km, a valódi
ösvényeken **7,2 km** — vagyis az egyenes minden számot alábecsült.

A szolgáltatás a FOSSGIS közösségi OSRM-je, kulcs nélkül. **Csak gombnyomásra kérdez**
— rajzolás közben minden kattintás egy kérés lenne, az pedig visszaélés egy ingyenes
közösségi erőforrással. Egy gombbal visszavonható, mert a routolt vonal sokszor
másfelé megy, mint amire számítasz.

## Időjárás

Az „Ajánló” fülön öt napos előrejelzés (Open-Meteo, kulcs nélkül), a túra
kezdőpontjára. A számok mellé figyelmeztetés is jár, ott ahol számít: zivatarnál,
10 mm fölötti csapadéknál, 30 fok fölött, fagypont alatt és erős szélben.

Csak a **kezdőpontot** küldi el, nem a teljes nyomvonalat.

## Offline működés

A `public/sw.js` service worker eltárolja az oldalt és a **már megnézett**
térképszeleteket, hogy jel nélkül is megnyíljon, amit korábban láttál. Tesztelni csak
éles buildben lehet (`npm run preview`) — fejlesztés közben szándékosan nem
regisztrál, különben a régi kódot szolgálná ki.

**Amit nem csinál: nem tölt le előre térképet.** Az OpenStreetMap csempéinek tömeges
letöltése tilos. Csak az marad meg, amit a böngésző amúgy is lekért, legfeljebb 600
szelet.

> Buktató, amibe belefutottunk: a csempék más eredetről, `no-cors` módban jönnek,
> ezért a válasz „átlátszatlan” — a `status` 0 és az `.ok` hamis, akkor is, ha a kép
> rendben megérkezett. Emiatt eleinte semmi nem került a tárba. A `valasz.type ===
> 'opaque'` ágat ne vedd ki.

## Látványosságok a térképen — és a képek licence

A tervező térképén 15 ismert magyar látványosság van megjelölve; az ikonra húzva
kerek kép jelenik meg róla. A „Látnivalók” gombbal kapcsolható.

**Honnan van az adat:** a koordináta és a kép a Wikidatáról, a licencadat a Wikimedia
Commonsról — egyik sem kézzel írt érték. A képeket letöltöttük a `public/latvany`
mappába, hogy a látogató böngészője ne kérjen le semmit idegen szerverről.

### A névmegjelölés nem opcionális

**Mind a 15 kép CC BY vagy CC BY-SA alatt áll.** Ezeknél a szerző és a licenc
megjelölése a felhasználás *feltétele*, nem udvariasság. Ezért szerepel a szerző:

- a térképi buborékban, a kép mellett,
- és teljes jegyzékben a `/rolad` oldalon, licenclinkkel és az eredeti lapra mutató
  hivatkozással.

**Ha új képet veszel fel, ugyanígy tedd.** Névmegjelölés nélkül a licenc megszűnik, és
a felhasználás jogsértővé válik. Közkincs (PD) képnél ez nem kell — de akkor is írd
oda, honnan van.

Egy dolgot mindig ellenőrizz: a Wikidata néha meglepő fotót társít egy helyhez.
Nyisd meg a letöltött képet, mielőtt kiteszed.

## Új példa útvonal felvétele — a bevált menet

**Soha ne írj be koordinátát ellenőrzés nélkül.** A menet, ami működik:

1. **Horgonypontok** a Nominatimból, névre keresve — és **ellenőrizd, hogy a
   találat a megfelelő tájegység dobozán belül van.** Az „Istállós-kő” egyszer
   egy jakabszállási utcára illeszkedett, amiből 203 km-es útvonal lett.
2. **Ösvényre húzás** az OSRM gyalogos profiljával: a vonal a valódi
   gyalogutakon fusson, ne két pont közé húzott egyenesen.
3. **Emelkedő lemérése** az Open-Meteóval — **legfeljebb 100 koordináta**
   egy kérésben, ennyit enged a szolgáltatás.
4. **Józan ész**: stimmel-e a magasság a hely ismert magasságával? Oda
   vezet-e az útvonal, ahova a neve ígéri? A „Baradla-barlang” horgonya
   Jósvafőn van, nem Aggteleken — emiatt lett a nevéből „Aggtelek – Jósvafő”.
5. Az eredményt írd be `emelkedo: { fel, le, min, max }` mezőként: ebből
   számol a nehézség és a szűrő, API-hívás nélkül.

**Ha a leírásban számot írsz, az a lemért szám legyen.** Amikor a régi
egyenes vonalakat ösvényre húztuk, öt szöveg elavult (például „11 méter
emelkedő”, ami valójában 61 lett) — mindet javítani kellett.

## Az érdekességek — hogyan készültek

A jelzésrendszer leírása **nem emlékezetből** van: az OpenStreetMap jelzett útjaiból
ellenőriztem, mi hova vezet. A háromszöggel jelöltek neve csúcsnál vagy kilátónál
végződik, a körrel jelöltek ugyanoda érnek vissza, ahonnan indultak, a sávosak két
település között futnak át, a keresztesek két másik jelzést kötnek össze.
**Új tételnél ugyanígy járj el: ellenőrizd, ne emlékezz.**

Magasságot szándékosan nem írunk ki érdekességként: a domborzatmodell pár méterrel
eltér a hivatalos értékektől (Kékestetőre 1022 m-t ad az 1014 helyett), tehát tényként
nem közölhető.

## Teljesítmény — amire figyelni kell

Két dolog okozott érezhető akadozást telefonon, mindkettő mérve és javítva:

**1. Túl sok térképi jelölő.** Egy routolt útvonal 250 pontból áll, és
mindegyik külön húzható Leaflet-jelölő volt. A térkép minden mozdításakor
mind a 266-ot újrapozicionálta.

| | előtte | utána |
| --- | --- | --- |
| térképi jelölő | 266 | **17** |
| DOM-elem | 761 | **263** |

Hatvan pont fölött már csak a rajt és a cél kap jelölőt. A kézzel rajzolt
útvonalak (néhány tucat pont) változatlanul teljesen szerkeszthetők — egy
routolt vonal 137. pontját amúgy sem értelmes külön arrébb húzni.

**2. A térkép könyvtára minden oldalra letöltődött.** Pedig a főoldalnak, a
példák listájának és a szöveges oldalaknak nincs rá szükségük.

| | előtte | utána |
| --- | --- | --- |
| főoldal letöltése | 148 KB | **97 KB** |

A `TerkepKesobb.jsx` burkolat csak akkor tölti be a Leafletet, amikor tényleg
megjelenik térkép. **Ha új helyen használsz térképet, ezt a burkolatot
importáld**, ne a `Terkep.jsx`-et közvetlenül.

## A panel sorrendje

Szándékos, és ne forgasd fel: **előbb a kérdés, aztán a válasz, végül az
eszközök.**

1. **Honnan / Hova** — ez a belépő
2. **Adatok** — hossz, menetidő, emelkedő, nehézség; alatta a magassági
   metszet és a tanácsok
3. **Szerkesztés és mentés** — összecsukva
4. **Kész útvonalak**, **Mentett terveid** — összecsukva

Korábban három fül volt (`Terv` / `Ajánló` / `Útvonalak`); azok egy
kattintás mögé rejtették a lényeget. A `<details>` fiókok ugyanezt
megoldják, de látszik, mi van bennük.

**A magassági adat magától töltődik**, másfél másodperccel azután, hogy a
vonal nem változik tovább. Így rajzolás közben nem megy ki kérés minden
kattintásra, viszont nem kell gombot nyomni érte.

Kikerült a „Hol vagyok?” gomb: ugyanazt csinálta, mint az „Innen indulok”.

## Két út ugyanahhoz: beírás vagy rajzolás

A tervező panelének tetején két mező áll:

- **csak a „Honnan”** kitöltve → a térkép odaugrik, és az „Útvonalak” fülön
  megjelennek a legközelebbi kész túrák,
- **mindkettő** kitöltve → a két hely közé útvonalat számol a valódi
  gyalogutakon (OSRM), és beteszi a tervezőbe.

Így minden, ami a tervezőben van — emelkedő, menetidő, időjárás, GPX,
megosztás — ugyanúgy működik a beírt útvonalra is.

> Ez korábban **külön oldal volt** (`/honnan-hova`), de lényegében ugyanazt
> csinálta, mint a tervező. Beolvadt; a régi cím 301-gyel átirányít.

> Az autós idő a légvonalból becsül, folytonos sebességgörbével — szándékosan
> durva, és az oldalon ki is van írva.

## Érintés és nagyítás

A `body` **`touch-action: manipulation`** értéket kap. Ez kikapcsolja a
böngésző dupla koppintásos nagyítását, a csippentéses nagyítást viszont
meghagyja — az kell ahhoz, hogy a szöveget nagyítani lehessen.

Enélkül a térkép melletti felületre koppintva az egész oldal beleugrott, és
utána jobbra-balra csúszkált.

- A térkép fölött lebegő vezérlők (`.modvalto`, `.paletta`, `.latvany-valto`)
  is `manipulation`-t kapnak, hogy ne indítsanak böngészőgesztust.
- A súgósáv (`.terkep__sug`) **`pointer-events: none`** — csak tájékoztat,
  ezért az érintés átmegy rajta a térképre. Korábban elfogta, és a sáv alatti
  területre nem lehetett pontot tenni.

**Pontot és jelölést egyetlen kattintás töröl.** Nincs rákérdezés — ezt a
felhasználó kifejezetten így kérte. A húzás nem vált ki kattintást, tehát
az arrébb húzás nem töröl.

> Elvétett kattintásnál nincs visszavonás egy tetszőleges pontra; csak az
> „Utolsó pont vissza” gomb van a szerkesztés fiókban. Ha ez később zavaró,
> a rákérdezés visszatehető: `jel.bindPopup(...)` a `Terkep.jsx`-ben.

## Telefonon

A tervező mobilon másképp működik, mert ott a térkép és a vezérlők egymás elől
vennék el a helyet:

- **A térkép a teljes képernyő**, a panel alulról felhúzható lap. Csukott
  állapotban a fogantyú mutatja a lényeget („7,9 km · 3 pont · részletek”),
  koppintásra feljön a többi.
- **A pontok koppintásra törölhetők** — buborék nyílik rajtuk „Törlés” gombbal.
  Korábban csak jobbgombbal lehetett, ami telefonon nem létezik: mobilon
  egyáltalán nem lehetett pontot törölni.
- A súgószövegek érintésre vannak szabva („érintsd”, nem „kattints”).

> Buktató, amibe kétszer is belefutottunk: oszlopos flexben a gyerekek
> zsugorodnak, és az értékrács `overflow: hidden`-je emiatt levágja a második
> sorát. Ezért van a `.panel > *, .panel__tartalom > * { flex: 0 0 auto; }`
> szabály — ne vedd ki.

## A szóvédjegy

A „k” helyén egy bakancs áll. Nem képfájl, hanem **szöveg + SVG**: minden méretben
éles, sötét módban magától fehérre vált, és pár száz bájt. A betű Playfair Display
(egyetlen vágat), a bakancs színei a `--logo-zold` / `--logo-talp` tokenekben vannak.

A menüpontok hamburger mögött vannak. A **„Mit tudunk rólad”** szándékosan **nincs**
a menüben — az oldal alján, apróbetűvel a helye: a tervezőnél a panel alján, a többi
oldalon a lábsávban.

## Amit szándékosan nem csinál

- **Nem tárol semmit szerveren.** A megosztható link magába a címbe kódolja az
  útvonalat, a mentések pedig a látogató saját böngészőjében maradnak.
- **Nem kér e-mailt, nevet, semmit.** Nincs űrlap, nincs regisztráció.
- **Nem mér.** Nincs Google Analytics, nincs pixel, nincs süti.
- **Nem ígér navigációt.** A vonalak egyenesek a pontok között, nem a jelzett
  turistautakon futnak. Ez az oldalon is ki van írva.

Négy dolog megy ki az internetre, egyik sem hozzánk: a térképcsempék (magától), és
gombnyomásra a helykeresés, a turistautak listája és a magassági adat. A magassági
lekérés az egyetlen, amiben a megrajzolt vonal koordinátái elhagyják a böngészőt.
A `/rolad` oldal mind a négyet elmondja a látogatónak is — **új külső hívásnál ezt a
listát is bővítsd.**

## Példa útvonalak

A példák koordinátái nem tippek: minden töréspont az OpenStreetMap névkeresőjéből
lekérdezett valódi hely, vagy két ilyen közti felezőpont. A Belső-tó köre magának a
tónak a partvonala, 45 méterrel kifelé tolva. **Új példa felvételekor ugyanígy járj
el** — ne írj be koordinátát ellenőrzés nélkül.

## Élesítés — turabakancs.com

**Az oldal él.** Cloudflare Workers szolgálja ki, a domain a Rackhostnál van
bejegyezve, de a DNS-t a Cloudflare kezeli (`art.ns.cloudflare.com`,
`luciane.ns.cloudflare.com`).

### Telepítés

```bash
npm run kiad
```

Felépíti az oldalt, és a `wrangler`-rel kiteszi. **Ez a megbízható út.**

A GitHub-összekötés is megvan, és a pusholásra le is fut a build — de
kétszer is előfordult, hogy a build sikeresen feltöltötte a verziót, a
Cloudflare viszont **nem állította forgalomba**: a Version History-ban ott
állt az új verzió, miközben egy régebbi szolgálta ki a látogatókat. A
vezérlőpulton 100%-ra állítva sem mozdult; a `wrangler deploy` oldotta meg,
mert az egyszerre hoz létre verziót ÉS állítja forgalomba.

Ezért ne a vezérlőpult „Success” feliratának higgy, hanem ennek:

```bash
curl -s https://turabakancs.com/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
```

Ha ez a név nem egyezik azzal, amit a helyi `npm run build` kiírt, akkor nem
az van kint, amit hiszel.

A build beállításai a Cloudflare vezérlőpultján: build parancs `npm run build`,
kimeneti mappa `dist`. A Node verzióját a `.node-version` fájl rögzíti (22.16.0),
a Worker viselkedését a `wrangler.jsonc`.

### Mielőtt pusholsz

```
npm run eles
```

Ez felépíti az oldalt, és **a Cloudflare valódi motorjával** (`workerd`) futtatja
helyben. Nem ugyanaz, mint a `npm run dev`: itt a 404-kezelés, az átirányítások és
a perjelkezelés is úgy viselkedik, ahogy élesben fog. Egy soft-404-hibát pont ez
fogott meg, amit a fejlesztői szerver elrejtett.

### Amiből az élesítés áll

| Fájl | Mire jó |
| --- | --- |
| `wrangler.jsonc` | A Worker konfigurációja: 404-kezelés, perjelkezelés |
| `.node-version` | A build Node-verziója |
| `public/_redirects` | Két 301 (Cloudflare, Netlify) |
| `vercel.json`, `public/.htaccess` | Ugyanaz a két 301 más platformokra |
| `public/megoszto.jpg` | Megosztási kártya (1200×630) |
| `public/robots.txt` | A sitemapre mutat |
| `szerver.md` | Kiszolgálóbeállítás, ha valaha másik tárhelyre kerül |

A `sitemap.xml` és a `404.html` **nem fájl a repóban** — a `scripts/eloallit.js`
állítja elő ugyanabból a listából, amiből az oldalak. Így nem tudnak szétcsúszni.

### Google Search Console

Az ellenőrzés **DNS TXT-rekordon** áll, nem a `googled…html` fájlon. Utóbbi a
Cloudflare perjelkezelése miatt átirányít, és a Google az ellenőrzésnél nem követi
az átirányítást. A TXT-rekord viszont a tárhelytől független — egy esetleges
későbbi költözés nem töri el.

## Üzemeltetés

Statikus oldal, nincs szerveroldali kód, nincs adatbázis, nincs API-kulcs.

Minden cím valódi fájlként áll elő (22 db), ezért nincs szükség „mindent az
index.html-re" típusú visszaesésre. Ami nincs meg, az a `404.html`-t kapja, valódi
404-es státusszal.

Költség: a domain. Más nincs — se havidíj, se telepítési keret.

