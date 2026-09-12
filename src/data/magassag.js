/* Magassági adat.

   Az Open-Meteo magassági végpontja kulcs és számlázási fiók nélkül működik,
   és egy kérésben 100 pontot vesz. Gyalogtúránál az emelkedő többet mond a
   nehézségről, mint a táv — 12 km sík mezőn séta, 12 km 800 méter emelkedővel
   egész napos túra.

   Csak gombnyomásra kérdez. A válasz sehol nem marad meg. */

const VEGPONT = 'https://api.open-meteo.com/v1/elevation';
const MAX_PONT = 100;

import { tavolsag } from './utvonalak.js';

/* Egyenletes mintavétel a vonal mentén. Ha valaki három kattintással rajzolt
   egy 20 kilométeres utat, a három pont magassága semmit nem mondana — ezért
   a szakaszok mentén osztunk be mintavételi helyeket. */
export function mintakat(pontok, db = MAX_PONT) {
  if (pontok.length < 2) return pontok.slice();

  const szakaszok = [];
  let teljes = 0;
  for (let i = 1; i < pontok.length; i += 1) {
    const h = tavolsag(pontok[i - 1], pontok[i]);
    szakaszok.push({ a: pontok[i - 1], b: pontok[i], h });
    teljes += h;
  }
  if (teljes === 0) return [pontok[0]];

  const minta = [];
  const lepes = teljes / (db - 1);
  for (let i = 0; i < db; i += 1) {
    let tav = i * lepes;
    let sz = 0;
    while (sz < szakaszok.length - 1 && tav > szakaszok[sz].h) {
      tav -= szakaszok[sz].h;
      sz += 1;
    }
    const s = szakaszok[sz];
    const arany = s.h === 0 ? 0 : Math.min(1, tav / s.h);
    minta.push([
      s.a[0] + (s.b[0] - s.a[0]) * arany,
      s.a[1] + (s.b[1] - s.a[1]) * arany,
    ]);
  }
  return minta;
}

/* A zajszűrés azért kell, mert a domborzatmodell néhány méteres hibái
   összeadódnának: egy sík úton is „száz méter emelkedőt” mutatna. */
const KUSZOB_M = 6;

export function emelkedo(magassagok) {
  let fel = 0;
  let le = 0;
  let horgony = magassagok[0];

  for (const m of magassagok.slice(1)) {
    const kulonbseg = m - horgony;
    if (Math.abs(kulonbseg) < KUSZOB_M) continue;
    if (kulonbseg > 0) fel += kulonbseg;
    else le += -kulonbseg;
    horgony = m;
  }

  return {
    fel: Math.round(fel),
    le: Math.round(le),
    min: Math.round(Math.min(...magassagok)),
    max: Math.round(Math.max(...magassagok)),
  };
}

export async function magassagot(pontok) {
  const minta = mintakat(pontok);
  const lat = minta.map((p) => p[0].toFixed(5)).join(',');
  const lng = minta.map((p) => p[1].toFixed(5)).join(',');

  const valasz = await fetch(`${VEGPONT}?latitude=${lat}&longitude=${lng}`);
  if (!valasz.ok) throw new Error('A magassági adat most nem érhető el.');
  const adat = await valasz.json();
  const magassagok = adat.elevation;
  if (!Array.isArray(magassagok) || magassagok.length === 0) {
    throw new Error('A magassági adat most nem érhető el.');
  }

  return { magassagok, ...emelkedo(magassagok) };
}

/* Naismith szabálya: minden 10 méter emelkedőre plusz egy perc. Régi
   hüvelykujjszabály, de gyalogtúrán máig jól közelít. */
export const emelkedoPerc = (felMeter) => Math.round(felMeter / 10);
