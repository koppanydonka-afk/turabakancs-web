import { sz } from '../nyelv/index.js';
/* Helynév → koordináta, bárhol a világon.

   Az OpenStreetMap nyilvános keresője (Nominatim) válaszol. Csak
   gombnyomásra kérdez, soha nem gépelés közben — a Nominatim közös,
   ingyenes erőforrás, a folyamatos lekérdezés visszaélés lenne. */

const VEGPONT = 'https://nominatim.openstreetmap.org/search';

export class HelyHiba extends Error {}

function rovidNev(teljes) {
  /* A Nominatim hosszú láncot ad vissza; az első két-három tag elég. */
  return teljes.split(',').slice(0, 3).join(',').trim();
}

export async function keresHelyet(szoveg, { darab = 5, nyelv = 'hu' } = {}) {
  const q = (szoveg ?? '').trim();
  if (q.length < 3) throw new HelyHiba(sz('hiba.haromBetu'));

  /* Nincs országszűrő: az oldal a világ bármelyik pontjára tervez. Korábban
     `countrycodes: 'hu'` volt itt, és ez volt az EGYETLEN hely, ami tényleg
     Magyarországhoz kötötte a tervezőt — a térkép, az útvonalkereső és a
     rétegek amúgy is határok nélkül működnek.

     A találatok nyelve a felületé: aki németül nézi az oldalt, német
     helyneveket kapjon, ahol az OSM tud ilyet. */
  const p = new URLSearchParams({
    format: 'jsonv2',
    limit: String(darab),
    'accept-language': nyelv,
    q,
  });

  let valasz;
  try {
    /* A Nominatim elutasítja a névtelen hívót. A böngésző a saját
       azonosítóját küldi, ezért ott ez a fejléc figyelmen kívül marad —
       a kiszolgáló oldali teszteléshez viszont kell. */
    valasz = await fetch(`${VEGPONT}?${p}`, {
      headers: { 'User-Agent': 'Turabakancs/0.1 (helykereses; turabakancs.com)' },
    });
  } catch {
    throw new HelyHiba(sz('hiba.helykereso'));
  }
  if (!valasz.ok) throw new HelyHiba(sz('hiba.helykeresoNema'));

  const adat = await valasz.json();
  if (!adat.length) throw new HelyHiba(sz('hiba.nincsHely', { mit: q }));

  return adat.map((t) => ({
    nev: rovidNev(t.display_name),
    teljesNev: t.display_name,
    pont: [Number(t.lat), Number(t.lon)],
  }));
}

/* Egyetlen találat — ha több van, az elsőt adja, de a többit is visszaadja,
   hogy a felület fel tudja kínálni őket. */
export async function elsoTalalat(szoveg) {
  const talalatok = await keresHelyet(szoveg);
  return { valasztott: talalatok[0], tobbi: talalatok.slice(1) };
}


/* ---- Javaslatok gépelés közben ----

   A Nominatim nem erre való: a használati feltétele kifejezetten tiltja a
   gépelésenkénti lekérdezést, ezért futott eddig csak gombnyomásra. A
   Photon viszont PONT erre készült (a komoot üzemelteti, kulcs nélkül),
   és mérve 300 ezredmásodperc körül válaszol — ennyitől lesz olyan
   érzése a keresőnek, mint a nagy térképeknél.

   Az utolsó kérés nyer: gyors gépelésnél a korábbiakat megszakítjuk,
   különben egy lassabb, régebbi válasz felülírná a frisset. */

const PHOTON = 'https://photon.komoot.io/api/';
let futoJavaslat = null;

/* A Photon NÉGY nyelvet ismer; minden másra 400-at ad. A `default` a hely
   saját nevét adja vissza — magyar helyeknél épp a magyart —, tehát a
   maradék hat nyelvnek ez a jó válasz, nem az angol.

   Ezt méréssel derítettük ki: `lang=hu` hibát adott, és mivel a hívást
   `catch` védi, a javaslatok némán sosem jelentek volna meg. */
const PHOTON_NYELVEK = new Set(['en', 'de', 'fr']);

/* A Photon a nevet és a környezetét külön mezőkben adja. Egy sorba fűzzük
   őket, de csak azt, ami tényleg hozzátesz — „Budapest, Budapest” nem. */
function javaslatNeve(t) {
  const reszek = [t.name, t.city ?? t.district, t.state, t.country];
  const tiszta = [];
  for (const r of reszek) {
    if (r && !tiszta.includes(r)) tiszta.push(r);
  }
  return tiszta.slice(0, 3).join(', ');
}

export async function javaslatok(szoveg, { nyelv = 'hu', darab = 5 } = {}) {
  const q = (szoveg ?? '').trim();
  if (q.length < 3) return [];

  futoJavaslat?.abort();
  const megszakit = new AbortController();
  futoJavaslat = megszakit;

  const p = new URLSearchParams({
    q,
    limit: String(darab),
    lang: PHOTON_NYELVEK.has(nyelv) ? nyelv : 'default',
  });
  try {
    const valasz = await fetch(`${PHOTON}?${p}`, { signal: megszakit.signal });
    if (!valasz.ok) return [];
    const adat = await valasz.json();
    return (adat.features ?? [])
      .map((f) => ({
        nev: javaslatNeve(f.properties ?? {}),
        pont: [f.geometry?.coordinates?.[1], f.geometry?.coordinates?.[0]],
      }))
      .filter((x) => x.nev && Number.isFinite(x.pont[0]) && Number.isFinite(x.pont[1]));
  } catch {
    /* Megszakítás vagy hálózati hiba: javaslat nélkül is lehet keresni,
       a gomb továbbra is a Nominatimot kérdezi. */
    return [];
  }
}
