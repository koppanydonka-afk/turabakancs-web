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
  if (q.length < 3) throw new HelyHiba('Írj be legalább három betűt.');

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
    throw new HelyHiba('A helykereső most nem érhető el.');
  }
  if (!valasz.ok) throw new HelyHiba('A helykereső most nem válaszol.');

  const adat = await valasz.json();
  if (!adat.length) throw new HelyHiba(`Erre nem találtam helyet: „${q}”`);

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
