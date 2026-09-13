/* Hol nézzük az időt.

   A hőmérséklet a fejlécben van, a túra helye viszont a tervezőben dől el —
   a kettő nem szülő-gyerek, ezért kell egy közös pont köztük. Ugyanaz a
   minta, mint a sötét módnál: egy modulszintű érték és feliratkozók.

   Nem tárolunk semmit: ez az érték a lap bezárásáig él, és nem is hagyja el
   a böngészőt azon túl, hogy az Open-Meteo megkapja a koordinátát. */

import { useSyncExternalStore } from 'react';

let hely = null;             // [szelesseg, hosszusag] vagy null
const figyelok = new Set();

export function idoHelyBeallit(uj) {
  /* Három tizedes ≈ száz méter. Ennél kisebb mozdulás ugyanaz a hely: a
     rajzolás így nem indít újabb kérdést minden kattintásnál. */
  const kerek = uj ? [Number(uj[0].toFixed(3)), Number(uj[1].toFixed(3))] : null;
  if (!hely && !kerek) return;
  if (hely && kerek && hely[0] === kerek[0] && hely[1] === kerek[1]) return;
  hely = kerek;
  figyelok.forEach((f) => f());
}

const feliratkozas = (f) => {
  figyelok.add(f);
  return () => figyelok.delete(f);
};

/* Az előállításkor (szerveroldalon) nincs hely — ilyenkor a fejléc
   hőmérséklet nélkül kerül a kész HTML-be, és a böngészőben jelenik meg. */
export const useIdoHely = () => useSyncExternalStore(feliratkozas, () => hely, () => null);
