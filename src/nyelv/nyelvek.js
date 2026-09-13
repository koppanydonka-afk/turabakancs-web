/* Melyik nyelveken érhető el az oldal, és hogyan látszik ez a címben.

   NINCS NYELVVÁLTÓ. A látogató a böngészője nyelvén kapja az oldalt, és
   ha ott nincs a listán, magyarul. Ezt szándékosan így: egy kapcsoló a
   fejlécben mindenkinek elveszi a helyet azért, amit a böngésző úgyis tud.

   A cím viszont HORDOZZA a nyelvet (/en/tervezo), három okból:

     - a Google mind a kilenc változatot külön indexeli; enélkül csak a
       magyart látná, és idegen nyelven megtalálhatatlan maradna az oldal;
     - a megosztott link azon a nyelven nyílik ki, amin küldted;
     - a robotok, amik nem futtatnak JavaScriptet, így is a helyes
       szöveget kapják — az előrenderelés nyelvenként külön fájlt ír.

   A magyar a gyökéren van, előtag nélkül: ez az oldal első nyelve, és a
   meglévő linkek nem törhetnek el. */

export const ALAP_NYELV = 'hu';

export const NYELVEK = {
  hu: { nev: 'Magyar', locale: 'hu_HU', sajatNev: 'magyar' },
  en: { nev: 'English', locale: 'en_GB', sajatNev: 'English' },
  de: { nev: 'Deutsch', locale: 'de_DE', sajatNev: 'Deutsch' },
  sk: { nev: 'Slovenčina', locale: 'sk_SK', sajatNev: 'slovenčina' },
  ro: { nev: 'Română', locale: 'ro_RO', sajatNev: 'română' },
  pl: { nev: 'Polski', locale: 'pl_PL', sajatNev: 'polski' },
  cs: { nev: 'Čeština', locale: 'cs_CZ', sajatNev: 'čeština' },
  fr: { nev: 'Français', locale: 'fr_FR', sajatNev: 'français' },
  es: { nev: 'Español', locale: 'es_ES', sajatNev: 'español' },
};

export const NYELV_KODOK = Object.keys(NYELVEK);

/* Az előtag nélküli nyelvek (most csak a magyar) címei nem változnak. */
const ELOTAGOS = NYELV_KODOK.filter((k) => k !== ALAP_NYELV);

/* Cím → nyelv + a nyelv nélküli útvonal.
     '/en/tervezo' → { nyelv: 'en', ut: '/tervezo' }
     '/tervezo'    → { nyelv: 'hu', ut: '/tervezo' }
     '/en'         → { nyelv: 'en', ut: '/' }                       */
export function utbolNyelv(cim) {
  const p = cim || '/';
  const elso = p.split('/')[1];
  if (ELOTAGOS.includes(elso)) {
    const maradek = p.slice(elso.length + 1) || '/';
    return { nyelv: elso, ut: maradek.startsWith('/') ? maradek : `/${maradek}` };
  }
  return { nyelv: ALAP_NYELV, ut: p };
}

/* Nyelv + útvonal → cím. Ezt kell minden belső hivatkozásra ráengedni,
   különben a német olvasó egy kattintással a magyar oldalon találja
   magát, és rögtön vissza is irányítjuk — oda-vissza pattogna. */
export function nyelvesUt(nyelv, ut = '/') {
  const tiszta = ut.startsWith('/') ? ut : `/${ut}`;
  if (nyelv === ALAP_NYELV || !NYELVEK[nyelv]) return tiszta;
  return tiszta === '/' ? `/${nyelv}` : `/${nyelv}${tiszta}`;
}

/* Mit szeretne a böngésző? A `navigator.languages` sorrendben adja a
   preferenciákat ('de-AT' → 'de'). Ha egyik sem a miénk, `null`. */
export function bongeszoNyelve() {
  const lista = (typeof navigator !== 'undefined' && navigator.languages) || [];
  for (const teljes of lista) {
    const kod = String(teljes).toLowerCase().split('-')[0];
    if (NYELVEK[kod]) return kod;
  }
  return null;
}
