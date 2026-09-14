/* Az ösvény mértana — közösen a háttérnek és a lap elrendezésének.

   A háttérfotón egy erdei út fut, és görgetésre egy vonal halad végig
   rajta (lásd `components/ErdoHatter.jsx`). A vonal FEJE néha a képernyő
   bal, néha a jobb felén jár — és a tartalom akkor jó, ha nem áll épp
   ott. Ezért a lap ide fordul megkérdezni, merre tart az út. */

import { useEffect } from 'react';
import { KEP_MAGAS, KEP_SZELES } from './data/erdoUt.js';

/* Görgetés nélkül is látszódjon, hogy van vonal: ennyivel indul. */
export const ELONY = 0.045;

export const halad = (arany) => Math.min(1, ELONY + (1 - ELONY) * arany);

/* A vászon „cover” szélessége egy adott ablakhoz. Ugyanaz a képlet, ami a
   CSS-ben áll: `max(100%, 100vh * 2000 / 1125)`. */
export const vaszonSzelesseg = (vw, vh) => Math.max(vw, (vh * KEP_SZELES) / KEP_MAGAS);

/* A kivágat állása. A kép ÁLL: ami nem fér a képernyőre, az egyenlően lóg
   ki a két oldalon. (Korábban a vonal feje után csúszott, de a háttér
   folytonos mozgása görgetés közben zavaró volt — a vonal halad, a kép
   marad.) */
export function kamera(vw, vh) {
  const w = vaszonSzelesseg(vw, vh);
  return { w, eltolas: Math.max(0, w - vw) / 2 };
}

/* Egy nyomvonalpont helye a képernyőn, a szélesség arányában:
   0 = bal szél, 1 = jobb szél. A nullán kívüli érték a képen kívül van. */
export const kepernyon = (p, { w, eltolas }, vw) => ((p.x / KEP_SZELES) * w - eltolas) / vw;

/* ---------- Az állomások oldala ----------

   Minden állomásnál végignézzük, hol jár a vonal azalatt, amíg az állomás
   a képernyőn van — öt pillanatban, a belépéstől a kilépésig. Nem csak a
   FEJ számít: a mögötte kirajzolt szakasz is látszik, és arra sem szabad
   ráülni. Ezért minden pillanatban végigmintázzuk a megtett vonalat, és
   megnézzük, melyik félre esik többje.

   A fej külön súlyt kap: az a szem célpontja, azt takarni a legrosszabb.

   Az oldalváltás csak vízszintesen mozdít, a magasságokhoz nem nyúl — a
   mérés tehát egy körben elvégezhető, utána jöhet az írás. */
const PILLANATOK = 5;
const VONAL_MINTAK = 24;
const FEJ_SULYA = 10;

export function useAllomasOldalak(kulcs) {
  useEffect(() => {
    const ut = document.querySelector('.erdo-szin__ut-elore');
    /* Amelyik állomásnak KÉZZEL adtunk oldalt, ahhoz nem nyúlunk: a
       tervezés néha erősebb szempont, mint az, hol jár épp a vonal. */
    const allomasok = Array.from(document.querySelectorAll('[data-allomas]:not([data-allomas-fix])'));
    if (!ut || allomasok.length === 0) return undefined;

    /* Negatív: a vonal inkább balra jár. Pozitív: inkább jobbra. */
    const merleg = (arany, hossz, vw, vh) => {
      const h = halad(arany);
      const fej = ut.getPointAtLength(hossz * h);
      const kam = kamera(vw, vh);
      let osszeg = 0;
      for (let k = 0; k <= VONAL_MINTAK; k += 1) {
        const p = ut.getPointAtLength(hossz * h * (k / VONAL_MINTAK));
        const x = kepernyon(p, kam, vw);
        if (x < 0 || x > 1) continue;   // ez a szakasz nincs a képen
        osszeg += x < 0.5 ? -1 : 1;
      }
      return osszeg + FEJ_SULYA * (kepernyon(fej, kam, vw) < 0.5 ? -1 : 1);
    };

    const rendez = () => {
      const hossz = ut.getTotalLength();
      if (!hossz) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const futas = document.documentElement.scrollHeight - vh;
      /* Előbb minden mérés, utána minden írás: így nem kérünk a
         böngészőtől elrendezést minden egyes állomásnál újra. */
      const dobozok = allomasok.map((el) => {
        const d = el.getBoundingClientRect();
        return { teteje: d.top + window.scrollY, magas: d.height };
      });
      const oldalak = dobozok.map(({ teteje, magas }) => {
        let osszeg = 0;
        for (let i = 0; i < PILLANATOK; i += 1) {
          /* A görgetés állása, amikor az állomás épp belép (−vh) és
             amikor épp kimegy (+ a saját magassága). */
          const gorgetes = teteje - vh + ((magas + vh) * (i + 0.5)) / PILLANATOK;
          const arany = futas <= 0 ? 1 : Math.min(1, Math.max(0, gorgetes / futas));
          osszeg += merleg(arany, hossz, vw, vh);
        }
        return osszeg < 0 ? 'jobb' : 'bal';
      });
      allomasok.forEach((el, i) => { el.dataset.allomas = oldalak[i]; });
    };

    rendez();
    window.addEventListener('resize', rendez);
    return () => window.removeEventListener('resize', rendez);
  }, [kulcs]);
}
