/* Szűrés a példa útvonalak között.

   Egy tucat útvonal fölött a sima lista már használhatatlan. A szűrés
   a LEMÉRT adatokból dolgozik (hossz és emelkedő), nem becslésből — ezért
   a „nehéz” itt tényleg nehezet jelent. */

import { hossz } from './utvonalak.js';
import { nehezseg } from './ajanlo.js';

export const HOSSZ_SAVOK = [
  { id: 'rovid', nev: 'Rövid', leiras: '3 km alatt', bele: (km) => km < 3 },
  { id: 'kozepes', nev: 'Közepes', leiras: '3–8 km', bele: (km) => km >= 3 && km <= 8 },
  { id: 'hosszu', nev: 'Hosszú', leiras: '8 km fölött', bele: (km) => km > 8 },
];

export const NEHEZSEGEK = ['Könnyű', 'Közepes', 'Erős', 'Nehéz'];

/* Egy útvonal összes szűrhető jellemzője, egy helyen. */
export function jellemzok(p) {
  const km = hossz(p.pontok);
  const fel = p.emelkedo?.fel ?? null;
  return {
    km,
    fel,
    tajegyseg: p.hol,
    hosszSav: HOSSZ_SAVOK.find((s) => s.bele(km))?.id ?? 'kozepes',
    nehezseg: nehezseg(km, fel).szo,
  };
}

export function szur(peldak, { tajegyseg, hosszSav, nehezsegek }) {
  return peldak.filter((p) => {
    const j = jellemzok(p);
    if (tajegyseg && j.tajegyseg !== tajegyseg) return false;
    if (hosszSav && j.hosszSav !== hosszSav) return false;
    if (nehezsegek?.length && !nehezsegek.includes(j.nehezseg)) return false;
    return true;
  });
}

export const tajegysegek = (peldak) =>
  [...new Set(peldak.map((p) => p.hol))].sort((a, b) => a.localeCompare(b, 'hu'));
