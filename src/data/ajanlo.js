/* Ajánló: mit érdemes tudni erről az útvonalról.

   Minden tanács a megrajzolt vonalból és a kitett jelölésekből számol —
   nincs mögötte se adatgyűjtés, se más felhasználók adata. Amit nem tudunk,
   arról nem mondunk semmit. */

import { hossz, tavolsag, tempoSzerint } from './utvonalak.js';
import { emelkedoPerc } from './magassag.js';
import { napnyugta, oraPerc } from './naptar.js';

const perc = (p) => (p < 60 ? `${p} perc` : `${Math.floor(p / 60)} ó ${String(p % 60).padStart(2, '0')} p`);

/* A menetidő a táv és az emelkedő együttese (Naismith). Pihenő nélkül. */
export function menetido(km, tempoId, felMeter) {
  const alap = (km / tempoSzerint(tempoId).kmh) * 60;
  const plusz = felMeter ? emelkedoPerc(felMeter) : 0;
  return Math.round(alap + plusz);
}

export function nehezseg(km, felMeter) {
  const pont = km + (felMeter ?? 0) / 100;
  if (pont < 5) return { szo: 'Könnyű', leiras: 'Rövid séta, bárkinek megy.' };
  if (pont < 12) return { szo: 'Közepes', leiras: 'Fél nap, edzettség nem kell hozzá.' };
  if (pont < 22) return { szo: 'Erős', leiras: 'Egész napos túra, készülj rá.' };
  return { szo: 'Nehéz', leiras: 'Hosszú nap. Csak gyakorlattal és felszereléssel.' };
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
    cimke: `${n.szo} — ${perc(ido)} menetidő`,
    szoveg: magassag
      ? `${km.toFixed(1)} km, ${magassag.fel} m emelkedő. ${n.leiras} A menetidő pihenők nélkül értendő; számolj még legalább fél órát.`
      /* A magasság magától töltődik, nincs mit „lekérni” — a szöveg ezért
         csak annyit mond, hogy a becslés még a táv alapján készült. */
      : `${km.toFixed(1)} km. ${n.leiras} Az emelkedőt még töltöm; addig a menetidő csak a távból számol.`,
  });

  /* --- Világosság: ez a legfontosabb, ha ma indulsz --- */
  const ny = napnyugta(most, pontok[0][0], pontok[0][1]);
  if (ny) {
    const maradek = Math.round((ny.getTime() - most.getTime()) / 60000);
    if (maradek <= 0) {
      ki.push({
        id: 'sotet',
        szint: 'fontos',
        cimke: 'Már lement a nap',
        szoveg: `Ma ${oraPerc(ny)}-kor volt a napnyugta. Ha most indulsz, fejlámpa nélkül ne vágj neki.`,
      });
    } else if (maradek < ido + 30) {
      ki.push({
        id: 'sotetedes',
        szint: 'fontos',
        cimke: 'Nem éred be sötétedés előtt',
        szoveg: `Napnyugta ${oraPerc(ny)}-kor, addig ${perc(maradek)} van. Az út ${perc(ido)}, pihenők nélkül. Vigyél fejlámpát, vagy indulj korábban.`,
      });
    } else {
      ki.push({
        id: 'vilagos',
        szint: 'info',
        cimke: `Napnyugtáig ${perc(maradek)}`,
        szoveg: `Ma ${oraPerc(ny)}-kor sötétedik. Ha most indulsz, bőven beéred.`,
      });
    }
  }

  /* --- Visszaút: kör-e vagy sem --- */
  const rajtCel = tavolsag(pontok[0], pontok[pontok.length - 1]);
  if (rajtCel > 0.5) {
    ki.push({
      id: 'visszaut',
      szint: 'figyelem',
      cimke: 'A cél nem ott van, ahol a rajt',
      szoveg: `${rajtCel.toFixed(1)} km választja el őket. Ha autóval mész, gondold végig, hogyan jutsz vissza érte — vagy tervezz kört.`,
    });
  }

  /* --- Víz --- */
  if (km >= 8 && !tipusok.has('forras')) {
    ki.push({
      id: 'viz',
      szint: 'figyelem',
      cimke: 'Nincs vízvételi hely jelölve',
      szoveg: `${km.toFixed(1)} km-hez ez kevés. Kapcsold be a térkép ivóvíz-gombját: megmutatom, mi van a környéken.`,
    });
  }

  /* --- Megközelítés --- */
  if (!tipusok.has('parkolo') && !tipusok.has('kozlekedes')) {
    ki.push({
      id: 'megkozelites',
      szint: 'figyelem',
      cimke: 'Nincs jelölve, hogyan jutsz a rajthoz',
      szoveg: 'Indulás előtt ez lesz az első kérdés. A térkép megálló-gombjával megnézheted, mi van a környéken.',
    });
  }

  /* --- A vonal durvasága --- */
  const kmPontonkent = km / (pontok.length - 1);
  if (kmPontonkent > 2) {
    ki.push({
      id: 'durva',
      szint: 'figyelem',
      cimke: 'A vonal nagyon egyenes',
      szoveg: `Szakaszonként átlag ${kmPontonkent.toFixed(1)} km. A valódi ösvény kanyarog, tehát a tényleges táv ennél hosszabb — kattints be több pontot a pontosabb képhez.`,
    });
  }

  /* --- Emelkedő --- */
  if (magassag && magassag.fel >= 400) {
    ki.push({
      id: 'emelkedo',
      szint: 'figyelem',
      cimke: `${magassag.fel} méter emelkedő`,
      szoveg: `A legalacsonyabb pont ${magassag.min} m, a legmagasabb ${magassag.max} m. Ez az emelkedő önmagában ${perc(emelkedoPerc(magassag.fel))}-cel hosszabbítja a menetidőt.`,
    });
  }

  /* --- Veszély --- */
  if (tipusok.has('veszely')) {
    ki.push({
      id: 'veszely',
      szint: 'fontos',
      cimke: 'Nehéz szakaszt jelöltél be',
      szoveg: 'Eső után és fagyban a meredek, sziklás részek jóval lassabbak és kockázatosabbak. Nézd meg az időjárást indulás előtt.',
    });
  }

  return ki;
}
