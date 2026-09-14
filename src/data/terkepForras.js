/* A térkép stíluslapjának lekérése — egyszer, és jó előre.

   MIÉRT ITT, ÉS NEM A TÉRKÉPBEN: a betöltés eddig szigorúan soros lánc
   volt. Élesben mérve a tervezőn:

     226–357 ms   a fő kód
     451–599 ms   a térkép darabja (294 kB)
     614–738 ms   a stíluslap        ← csak ezután indult
     763–834 ms   a csempeleírás és a jelkészlet
     1015 ms–     a betűk, majd a csempék

   A stíluslap címe állandó (a sötét változatot magunk festjük, lásd
   terkepStilus.js), tehát nem kell megvárni vele a térkép kódját: a
   kérés elindulhat abban a pillanatban, amikor kiderül, hogy térkép
   lesz — a 294 kB letöltésével PÁRHUZAMOSAN.

   Ezért van a kérés külön modulban: a késve érkező térkép és a fő kódban
   futó burkolat (TerkepKesobb.jsx) ugyanezt az egy ígéretet használja. */

export const STILUS_CIM = 'https://tiles.openfreemap.org/styles/liberty';

/* Nyolc másodperc után feladjuk — ennyi idő után a látogató már azt
   hiszi, elromlott valami, és jobban jár a raszteres tartalékkal. */
const TURELEM_MS = 8000;

let igeret = null;

async function kerd() {
  const megszakit = new AbortController();
  const ora = setTimeout(() => megszakit.abort(), TURELEM_MS);
  try {
    const valasz = await fetch(STILUS_CIM, { signal: megszakit.signal });
    if (!valasz.ok) throw new Error(String(valasz.status));
    return { stilus: await valasz.json(), tartalek: false };
  } catch {
    return { stilus: null, tartalek: true };
  } finally {
    clearTimeout(ora);
  }
}

/* Egy látogatáson belül egyszer kérdezünk. A témaváltás is ezt kapja
   vissza, tehát nem jár újabb kéréssel. */
export function stilustKer() {
  if (!igeret) igeret = kerd();
  return igeret;
}
