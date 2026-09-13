/* GPX — mentés és betöltés.

   A fájl itt, a böngészőben áll össze és innen is mentődik le — nem megy át
   szerveren. GPX-et szinte minden túraalkalmazás beolvas (OsmAnd, Locus,
   Garmin, Strava), tehát a megrajzolt vonal a telefonodon is használható.

   A betöltés ugyanígy a böngészőben történik: a fájl nem kerül sehova, csak
   beolvassuk. Sokáig csak kifelé nyílt az ajtó — aki kapott egy nyomvonalat
   valakitől vagy a régi GPS-éről, az nem tudta megnyitni nálunk, pedig
   minden más megvolt hozzá: térkép, magasság, menetidő, tanácsok. */

import { tipusSzerint, JELOLES_TIPUSOK } from './jelolesek.js';
import { sz } from '../nyelv/index.js';

const xmlBiztos = (szoveg) =>
  String(szoveg ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function gpxSzoveg({ nev, pontok, jelolesek }) {
  const cim = xmlBiztos(nev || 'Túrabakancs');

  const wpt = jelolesek
    .map(
      (j) =>
        `  <wpt lat="${j.lat.toFixed(6)}" lon="${j.lng.toFixed(6)}">\n` +
        `    <name>${xmlBiztos(j.cimke || tipusSzerint(j.tipus).nev)}</name>\n` +
        `    <type>${xmlBiztos(tipusSzerint(j.tipus).nev)}</type>\n` +
        `  </wpt>`,
    )
    .join('\n');

  const trkpt = pontok
    .map((p) => `      <trkpt lat="${p[0].toFixed(6)}" lon="${p[1].toFixed(6)}" />`)
    .join('\n');

  const trk = pontok.length
    ? `  <trk>\n    <name>${cim}</name>\n    <trkseg>\n${trkpt}\n    </trkseg>\n  </trk>`
    : '';

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="Turabakancs" xmlns="http://www.topografix.com/GPX/1/1">\n` +
    `  <metadata><name>${cim}</name></metadata>\n` +
    [wpt, trk].filter(Boolean).join('\n') +
    `\n</gpx>\n`
  );
}

/* Fájlnév: ékezet nélkül, szóköz helyett kötőjel — hogy bármelyik
   telefonon és asztali gépen gond nélkül megnyíljon. */
export function fajlnev(nev) {
  const alap = (nev || 'turabakancs')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${alap || 'turabakancs'}.gpx`;
}

export function gpxLetoltes(terv) {
  const blob = new Blob([gpxSzoveg(terv)], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fajlnev(terv.nev);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}


/* ---- Betöltés ---- */

export class GpxHiba extends Error {}

/* A GPX `sym` mezője szabadszöveg, mindenki mást ír bele. Csak a gyakori
   alakokat ismerjük fel; a többi „látnivaló” lesz, ami nem hazudik. */
const SYM_TERKEP = [
  [/water|drink|spring|forr|kút|kut/i, 'forras'],
  [/parking|parkol/i, 'parkolo'],
  [/summit|peak|view|kilát|kilat/i, 'kilato'],
  [/shelter|hut|bench|pihen|eső|eso/i, 'pihen'],
  [/restaurant|food|bar|pub|büfé|bufe|kocsma/i, 'vendeglatas'],
  [/station|stop|bus|train|megáll|megall|állom|allom/i, 'kozlekedes'],
  [/danger|warn|veszély|veszely/i, 'veszely'],
];

const tipusraFordit = (sym, nev) => {
  const szoveg = `${sym ?? ''} ${nev ?? ''}`;
  const talalat = SYM_TERKEP.find(([minta]) => minta.test(szoveg));
  return talalat ? talalat[1] : 'latnivalo';
};

const ervenyes = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

/* A beolvasott nyomvonal több ezer pont is lehet (másodpercenkénti GPS-rögzítés).
   Annyit nem lehet szerkeszteni, és a megosztható linkbe sem férne bele. */
function ritkit(pontok, max = 300) {
  if (pontok.length <= max) return pontok;
  const lepes = pontok.length / max;
  const ki = [];
  for (let i = 0; i < max; i += 1) ki.push(pontok[Math.floor(i * lepes)]);
  ki.push(pontok[pontok.length - 1]);
  return ki;
}

export function gpxBeolvas(szoveg) {
  if (typeof DOMParser === 'undefined') {
    throw new GpxHiba(sz('gpx.nemTud'));
  }

  const doc = new DOMParser().parseFromString(szoveg, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new GpxHiba(sz('gpx.serult'));
  }

  const koordinatak = (csomopontok) =>
    Array.from(csomopontok)
      .map((n) => [Number(n.getAttribute('lat')), Number(n.getAttribute('lon'))])
      .filter(([lat, lng]) => ervenyes(lat, lng));

  /* Előbb a rögzített nyomvonal (trkpt), utána a megtervezett útvonal (rtept):
     ha mindkettő van, a bejárt nyom a beszédesebb. */
  let pontok = koordinatak(doc.getElementsByTagName('trkpt'));
  if (pontok.length < 2) pontok = koordinatak(doc.getElementsByTagName('rtept'));

  const jelolesek = Array.from(doc.getElementsByTagName('wpt'))
    .map((n) => {
      const lat = Number(n.getAttribute('lat'));
      const lng = Number(n.getAttribute('lon'));
      if (!ervenyes(lat, lng)) return null;
      const nev = n.getElementsByTagName('name')[0]?.textContent?.trim() ?? '';
      const sym = n.getElementsByTagName('sym')[0]?.textContent?.trim() ?? '';
      const tipus = tipusraFordit(sym, nev);
      return {
        lat,
        lng,
        tipus: JELOLES_TIPUSOK.some((t) => t.id === tipus) ? tipus : 'latnivalo',
        cimke: nev.slice(0, 60),
      };
    })
    .filter(Boolean)
    .slice(0, 60);

  if (pontok.length < 2 && jelolesek.length === 0) {
    throw new GpxHiba(sz('gpx.ures'));
  }

  const nev =
    doc.querySelector('trk > name')?.textContent?.trim() ||
    doc.querySelector('metadata > name')?.textContent?.trim() ||
    doc.querySelector('rte > name')?.textContent?.trim() ||
    '';

  const eredetiPontok = pontok.length;
  return {
    nev: nev.slice(0, 80),
    pontok: ritkit(pontok),
    jelolesek,
    eredetiPontok,
    ritkitva: eredetiPontok > 300,
  };
}
