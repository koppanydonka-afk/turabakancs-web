/* Sötét mód. Alapból a rendszer beállítását követi; ha a látogató kézzel
   vált, azt megjegyezzük ebben a böngészőben. */

import { useSyncExternalStore } from 'react';

const KULCS = 'turabakancs-tema';
const REGI_KULCS = 'nyomvonal-tema';   // az oldal korábbi neve
const figyelok = new Set();

function olvas() {
  try {
    return localStorage.getItem(KULCS) ?? localStorage.getItem(REGI_KULCS);
  } catch {
    return null;
  }
}

export function temaAlkalmaz() {
  const t = olvas();
  if (t) document.documentElement.dataset.tema = t;
  else delete document.documentElement.dataset.tema;
}

export function temaValt() {
  const mostSotet =
    olvas() === 'sotet' ||
    (!olvas() && window.matchMedia('(prefers-color-scheme: dark)').matches);
  try {
    localStorage.setItem(KULCS, mostSotet ? 'vilagos' : 'sotet');
  } catch {
    /* Ha nem lehet menteni, legalább erre a látogatásra váltson. */
  }
  temaAlkalmaz();
  figyelok.forEach((f) => f());
}

const feliratkozas = (f) => {
  figyelok.add(f);
  return () => figyelok.delete(f);
};

/* Sötét-e MOST a felület — a rendszerbeállítást is beleszámítva.

   A CSS-nek elég a `data-tema` attribútum és a médialekérdezés, a
   térképnek viszont nem: a MapLibre-nek egész stíluslapot kell váltania,
   ahhoz pedig egy igen/nem kell. Ez a horog azt adja meg, és akkor is
   szól, ha a látogató a rendszer szintjén vált sötétre. */
export function useSotet() {
  return useSyncExternalStore(
    (ertesit) => {
      figyelok.add(ertesit);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', ertesit);
      return () => {
        figyelok.delete(ertesit);
        mq.removeEventListener('change', ertesit);
      };
    },
    () => {
      const t = olvas();
      if (t === 'sotet') return true;
      if (t === 'vilagos') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    },
    /* Előállításkor nincs böngésző: a világos a kiindulás. */
    () => false,
  );
}

export const useTema = () =>
  useSyncExternalStore(feliratkozas, () => olvas() ?? 'rendszer', () => 'rendszer');
