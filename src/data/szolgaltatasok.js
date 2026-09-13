import { overpass } from './overpass.js';

/* Ami az útvonal mentén van: víz, menedék, ellátás, megálló.

   Miért ez a modul: a tanácsadó eddig két dolgot kifogásolt — „nincs
   vízvételi hely jelölve" és „nincs jelölve, hogyan jutsz a rajthoz" —, és
   mindkettőt a felhasználóra tolta. Közben az Overpass, amit a jelzett
   utakhoz amúgy is hívunk, tudja a választ. Ez a modul megkérdezi.

   Fontos, hogy mit NEM állítunk. A `natural=spring` egy forrás a térképen:
   attól még lehet kiszáradva, és nem ivóvízminőségű. Csak az
   `amenity=drinking_water` az, amit ivásra szántak. A kettőt végig külön
   tartjuk (`biztos` mező), mert ezen egy nyári túrán múlhat valami.

   Az Overpass közös, ingyenes szolgáltatás: csak gombnyomásra kérdezünk,
   soha nem magától. */

export class SzolgaltatasHiba extends Error {}

const kerdez = (lekerdezes) => overpass(lekerdezes, { cimke: 'szolgaltatasok' });

/* ---- Geometria ---- */

const FOLD_SUGAR_KM = 6371;
const fok = (x) => (x * Math.PI) / 180;

function tavolsag(a, b) {
  const dLat = fok(b[0] - a[0]);
  const dLng = fok(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fok(a[0])) * Math.cos(fok(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * FOLD_SUGAR_KM * Math.asin(Math.sqrt(h));
}

/* Egy réteg találatainak feldolgozása.

   Rétegenként kérdezünk, tehát nem kell a címkékből kitalálni, melyik ágról
   jött a találat — a hívó tudja. A címkék csak az ALFAJTÁT és a víznél az
   ivhatóságot mondják meg. */

const ALFAJTA = [
  [(t) => t.amenity === 'drinking_water', 'Ivóvíz'],
  [(t) => t.natural === 'spring', 'Forrás'],
  [(t) => t.amenity === 'shelter', 'Esőbeálló'],
  [(t) => t.tourism === 'wilderness_hut', 'Menedékház'],
  [(t) => t.tourism === 'alpine_hut', 'Turistaház'],
  [(t) => t.railway === 'station', 'Vasútállomás'],
  [(t) => t.railway === 'halt', 'Megállóhely'],
  [(t) => t.highway === 'bus_stop', 'Buszmegálló'],
  [(t) => t.amenity === 'parking', 'Parkoló'],
  [(t) => t.tourism === 'viewpoint', 'Kilátópont'],
  [(t) => t.man_made === 'tower', 'Kilátótorony'],
  [(t) => t.amenity === 'restaurant', 'Étterem'],
  [(t) => t.amenity === 'cafe', 'Kávézó'],
  [(t) => t.amenity === 'pub' || t.amenity === 'bar', 'Kocsma'],
  [(t) => t.amenity === 'fast_food', 'Büfé'],
  [(t) => t.historic === 'castle', 'Vár, kastély'],
  [(t) => t.historic === 'ruins', 'Rom'],
  [(t) => t.historic === 'archaeological_site', 'Régészeti lelőhely'],
  [(t) => t.historic === 'monument' || t.historic === 'memorial', 'Emlékmű'],
  [(t) => t.tourism === 'museum', 'Múzeum'],
  [(t) => t.waterway === 'waterfall', 'Vízesés'],
  [(t) => t.natural === 'cave_entrance', 'Barlangbejárat'],
  [(t) => t.natural === 'arch', 'Sziklakapu'],
  [(t) => t.man_made === 'lighthouse', 'Világítótorony'],
  [(t) => t.tourism === 'attraction', 'Látnivaló'],
];

function feldolgoz(adat, reteg) {
  const nyers = (adat.elements ?? [])
    .map((e) => {
      const hely = [e.lat ?? e.center?.lat, e.lon ?? e.center?.lon];
      if (!Number.isFinite(hely[0]) || !Number.isFinite(hely[1])) return null;
      const t = e.tags ?? {};
      const fajta = ALFAJTA.find(([ill]) => ill(t))?.[1] ?? reteg.nev;

      /* Ivhatóság CSAK a víznél értelmes, és ott is óvatosan:
           igen  – ivásra szánták, vagy az OSM külön kimondja
           nem   – az OSM kimondja, hogy nem iható
           null  – forrás, amiről nincs adat: lehet jó, lehet kiszáradt
         Más rétegnél a mező nem is létezik, hogy a felület véletlenül se
         tehessen rá „iható” címkét. */
      const ivasra =
        reteg.tipus !== 'forras'
          ? undefined
          : t.drinking_water === 'no'
            ? false
            : t.drinking_water === 'yes' || t.amenity === 'drinking_water'
              ? true
              : null;

      return {
        id: `${e.type}/${e.id}`,
        tipus: reteg.tipus,
        fajta,
        nev: t.name || fajta,
        ivasra,
        szezonos: t.seasonal === 'yes',
        /* Csak a látványosságoknál van értelme: ebből tudjuk utólag, kérésre
           elkérni a Commons képét és a szerzőjét. */
        wikidata: reteg.tipus === 'latnivalo' ? t.wikidata : undefined,
        lat: hely[0],
        lng: hely[1],
      };
    })
    .filter(Boolean);

  return egyesit(nyers);
}

/* Ugyanannak a dolognak néha két bejegyzése van az OSM-ben (külön csap és
   külön kút ugyanarra a kútra). Ami ötven méteren belül van, az egy.

   MIÉRT RÁCCSAL: ez korábban mindenkit mindenkivel összehasonlított. Pár
   száz elemnél még elment, a látványosságoknál viszont Budapestre 2854
   találat jött — az négyzetesen nyolcmillió távolságszámítás, és a
   böngésző fő szála percekre megállt tőle. A réteg „keresem…" állapotban
   ragadt, pedig a válasz rég megérkezett.

   Így viszont minden pont egy ~50 méteres rácscellába kerül, és csak a
   saját meg a nyolc szomszédos cellát nézzük végig. Ennyi elég: ami
   ötven méteren belül van, az legfeljebb a szomszéd cellában lehet. */
function egyesit(lista) {
  const CELLA = 0.00045;            // ~50 m szélességben
  const racs = new Map();
  const megmarad = [];

  for (const x of lista) {
    /* A hosszúsági fok a sarkok felé rövidül; a cellát ezzel arányosan
       szélesítjük, hogy a föld minden pontján ~50 méteres maradjon. */
    const szelesito = Math.max(0.2, Math.cos(fok(x.lat)));
    const sor = Math.round(x.lat / CELLA);
    const oszlop = Math.round((x.lng * szelesito) / CELLA);

    let volt = false;
    for (let ds = -1; ds <= 1 && !volt; ds += 1) {
      for (let do_ = -1; do_ <= 1 && !volt; do_ += 1) {
        const szomszed = racs.get(`${sor + ds},${oszlop + do_}`);
        if (!szomszed) continue;
        volt = szomszed.some((y) => tavolsag([y.lat, y.lng], [x.lat, x.lng]) < 0.05);
      }
    }
    if (volt) continue;

    const kulcs = `${sor},${oszlop}`;
    if (!racs.has(kulcs)) racs.set(kulcs, []);
    racs.get(kulcs).push(x);
    megmarad.push(x);
  }

  return megmarad;
}

/* ---- Térképrétegek: ami a látható területen van ----

   Külön a fenti útvonal menti keresést: ez nem a vonalad mellé néz, hanem
   arra, amit épp látsz a térképen.

   Mért adat a tervezéshez (Overpass, 2026 szeptember):

     Budapest belváros   393 ivóvíz,  863 megálló
     Budai-hegység       143 ivóvíz,  485 megálló
     Pilis               115 ivóvíz,   82 megálló

   A projekt korábbi mérése szerint 266 hagyományos Leaflet-jelölő már
   érezhetően akasztja a pásztázást telefonon. Ezért itt NEM jelölőt
   rajzolunk, hanem vászonra rajzolt köröket (`circleMarker` + `L.canvas`),
   amiből ezer is elfér akadás nélkül — és a darabszámot is korlátozzuk.

   Nagyítási alsó határ is van: fél országnyi területre nincs értelme
   lekérdezni, se a felhasználónak, se az Overpassnak. */

/* ---- A hat réteg ----

   A rétegek SAJÁT színt kapnak, nem a jelöléstípusokét: a jelölők fehér
   tűben, egymás mellett jól elválnak, hatpixeles pöttyként a térképen nem.

   Hat szín nem elég. Megmérve: a legjobb hatos színkombináció is csak 59
   egységnyi elválást ad vörös-zöld színtévesztéssel szimulálva (a
   biztonságos küszöb 90 fölött van). Ezért nem hat színt használunk, hanem
   HÁRMAT, mindegyiket két változatban — tömör és üreges körrel. A tömör és
   az üreges nem szín, hanem forma: az mindenkinek elválik.

   A három szín kereséssel állt elő, három feltétel mellett:
     - legalább 3:1 a fehér kerethez (hogy a pötty elváljon a térképtől),
     - legalább 2,2:1 a térkép jellemző hátteréhez (erdő, mező, út, víz),
     - a zöld árnyalatok kizárva, mert a térkép háttere maga is zöld.

   Az eredmény 133 egységnyi minimális elválás. Összehasonlításul: a szokásos
   Tailwind-paletták ugyanerre 45 és 62 egységet adtak, a korábbi kék-borostyán
   páros lilával kiegészítve 90-et — de az a térképháttérhez csak 1,88:1-et.

   A csoportosítás szándékos: egy szín egy kérdésre válaszol.
     sötétkék  – mi van innivaló és menedék dolgában
     rozsda    – hogyan jutok oda
     bíbor     – miért érdemes odamenni */

const SZINEK = {
  ellatas: '#000066',
  megkozelites: '#8C2E0E',
  celpont: '#991F99',
};

/* A gombok színe MÁS, mint a térképi pöttyöké — és ez nem ízlés kérdése.

   A térképi színek világos háttérre (erdő, mező, út) vannak optimalizálva.
   A vezérlőgombok viszont a panel hátterén ülnek, ami sötét módban majdnem
   fekete. Mérve, a sötét felülethez képest:

     #000066  1,09:1   ← gyakorlatilag láthatatlan
     #8C2E0E  1,93:1
     #991F99  2,31:1

   Ezért a gombok azonos ÁRNYALATÚ, de világosabb változatot kapnak, ami
   mindkét témában olvasható (mérve 3,8–4,0:1 sötéten és világoson is).
   A pöttyök színe változatlan marad: ott a térkép a háttér, nem a panel. */
const GOMB_SZINEK = {
  ellatas: '#6E6EF5',
  megkozelites: '#CC5A33',
  celpont: '#CC3DCC',
};

export const RETEGEK = {
  viz: {
    nev: 'Ivóvíz, forrás',
    tipus: 'forras',
    szin: SZINEK.ellatas,
    gombSzin: GOMB_SZINEK.ellatas,
    tomor: true,
    sugar: 6,
    szurok: ['["amenity"="drinking_water"]', '["natural"="spring"]'],
  },
  menedek: {
    nev: 'Menedék, esőbeálló',
    tipus: 'pihen',
    szin: SZINEK.ellatas,
    gombSzin: GOMB_SZINEK.ellatas,
    tomor: false,
    sugar: 7,
    szurok: ['["amenity"="shelter"]', '["tourism"="wilderness_hut"]', '["tourism"="alpine_hut"]'],
  },
  kozlekedes: {
    nev: 'Megálló, állomás',
    tipus: 'kozlekedes',
    szin: SZINEK.megkozelites,
    gombSzin: GOMB_SZINEK.megkozelites,
    tomor: true,
    sugar: 5,
    szurok: ['["highway"="bus_stop"]', '["railway"="station"]', '["railway"="halt"]'],
  },
  parkolo: {
    nev: 'Parkoló',
    tipus: 'parkolo',
    szin: SZINEK.megkozelites,
    gombSzin: GOMB_SZINEK.megkozelites,
    tomor: false,
    sugar: 7,
    szurok: ['["amenity"="parking"]'],
    /* A parkolók többsége felület, nem pont — azoknak a középpontja kell. */
    utakIs: true,
  },
  kilato: {
    nev: 'Kilátó',
    tipus: 'kilato',
    szin: SZINEK.celpont,
    gombSzin: GOMB_SZINEK.celpont,
    tomor: true,
    sugar: 6,
    szurok: ['["tourism"="viewpoint"]', '["man_made"="tower"]["tower:type"="observation"]'],
  },
  vendeglatas: {
    nev: 'Büfé, kocsma',
    tipus: 'vendeglatas',
    szin: SZINEK.celpont,
    gombSzin: GOMB_SZINEK.celpont,
    tomor: false,
    sugar: 7,
    szurok: ['["amenity"~"^(restaurant|cafe|pub|fast_food|bar)$"]'],
  },
  /* Látványosságok — a világ bármelyik országában.

     Eddig ez tizenöt kézzel kiválogatott magyar hely volt, letöltött
     képekkel. Azt a formát nem lehetett kiterjeszteni: több ezer kép
     kellett volna, egyenként licencadattal. Így viszont ugyanaz, mint a
     többi réteg — ami az OSM-ben ott van, azt mutatjuk, Izlandtól Japánig.

     A kép a Wikidatán keresztül, KÉRÉSRE jön (lásd kepek.js): amíg rá nem
     koppintasz, egyetlen képet sem tölt le a böngésződ.

     A kilátó külön réteg maradt, ezért a `tourism=viewpoint` itt nincs
     benne: aki kilátót keres, azt kapcsolja be. */
  latvany: {
    nev: 'Látványosság',
    tipus: 'latnivalo',
    /* Egy fokkal közelebbről, mint a többi réteg: ez a leg­nehezebb
       lekérdezés (öt ág, pontokra ÉS felületekre), és a fél megyényi
       területtel az ingyenes Overpass rendszeresen elakadt. Egy zoom­fok
       negyedére csökkenti a területet — ennyi a különbség aközött, hogy
       működik-e vagy időtúllépésbe fut. */
    minZoom: 13,
    szin: SZINEK.celpont,
    gombSzin: GOMB_SZINEK.celpont,
    tomor: true,
    sugar: 9,
    /* Nagyobb korong, közepén világos maggal: a hatodik szín-forma párost
       már kiosztottuk, ez tehát MÉRETBEN és formában válik el, nem színben
       — színtévesztéssel is megkülönböztethető marad. */
    magos: true,
    /* Mindegyik ág megköveteli a NEVET. Két okból: egy név nélküli
       „látnivaló" a buborékban úgysem mond semmit, és — ez a fontosabb —
       enélkül a lekérdezés sűrű városban egyszerűen nem fut le. Rómában
       húsz másodperc alatt sem jött vissza; névre szűrve másodpercek. */
    szurok: [
      '["historic"~"^(castle|ruins|monument|memorial|archaeological_site)$"]["name"]',
      '["tourism"~"^(attraction|museum)$"]["name"]',
      '["waterway"="waterfall"]["name"]',
      '["natural"~"^(cave_entrance|arch)$"]["name"]',
      '["man_made"="lighthouse"]["name"]',
    ],
    /* Vár, rom, múzeum jellemzően felület, nem pont. */
    utakIs: true,
  },
};


export const MIN_ZOOM = 12;
const TERULET_MAX = 400;

export async function teruleten({ del, nyugat, eszak, kelet }, retegId) {
  const reteg = RETEGEK[retegId];
  if (!reteg) throw new SzolgaltatasHiba('Ismeretlen réteg.');

  const doboz = `${del.toFixed(5)},${nyugat.toFixed(5)},${eszak.toFixed(5)},${kelet.toFixed(5)}`;
  const agak = reteg.szurok
    .map((sz) => `node(${doboz})${sz};` + (reteg.utakIs ? `way(${doboz})${sz};` : ''))
    .join('');
  /* A kimenet MÁR A KISZOLGÁLÓNÁL le van vágva.

     Enélkül a látványosságok Budapestre 2854 elemet, 1,3 MB-ot adtak
     vissza — amiből négyszázat rajzolunk ki. A többi csak a közös,
     ingyenes Overpasst terhelte és a hálózatot; a lekérdezés így
     rendszeresen 504-gyel esett el vagy időtúllépésbe futott.

     Eggyel többet kérünk, mint amennyit kirakunk: abból tudjuk, hogy van-e
     még a területen, és ki kell-e írni a „nagyíts rá" jelzést. */
  const adat = await kerdez(
    `[out:json][timeout:40];(${agak});out tags center ${TERULET_MAX + 1};`,
  );

  const osszes = feldolgoz(adat, reteg);
  return {
    lista: osszes.slice(0, TERULET_MAX),
    osszesen: osszes.length,
    levagva: Math.max(0, osszes.length - TERULET_MAX),
  };
}
