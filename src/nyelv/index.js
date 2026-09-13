/* A felület szövegei.

   A nyelv a betöltéskor dől el a címből (/en/…), és onnantól nem változik:
   nincs nyelvváltó, a látogató a böngészője nyelvén kapja az oldalt. Ezért
   nem kell React-környezet (context) sem — egy modulszintű szótár elég, és
   így az adatmodulokból is elérhető, nem csak komponensből.

   Hiányzó kulcsnál a magyar szöveg jön. Ez szándékos: egy új szöveg
   fordítás nélkül is olvasható marad, nem üres doboz lesz belőle. */

import magyar from './hu.js';
import { ALAP_NYELV, NYELVEK } from './nyelvek.js';

const BETOLTOK = {
  hu: () => Promise.resolve({ default: magyar }),
  en: () => import('./en.js'),
  de: () => import('./de.js'),
  sk: () => import('./sk.js'),
  ro: () => import('./ro.js'),
  pl: () => import('./pl.js'),
  cs: () => import('./cs.js'),
  fr: () => import('./fr.js'),
  es: () => import('./es.js'),
};

let jelenlegi = ALAP_NYELV;
let szotar = magyar;

/* A szótár betöltése. Csak az AKTUÁLIS nyelv kerül le a böngészőbe — a
   kilenc szótár együtt fölösleges teher lenne azon, aki egyet olvas. */
export async function nyelvetBetolt(nyelv) {
  const kod = NYELVEK[nyelv] ? nyelv : ALAP_NYELV;
  try {
    const modul = await (BETOLTOK[kod] ?? BETOLTOK[ALAP_NYELV])();
    szotar = modul.default;
  } catch {
    /* Ha a szótár nem tölt be, magyarul is működik az oldal. */
    szotar = magyar;
  }
  jelenlegi = kod;
  if (typeof document !== 'undefined') document.documentElement.lang = kod;
  return kod;
}

export const nyelv = () => jelenlegi;
export const nyelvLocale = () => NYELVEK[jelenlegi]?.locale ?? 'hu_HU';

/* Szöveg kulcs szerint, behelyettesítéssel:
     sz('fejlec.fok', { fok: 24, ido: 'Borult' })  */
export function sz(kulcs, ertekek) {
  const alap = szotar[kulcs] ?? magyar[kulcs] ?? kulcs;
  if (!ertekek) return alap;
  return alap.replace(/\{(\w+)\}/g, (egesz, nev) =>
    Object.prototype.hasOwnProperty.call(ertekek, nev) ? String(ertekek[nev]) : egesz,
  );
}
