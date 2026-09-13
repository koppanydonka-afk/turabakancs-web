import { sz } from '../nyelv/index.js';
/* Ösvényre húzás.

   Eddig a két kattintás közé egyenest húztunk, és ebből minden szám hibás
   lett: a táv rövidebbnek, az emelkedő laposabbnak látszott a valóságnál.
   Ez a modul a megrajzolt pontokat ráteszi a tényleges gyalogutakra.

   A szolgáltatás a FOSSGIS közösségi OSRM-je, gyalogos profillal — kulcs és
   számlázási fiók nélkül. Cserébe közös erőforrás, ezért a hívó dolga, hogy
   ne ágyúzza: a tervező másfél másodpercet vár az utolsó változás után, így
   egy útvonalrajzolásból néhány kérés lesz, nem annyi, ahányat kattintottak.
   A kérés mindig a kattintott pontokból indul, sosem az előző eredményből —
   különben a vonal lépésről lépésre eltorzulna. */

const VEGPONT = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

/* Az OSRM demó egy kérésben korlátozott számú pontot vesz. Ennél több
   töréspontnál úgyis kézzel érdemes darabolni. */
const MAX_PONT = 90;

export class UtvonalHiba extends Error {}

export async function osvenyreHuz(pontok) {
  if (pontok.length < 2) {
    throw new UtvonalHiba(sz('ut.ketPont'));
  }
  if (pontok.length > MAX_PONT) {
    throw new UtvonalHiba(
      sz('ut.tulSokPont', { max: MAX_PONT }),
    );
  }

  /* Az OSRM hosszúság–szélesség sorrendet vár, fordítva, mint a Leaflet. */
  const koordinatak = pontok.map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(';');

  let valasz;
  try {
    valasz = await fetch(`${VEGPONT}/${koordinatak}?overview=full&geometries=geojson`);
  } catch {
    throw new UtvonalHiba(sz('ut.nemErheto'));
  }

  if (valasz.status === 429) {
    throw new UtvonalHiba(sz('ut.tulSok'));
  }
  if (!valasz.ok) {
    throw new UtvonalHiba(sz('ut.hibat'));
  }

  const adat = await valasz.json();
  if (adat.code !== 'Ok' || !adat.routes?.length) {
    throw new UtvonalHiba(
      adat.code === 'NoRoute'
        ? sz('ut.nincsGyalogut2')
        : sz('ut.nemSikerult'),
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
