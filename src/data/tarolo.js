/* Mentett tervek — kizárólag ebben a böngészőben.

   Nincs szerver, nincs fiók: a localStorage a saját géped tárolója, oda
   semmilyen szolgáltató nem lát bele. Cserébe másik böngészőben vagy
   telefonon nem jelenik meg — arra a megosztható link és a GPX való. */

import { useSyncExternalStore } from 'react';

const KULCS = 'turabakancs-tervek';
const REGI_KULCS = 'nyomvonal-tervek';   // az oldal korábbi neve
const MAX = 40;

let gyorsitotar = null;
const figyelok = new Set();

function olvas() {
  try {
    const nyers = JSON.parse(localStorage.getItem(KULCS) || 'null');
    if (Array.isArray(nyers)) return nyers;

    /* Névváltáskor a korábbi kulcson tárolt terveket átvesszük, hogy senki
       ne veszítse el a mentéseit. Egyszer fut le: utána már az új kulcson
       találja őket. */
    const regi = JSON.parse(localStorage.getItem(REGI_KULCS) || 'null');
    if (Array.isArray(regi) && regi.length) {
      localStorage.setItem(KULCS, JSON.stringify(regi));
      localStorage.removeItem(REGI_KULCS);
      return regi;
    }
    return [];
  } catch {
    return [];
  }
}

/* A useSyncExternalStore ugyanazt a tömbpéldányt várja, amíg nem
   változott semmi — különben végtelen újrarajzolásba fut. */
function pillanatkep() {
  if (gyorsitotar === null) gyorsitotar = olvas();
  return gyorsitotar;
}

function ir(lista) {
  gyorsitotar = lista;
  try {
    localStorage.setItem(KULCS, JSON.stringify(lista));
  } catch {
    /* Tele van vagy tiltott a tároló: a link és a GPX ettől még működik. */
  }
  figyelok.forEach((f) => f());
}

function feliratkozas(f) {
  figyelok.add(f);
  /* Másik fülön történt változás is látszódjon. */
  const masikFul = (e) => {
    if (e.key === KULCS) {
      gyorsitotar = olvas();
      figyelok.forEach((x) => x());
    }
  };
  window.addEventListener('storage', masikFul);
  return () => {
    figyelok.delete(f);
    window.removeEventListener('storage', masikFul);
  };
}

export const useTervek = () => useSyncExternalStore(feliratkozas, pillanatkep, () => []);

export function tervMentes(terv) {
  const uj = { ...terv, id: terv.id ?? `t-${Date.now()}`, mentve: Date.now() };
  const tobbi = pillanatkep().filter((t) => t.id !== uj.id);
  ir([uj, ...tobbi].slice(0, MAX));
  return uj;
}

export function tervTorles(id) {
  ir(pillanatkep().filter((t) => t.id !== id));
}
