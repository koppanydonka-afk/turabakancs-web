/* „Mi van a közelben?”

   A megadott kiindulóponthoz megkeresi a legközelebbi példa útvonalakat.
   Légvonalban számol — nem azt mondja meg, mennyi az odaút, hanem hogy
   melyik túra esik közel. Az odajutás külön kérdés, arra való a
   „honnan hova” keresés. */

import { tavolsag, hossz } from './utvonalak.js';
import { nehezseg } from './ajanlo.js';
import { peldaUtvonalak } from './peldak.js';
import { ertekelesSzerint } from './ertekelesek.js';

/* Egy útvonal „helye”: a rajtpontja. Oda kell eljutni. */
const rajtpont = (p) => p.pontok[0];

export function kozeliTurak(honnan, { darab = 4, maxKm = 120 } = {}) {
  return peldaUtvonalak
    .map((p) => {
      const km = hossz(p.pontok);
      return {
        utvonal: p,
        legvonal: tavolsag(honnan, rajtpont(p)),
        km,
        nehezseg: nehezseg(km, p.emelkedo?.fel).szo,
        ertekeles: ertekelesSzerint(p.id),
      };
    })
    .filter((x) => x.legvonal <= maxKm)
    .sort((a, b) => a.legvonal - b.legvonal)
    .slice(0, darab);
}

/* Hozzávetőleges autós menetidő a légvonalból.

   Szándékosan durva becslés, és ezt ki is írjuk: az igazi úthossz a
   kanyarok miatt jellemzően 20–30 százalékkal több a légvonalnál, a
   sebesség pedig útfajtánként változik. Arra jó, hogy eldöntsd, „egy óra
   vagy három” — nem arra, hogy percre tervezz. */
export function autosBecsles(legvonalKm) {
  const utKm = legvonalKm * 1.3;
  /* Folytonos sebességgörbe: rövid úton városi tempó, hosszabb úton egyre
     több gyorsforgalmi. Sávos változatnál előfordult, hogy egy hosszabb
     útra rövidebb időt adott — ez a görbe mindig növekvő. */
  const atlagSebesseg = Math.min(85, 35 + legvonalKm * 0.7);
  const perc = Math.round((utKm / atlagSebesseg) * 60);
  return { utKm, perc };
}

export const percSzoveg = (p) =>
  p < 60 ? `${p} perc` : `${Math.floor(p / 60)} ó ${String(p % 60).padStart(2, '0')} p`;
