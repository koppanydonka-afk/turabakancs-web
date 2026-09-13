/* Ajánló: mit érdemes tudni erről az útvonalról.

   Minden tanács a megrajzolt vonalból és a kitett jelölésekből számol —
   nincs mögötte se adatgyűjtés, se más felhasználók adata. Amit nem tudunk,
   arról nem mondunk semmit. */

import { hossz, tavolsag, tempoSzerint } from './utvonalak.js';
import { emelkedoPerc } from './magassag.js';
import { napnyugta, oraPerc } from './naptar.js';
import { nyelv, sz } from '../nyelv/index.js';

/* Egy tizedes, a felület nyelvén. A `toFixed` mindig pontot ad, a spanyol
   és a magyar viszont vesszőt ír — a fejlécben „9,0 km" állt, a tanácsban
   „9.0 km", egymás mellett. */
const egyTizedes = (x) =>
  x.toLocaleString(nyelv(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const perc = (p) =>
  p < 60
    ? sz('ido.rovidPerc', { p })
    : sz('ido.rovidOra', { o: Math.floor(p / 60), p: String(p % 60).padStart(2, '0') });

/* A menetidő a táv és az emelkedő együttese (Naismith). Pihenő nélkül. */
export function menetido(km, tempoId, felMeter) {
  const alap = (km / tempoSzerint(tempoId).kmh) * 60;
  const plusz = felMeter ? emelkedoPerc(felMeter) : 0;
  return Math.round(alap + plusz);
}

/* A nehézség AZONOSÍTÓJA nyelvfüggetlen — a szűrő ezzel dolgozik, tehát
   nem eshet szét attól, hogy valaki németül nézi az oldalt. A megjelenő
   szó és a magyarázat abból az azonosítóból jön. */
export function nehezseg(km, felMeter) {
  const pont = km + (felMeter ?? 0) / 100;
  const id = pont < 5 ? 'konnyu' : pont < 12 ? 'kozepes' : pont < 22 ? 'eros' : 'nehez';
  return { id, szo: sz(`nehez.${id}`), leiras: sz(`nehez.${id}Leiras`) };
}

export function ajanlasok({ pontok, jelolesek, tempo = 'gyalog', magassag = null, most = new Date() }) {
  const ki = [];
  if (pontok.length < 2) return ki;

  const km = hossz(pontok);
  const ido = menetido(km, tempo, magassag?.fel);
  const tipusok = new Set(jelolesek.map((j) => j.tipus));

  /* --- Menetidő és nehézség --- */
  const n = nehezseg(km, magassag?.fel);
  ki.push({
    id: 'osszkep',
    szint: 'info',
    cimke: sz('tanacs.osszkepCimke', { nehez: n.szo, ido: perc(ido) }),
    szoveg: magassag
      ? sz('tanacs.osszkepMagassag', { km: egyTizedes(km), fel: magassag.fel, leiras: n.leiras })
      /* A magasság magától töltődik, nincs mit „lekérni” — a szöveg ezért
         csak annyit mond, hogy a becslés még a táv alapján készült. */
      : sz('tanacs.osszkepNincs', { km: egyTizedes(km), leiras: n.leiras }),
  });

  /* --- Világosság: ez a legfontosabb, ha ma indulsz --- */
  const ny = napnyugta(most, pontok[0][0], pontok[0][1]);
  if (ny) {
    const maradek = Math.round((ny.getTime() - most.getTime()) / 60000);
    if (maradek <= 0) {
      ki.push({
        id: 'sotet',
        szint: 'fontos',
        cimke: sz('tanacs.sotetCimke'),
        szoveg: sz('tanacs.sotetSzoveg', { ido: oraPerc(ny) }),
      });
    } else if (maradek < ido + 30) {
      ki.push({
        id: 'sotetedes',
        szint: 'fontos',
        cimke: sz('tanacs.sotetedesCimke'),
        szoveg: sz('tanacs.sotetedesSzoveg', {
          nyugta: oraPerc(ny),
          maradek: perc(maradek),
          ut: perc(ido),
        }),
      });
    } else {
      ki.push({
        id: 'vilagos',
        szint: 'info',
        cimke: sz('tanacs.vilagosCimke', { maradek: perc(maradek) }),
        szoveg: sz('tanacs.vilagosSzoveg', { ido: oraPerc(ny) }),
      });
    }
  }

  /* --- Visszaút: kör-e vagy sem --- */
  const rajtCel = tavolsag(pontok[0], pontok[pontok.length - 1]);
  if (rajtCel > 0.5) {
    ki.push({
      id: 'visszaut',
      szint: 'figyelem',
      cimke: sz('tanacs.visszautCimke'),
      szoveg: sz('tanacs.visszautSzoveg', { tav: egyTizedes(rajtCel) }),
    });
  }

  /* --- Víz --- */
  if (km >= 8 && !tipusok.has('forras')) {
    ki.push({
      id: 'viz',
      szint: 'figyelem',
      cimke: sz('tanacs.vizCimke'),
      szoveg: sz('tanacs.vizSzoveg', { km: egyTizedes(km) }),
    });
  }

  /* --- Megközelítés --- */
  if (!tipusok.has('parkolo') && !tipusok.has('kozlekedes')) {
    ki.push({
      id: 'megkozelites',
      szint: 'figyelem',
      cimke: sz('tanacs.megkozelitesCimke'),
      szoveg: sz('tanacs.megkozelitesSzoveg'),
    });
  }

  /* --- A vonal durvasága --- */
  const kmPontonkent = km / (pontok.length - 1);
  if (kmPontonkent > 2) {
    ki.push({
      id: 'durva',
      szint: 'figyelem',
      cimke: sz('tanacs.durvaCimke'),
      szoveg: sz('tanacs.durvaSzoveg', { atlag: egyTizedes(kmPontonkent) }),
    });
  }

  /* --- Emelkedő --- */
  if (magassag && magassag.fel >= 400) {
    ki.push({
      id: 'emelkedo',
      szint: 'figyelem',
      cimke: sz('tanacs.emelkedoCimke', { fel: magassag.fel }),
      szoveg: sz('tanacs.emelkedoSzoveg', {
        min: magassag.min,
        max: magassag.max,
        plusz: perc(emelkedoPerc(magassag.fel)),
      }),
    });
  }

  /* --- Veszély --- */
  if (tipusok.has('veszely')) {
    ki.push({
      id: 'veszely',
      szint: 'fontos',
      cimke: sz('tanacs.veszelyCimke'),
      szoveg: sz('tanacs.veszelySzoveg'),
    });
  }

  return ki;
}
