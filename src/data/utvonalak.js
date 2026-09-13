import { nyelv, sz } from '../nyelv/index.js';

/* Útvonal: számolás és linkbe kódolás.

   Semmi nem kerül szerverre. Amit rajzolsz, az a böngésződben marad,
   megosztáskor pedig magába a linkbe kerül bele — így nincs adatbázis,
   nincs fiók, és nincs mit tárolni rólad. */

const FOLD_SUGAR_KM = 6371;

const fok = (x) => (x * Math.PI) / 180;

/* Két pont távolsága a gömbön (haversine). */
export function tavolsag(a, b) {
  const dLat = fok(b[0] - a[0]);
  const dLng = fok(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fok(a[0])) * Math.cos(fok(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * FOLD_SUGAR_KM * Math.asin(Math.sqrt(h));
}

export function hossz(pontok) {
  let km = 0;
  for (let i = 1; i < pontok.length; i += 1) km += tavolsag(pontok[i - 1], pontok[i]);
  return km;
}

/* Haladási tempók. Terepen a domborzat ezeken ront, ezért a kiírt idő
   mindig „becsült” — nem ígéret. */
export const TEMPOK = [
  { id: 'gyalog', nevKulcs: 'tempo.gyalog', kmh: 4.5 },
  { id: 'futas', nevKulcs: 'tempo.futas', kmh: 8 },
  { id: 'bringa', nevKulcs: 'tempo.bringa', kmh: 15 },
];

export const tempoSzerint = (id) => TEMPOK.find((t) => t.id === id) ?? TEMPOK[0];

export function ido(km, tempoId = 'gyalog') {
  const perc = Math.round((km / tempoSzerint(tempoId).kmh) * 60);
  if (perc < 60) return sz('ido.rovidPerc', { p: perc });
  return sz('ido.rovidOra', { o: Math.floor(perc / 60), p: String(perc % 60).padStart(2, '0') });
}

/* A tizedesjel nyelvfüggő: magyarul 8,0 km, angolul 8.0 km. Ezt a
   böngésző tudja, nem kell kézzel intézni. */
export const kmSzoveg = (km) =>
  `${km.toLocaleString(nyelv(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;

/* ---- Kódolás linkbe ----
   Öt tizedes ~1 méteres pontosság; ennél többre gyalogútnál nincs szükség. */
export const kodol = (pontok) =>
  pontok.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(';');

export function dekodol(szoveg) {
  if (!szoveg) return [];
  return szoveg
    .split(';')
    .map((par) => par.split(',').map(Number))
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
}

/* A jelölések külön paraméterben utaznak: típus:lat:lng:címke.
   A címkét külön kódoljuk, hogy a benne lévő kettőspont vagy pontosvessző
   ne vágja szét a sort. */
export const jeloleseketKodol = (jelolesek) =>
  jelolesek
    .map((j) =>
      [j.tipus, j.lat.toFixed(5), j.lng.toFixed(5), encodeURIComponent(j.cimke ?? '')].join(':'),
    )
    .join(';');

export function jeloleseketDekodol(szoveg) {
  if (!szoveg) return [];
  return szoveg
    .split(';')
    .map((resz) => {
      const [tipus, lat, lng, cimke = ''] = resz.split(':');
      return { tipus, lat: Number(lat), lng: Number(lng), cimke: decodeURIComponent(cimke) };
    })
    .filter((j) => Number.isFinite(j.lat) && Number.isFinite(j.lng));
}

/* A teljes terv linkje. Az `alap` a saját címünk, hogy megosztható legyen. */
export function tervLinkje(alap, { pontok, jelolesek }) {
  const p = new URLSearchParams();
  if (pontok.length) p.set('ut', kodol(pontok));
  if (jelolesek.length) p.set('j', jeloleseketKodol(jelolesek));
  const query = p.toString();
  return `${alap}${query ? `?${query}` : ''}`;
}
