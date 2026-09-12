/* Ösvényre húzás.

   Eddig a két kattintás közé egyenest húztunk, és ebből minden szám hibás
   lett: a táv rövidebbnek, az emelkedő laposabbnak látszott a valóságnál.
   Ez a modul a megrajzolt pontokat ráteszi a tényleges gyalogutakra.

   A szolgáltatás a FOSSGIS közösségi OSRM-je, gyalogos profillal — kulcs és
   számlázási fiók nélkül. Cserébe közös erőforrás, ezért CSAK gombnyomásra
   kérdez, soha nem magától: rajzolás közben minden kattintás egy kérés
   lenne, az pedig visszaélés. */

const VEGPONT = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

/* Az OSRM demó egy kérésben korlátozott számú pontot vesz. Ennél több
   töréspontnál úgyis kézzel érdemes darabolni. */
const MAX_PONT = 90;

export class UtvonalHiba extends Error {}

export async function osvenyreHuz(pontok) {
  if (pontok.length < 2) {
    throw new UtvonalHiba('Legalább két pont kell hozzá.');
  }
  if (pontok.length > MAX_PONT) {
    throw new UtvonalHiba(
      `Egyszerre legfeljebb ${MAX_PONT} pontot tudok ösvényre húzni. Törölj néhányat, vagy darabold szakaszokra.`,
    );
  }

  /* Az OSRM hosszúság–szélesség sorrendet vár, fordítva, mint a Leaflet. */
  const koordinatak = pontok.map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';');

  let valasz;
  try {
    valasz = await fetch(`${VEGPONT}/${koordinatak}?overview=full&geometries=geojson`);
  } catch {
    throw new UtvonalHiba('Az útvonalkereső most nem érhető el. Próbáld később.');
  }

  if (valasz.status === 429) {
    throw new UtvonalHiba('Túl sok kérés ment ki rövid idő alatt. Várj egy kicsit.');
  }
  if (!valasz.ok) {
    throw new UtvonalHiba('Az útvonalkereső hibát adott.');
  }

  const adat = await valasz.json();
  if (adat.code !== 'Ok' || !adat.routes?.length) {
    throw new UtvonalHiba(
      adat.code === 'NoRoute'
        ? 'Ezek közt a pontok közt nem találtam gyalogutat. Lehet, hogy vízen vagy úttalan területen visz át.'
        : 'Nem sikerült útvonalat találni.',
    );
  }

  const ut = adat.routes[0];
  return {
    /* Vissza Leaflet-sorrendbe. */
    pontok: ut.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    km: ut.distance / 1000,
    /* Az OSRM saját menetidő-becslése; mi a sajátunkat használjuk, de
       összevetésre jó. */
    osrmPerc: Math.round(ut.duration / 60),
  };
}

/* A visszakapott vonal több száz pontból áll. A szerkeszthetőséghez és a
   megosztható link hosszához ritkítani kell — ugyanaz a megfontolás, mint a
   jelzett turistautaknál. */
export function ritkit(pontok, max = 250) {
  if (pontok.length <= max) return pontok;
  const lepes = pontok.length / max;
  const ki = [];
  for (let i = 0; i < max; i += 1) ki.push(pontok[Math.floor(i * lepes)]);
  ki.push(pontok[pontok.length - 1]);
  return ki;
}
