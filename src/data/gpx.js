/* GPX letöltés.

   A fájl itt, a böngészőben áll össze és innen is mentődik le — nem megy át
   szerveren. GPX-et szinte minden túraalkalmazás beolvas (OsmAnd, Locus,
   Garmin, Strava), tehát a megrajzolt vonal a telefonodon is használható. */

import { tipusSzerint } from './jelolesek.js';

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
