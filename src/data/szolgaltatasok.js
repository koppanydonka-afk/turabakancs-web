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

/* Overpass-címke → a saját jelöléstípusaink. Így a találatok ugyanazzal az
   ikonnal jelennek meg, amit a felhasználó kézzel is kirakhat, és egy
   kattintással beemelhetők a tervbe. */
const KERESETT = [
  { szuro: '["amenity"="drinking_water"]', tipus: 'forras', nev: 'Ivóvíz', ivasra: true },
  { szuro: '["natural"="spring"]', tipus: 'forras', nev: 'Forrás', ivasra: null },
  { szuro: '["amenity"="shelter"]', tipus: 'pihen', nev: 'Esőbeálló' },
  { szuro: '["tourism"="wilderness_hut"]', tipus: 'pihen', nev: 'Menedékház' },
  { szuro: '["tourism"="alpine_hut"]', tipus: 'pihen', nev: 'Turistaház' },
];

const MEGALLOK = [
  { szuro: '["railway"="station"]', tipus: 'kozlekedes', nev: 'Vasútállomás' },
  { szuro: '["railway"="halt"]', tipus: 'kozlekedes', nev: 'Megállóhely' },
  { szuro: '["highway"="bus_stop"]', tipus: 'kozlekedes', nev: 'Buszmegálló' },
];

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

function feldolgoz(adat, keresett) {
  const szotar = new Map(keresett.map((k) => [k.szuro, k]));
  return (adat.elements ?? [])
    .map((e) => {
      const hely = [e.lat ?? e.center?.lat, e.lon ?? e.center?.lon];
      if (!Number.isFinite(hely[0]) || !Number.isFinite(hely[1])) return null;

      /* Melyik szűrőre illik: a címkéiből döntjük el, mert az Overpass nem
         mondja meg, a unió melyik ága találta. */
      const t = e.tags ?? {};
      let fajta = null;
      if (t.amenity === 'drinking_water') fajta = szotar.get('["amenity"="drinking_water"]');
      else if (t.natural === 'spring') fajta = szotar.get('["natural"="spring"]');
      else if (t.amenity === 'shelter') fajta = szotar.get('["amenity"="shelter"]');
      else if (t.tourism === 'wilderness_hut') fajta = szotar.get('["tourism"="wilderness_hut"]');
      else if (t.tourism === 'alpine_hut') fajta = szotar.get('["tourism"="alpine_hut"]');
      else if (t.railway === 'station') fajta = szotar.get('["railway"="station"]');
      else if (t.railway === 'halt') fajta = szotar.get('["railway"="halt"]');
      else if (t.highway === 'bus_stop') fajta = szotar.get('["highway"="bus_stop"]');
      if (!fajta) return null;

      /* Ivhatóság CSAK víznél értelmes, és ott is óvatosan:
           igen  – ivásra szánták, vagy az OSM külön kimondja
           nem   – az OSM kimondja, hogy nem iható
           null  – forrás, amiről nincs adat: lehet jó, lehet kiszáradt
         Esőbeállónál, megállónál ez a mező nem létezik, hogy a felület
         véletlenül se tehessen rá „iható” címkét. */
      const ivasra =
        fajta.tipus !== 'forras'
          ? undefined
          : t.drinking_water === 'no'
            ? false
            : t.drinking_water === 'yes'
              ? true
              : (fajta.ivasra ?? null);

      return {
        id: `${e.type}/${e.id}`,
        tipus: fajta.tipus,
        fajta: fajta.nev,
        nev: t.name || fajta.nev,
        ivasra,
        szezonos: t.seasonal === 'yes',
        lat: hely[0],
        lng: hely[1],
      };
    })
    .filter(Boolean)
    /* Ugyanannak a dolognak néha két bejegyzése van az OSM-ben (külön csap
       és külön kút ugyanarra a kútra). Ami azonos fajta és ötven méteren
       belül van, azt egynek vesszük. */
    .filter((x, i, lista) =>
      !lista.some(
        (y, j) => j < i && y.tipus === x.tipus && tavolsag([y.lat, y.lng], [x.lat, x.lng]) < 0.05,
      ),
    );
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

/* A rétegek SAJÁT színt kapnak, nem a jelöléstípusokét.

   A jelölőknél a forrás #0E7490, a megálló #0F766E — ezek fehér tűben, egymás
   mellett jól elválnak, de hatpixeles pöttyként a térképen nem: a két szín
   világosságkontrasztja egymáshoz képest 1,02:1, gyakorlatilag ugyanaz.

   Helyette kék–borostyán pár, mérve:
     víz     #075985  fehér kerethez 7,56:1
     megálló #D97706  fehér kerethez 3,19:1
     egymáshoz világosságban 2,37:1
   A kék–sárga tengely a vörös-zöld színtévesztésnek is a legbiztosabb párja;
   szimulálva 201 egységre esnek egymástól. A méret is eltér (6 és 5 képpont),
   hogy ne csak a szín különböztesse meg őket. */
export const RETEGEK = {
  viz: {
    nev: 'Ivóvíz, forrás',
    tipus: 'forras',
    szin: '#075985',
    sugar: 6,
    szurok: ['["amenity"="drinking_water"]', '["natural"="spring"]'],
  },
  kozlekedes: {
    nev: 'Megálló, állomás',
    tipus: 'kozlekedes',
    szin: '#D97706',
    sugar: 5,
    szurok: ['["highway"="bus_stop"]', '["railway"="station"]', '["railway"="halt"]'],
  },
};

export const MIN_ZOOM = 12;
const TERULET_MAX = 400;

export async function teruleten({ del, nyugat, eszak, kelet }, retegId) {
  const reteg = RETEGEK[retegId];
  if (!reteg) throw new SzolgaltatasHiba('Ismeretlen réteg.');

  const doboz = `${del.toFixed(5)},${nyugat.toFixed(5)},${eszak.toFixed(5)},${kelet.toFixed(5)}`;
  const agak = reteg.szurok.map((sz) => `node(${doboz})${sz};`).join('');
  const adat = await kerdez(`[out:json][timeout:40];(${agak});out tags center;`);

  const osszes = feldolgoz(adat, KERESETT.concat(MEGALLOK));
  return {
    lista: osszes.slice(0, TERULET_MAX),
    osszesen: osszes.length,
    levagva: Math.max(0, osszes.length - TERULET_MAX),
  };
}
