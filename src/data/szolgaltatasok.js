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

const VEGPONT = 'https://overpass-api.de/api/interpreter';

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

async function kerdez(lekerdezes) {
  let valasz;
  try {
    valasz = await fetch(VEGPONT, {
      method: 'POST',
      headers: { 'User-Agent': 'Turabakancs/0.1 (szolgaltatasok; turabakancs-terkep)' },
      body: new URLSearchParams({ data: lekerdezes }),
    });
  } catch {
    throw new SzolgaltatasHiba('Az OpenStreetMap keresője most nem érhető el.');
  }
  if (valasz.status === 429 || valasz.status === 504) {
    throw new SzolgaltatasHiba('A kereső most túlterhelt. Próbáld pár másodperc múlva.');
  }
  if (!valasz.ok) throw new SzolgaltatasHiba('A keresés nem sikerült.');
  return valasz.json();
}

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

/* A lekérdezésbe nem fér bele kétszázötven koordináta, de nem is kell: az
   `around` sugara elfedi a köztes szakaszt, ha a mintavétel elég sűrű.
   Azért kötjük a sávszélességhez, hogy ritka pontoknál se maradjon lyuk. */
function mintavetel(pontok, savMeter) {
  const lepesKm = (savMeter / 1000) * 1.2;
  const ki = [pontok[0]];
  let utolso = pontok[0];
  for (const p of pontok.slice(1, -1)) {
    if (tavolsag(utolso, p) >= lepesKm) {
      ki.push(p);
      utolso = p;
    }
  }
  ki.push(pontok[pontok.length - 1]);
  return ki.slice(0, 120);
}

/* Hányadik kilométernél éred el. A legközelebbi nyomvonalpontig mért
   menetirányú távolság — a pontok sűrűsége (~60 m) bőven elég ehhez. */
function utMenten(pontok, hely) {
  let osszeg = 0;
  let legjobbKm = 0;
  let legkisebb = Infinity;
  for (let i = 0; i < pontok.length; i += 1) {
    if (i > 0) osszeg += tavolsag(pontok[i - 1], pontok[i]);
    const t = tavolsag(pontok[i], hely);
    if (t < legkisebb) {
      legkisebb = t;
      legjobbKm = osszeg;
    }
  }
  return { utKm: legjobbKm, eltavolodasM: Math.round(legkisebb * 1000) };
}

function feldolgoz(adat, keresett, pontok) {
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

      const { utKm, eltavolodasM } = pontok ? utMenten(pontok, hely) : { utKm: 0, eltavolodasM: 0 };

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
        utKm,
        eltavolodasM,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.utKm - b.utKm)
    /* Ugyanannak a dolognak néha két bejegyzése van az OSM-ben (külön csap
       és külön kút ugyanarra a kútra). Ami azonos fajta és ötven méteren
       belül van, azt egynek vesszük. */
    .filter((x, i, lista) =>
      !lista.some(
        (y, j) => j < i && y.tipus === x.tipus && tavolsag([y.lat, y.lng], [x.lat, x.lng]) < 0.05,
      ),
    );
}

/* ---- Az útvonal menti ellátás ---- */

/* Városon átmenő vonalnál százas nagyságrendű találat is lehet. Az
   oldalsávban ez használhatatlan, és nem is segít: a huszonegyedik ivókút
   nem mond többet, mint az első húsz. Ezért a vonalhoz legközelebbieket
   tartjuk meg, de a teljes darabszámot is visszaadjuk, hogy a felület ne
   hallgassa el, mennyit vágtunk le. */
const LISTA_MAX = 20;

export async function utMentiek(pontok, { savMeter = 500 } = {}) {
  if (!Array.isArray(pontok) || pontok.length < 2) {
    throw new SzolgaltatasHiba('Előbb rajzolj vagy tölts be egy útvonalat.');
  }
  const minta = mintavetel(pontok, savMeter);
  const koordinatak = minta.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(',');
  const agak = KERESETT.map(
    (k) => `node(around:${savMeter},${koordinatak})${k.szuro};`,
  ).join('');

  const adat = await kerdez(`[out:json][timeout:40];(${agak});out tags center;`);
  const osszes = feldolgoz(adat, KERESETT, pontok);

  const szamlalo = {
    ivhato: osszes.filter((x) => x.tipus === 'forras' && x.ivasra === true).length,
    forras: osszes.filter((x) => x.tipus === 'forras' && x.ivasra !== true && x.ivasra !== false).length,
    menedek: osszes.filter((x) => x.tipus === 'pihen').length,
  };

  /* A kivágás a vonaltól mért távolság szerint megy — ami mellette van, az
     hasznosabb, mint ami félkilométeres kitérő. A megjelenítés viszont
     útirány szerint marad, mert a túrázó úgy találkozik velük. */
  const lista = [...osszes]
    .sort((a, b) => a.eltavolodasM - b.eltavolodasM)
    .slice(0, LISTA_MAX)
    .sort((a, b) => a.utKm - b.utKm);

  return { lista, osszesen: osszes.length, levagva: Math.max(0, osszes.length - lista.length), szamlalo };
}

/* ---- Megközelítés: megállók a rajt és a cél körül ---- */

export async function megallok(hely, { savMeter = 1500 } = {}) {
  if (!Array.isArray(hely) || hely.length !== 2) {
    throw new SzolgaltatasHiba('Nincs hely, ami köré keresni lehetne.');
  }
  const koord = `${hely[0].toFixed(5)},${hely[1].toFixed(5)}`;
  const agak = MEGALLOK.map((k) => `node(around:${savMeter},${koord})${k.szuro};`).join('');
  const adat = await kerdez(`[out:json][timeout:30];(${agak});out tags center;`);

  return feldolgoz(adat, MEGALLOK, null)
    .map((m) => ({ ...m, tavolsagM: Math.round(tavolsag(hely, [m.lat, m.lng]) * 1000) }))
    .sort((a, b) => a.tavolsagM - b.tavolsagM)
    .slice(0, 8);
}

/* ---- Összefoglaló a tanácsadónak ---- */

export function vizOsszegzes(lista) {
  const vizek = lista.filter((x) => x.tipus === 'forras' && x.ivasra !== false);
  const ivhato = vizek.filter((x) => x.ivasra === true);
  return {
    osszes: vizek.length,
    ivhato: ivhato.length,
    elso: ivhato[0] ?? vizek[0] ?? null,
    /* Csak forrás van, igazolt ivóvíz nincs: ezt ki kell mondani. */
    csakForras: vizek.length > 0 && ivhato.length === 0,
  };
}
