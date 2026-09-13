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
| `src/data/jelolesek.js` | A nyolc jelöléstípus: név, szín, rajz |
| `src/data/peldak.js` | A hat példa útvonal |
| `src/data/gpx.js` | GPX-fájl előállítása a böngészőben |
| `src/data/tarolo.js` | Mentés a localStorage-ba |
| `src/components/Terkep.jsx` | A Leaflet-térkép (szerkesztéshez és nézegetéshez is) |
| `src/components/Vedjegy.jsx` | A szóvédjegy: „Túraba[bakancs]ancs”, SVG-ből |
| `src/components/Fejlec.jsx` | Hamburger menü, szóvédjegy, sötét mód |
| `src/components/FooldalPage.jsx` | A főoldal: mai adatok, jelzésrendszer, példák, vélemények |
| `src/components/TervezoPage.jsx` | A tervező felület (`/tervezo`) |
| `src/components/Velemenyek.jsx` | Név nélküli véleményfal |
| `src/data/velemenyek.js` | **A vélemények tárolórétege — olvasd el a fájl tetejét** |
| `src/data/erdekessegek.js` | A turistajelzés-rendszer, adatból ellenőrizve |
| `src/data/ertekelesek.js` | **A „szerintünk” csillagok — ezek vázlatok, írd át** |
| `src/data/szures.js` | Szűrés tájegység, hossz és nehézség szerint |
| `src/data/latvanyossagok.js` | 15 látványosság: koordináta, kép, **szerző és licenc** |
| `public/latvany/` | A letöltött képek (528 KB) |
| `src/components/Ertekeles.jsx` | Az értékelődoboz az útvonal oldalán |
| `src/styles/tokens.css` | Az összes szín és méret; máshol ne legyen nyers érték |

## A három fül

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
| `/utvonalak` | A hat példa |
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

A hat példa koordinátái nem tippek: minden töréspont az OpenStreetMap névkeresőjéből
lekérdezett valódi hely, vagy két ilyen közti felezőpont. A Belső-tó köre magának a
tónak a partvonala, 45 méterrel kifelé tolva. **Új példa felvételekor ugyanígy járj
el** — ne írj be koordinátát ellenőrzés nélkül.

## Élesítés — turabakancs.com

**Az oldal él.** Cloudflare Workers szolgálja ki, a domain a Rackhostnál van
bejegyezve, de a DNS-t a Cloudflare kezeli (`art.ns.cloudflare.com`,
`luciane.ns.cloudflare.com`).

### Telepítés: pusholás

Nincs kézi lépés, nincs zip, nincs FTP. Amit a `main` ágra pusholsz, azt a
Cloudflare megépíti és kiteszi:

```
git push        →  npm ci  →  npm run build  →  dist/  →  él
```

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

