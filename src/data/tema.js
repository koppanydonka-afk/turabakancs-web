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

export const useTema = () =>
  useSyncExternalStore(feliratkozas, () => olvas() ?? 'rendszer', () => 'rendszer');
