/* Időjárás-előrejelzés a túra helyére.

   Az Open-Meteo ugyanúgy kulcs és számlázási fiók nélkül megy, mint a
   magassági adat. Csak gombnyomásra kérdez, és csak az útvonal kezdőpontját
   küldi el — nem a teljes nyomvonalat. */

import { sz } from '../nyelv/index.js';

const VEGPONT = 'https://api.open-meteo.com/v1/forecast';

/* A WMO időjáráskódok, amikre az előrejelzés hivatkozik. Csak azokat
   soroljuk fel, amik nálunk elő is fordulnak. A szó a szótárból jön: a
   kód nemzetközi, a neve nem. */
const KODOK = {
  0: { kulcs: 'derult', jel: 'nap' },
  1: { kulcs: 'jobbaraDerult', jel: 'nap' },
  2: { kulcs: 'szakadozott', jel: 'felho' },
  3: { kulcs: 'borult', jel: 'felho' },
  45: { kulcs: 'kod', jel: 'kod' },
  48: { kulcs: 'zuzmarasKod', jel: 'kod' },
  51: { kulcs: 'gyengeSzitalas', jel: 'eso' },
  53: { kulcs: 'szitalas', jel: 'eso' },
  55: { kulcs: 'erosSzitalas', jel: 'eso' },
  61: { kulcs: 'gyengeEso', jel: 'eso' },
  63: { kulcs: 'eso', jel: 'eso' },
  65: { kulcs: 'erosEso', jel: 'eso' },
  71: { kulcs: 'gyengeHavazas', jel: 'ho' },
  73: { kulcs: 'havazas', jel: 'ho' },
  75: { kulcs: 'erosHavazas', jel: 'ho' },
  77: { kulcs: 'hoszemcsek', jel: 'ho' },
  80: { kulcs: 'zapor', jel: 'eso' },
  81: { kulcs: 'zapor', jel: 'eso' },
  82: { kulcs: 'hevesZapor', jel: 'eso' },
  85: { kulcs: 'hozapor', jel: 'ho' },
  86: { kulcs: 'erosHozapor', jel: 'ho' },
  95: { kulcs: 'zivatar', jel: 'vihar' },
  96: { kulcs: 'jegesoZivatar', jel: 'vihar' },
  99: { kulcs: 'hevesJegeso', jel: 'vihar' },
};

export const kodSzerint = (kod) => {
  const k = KODOK[kod];
  return k ? { szo: sz(`ido.${k.kulcs}`), jel: k.jel } : { szo: sz('ido.ismeretlen'), jel: 'felho' };
};

export async function elorejelzes([lat, lng]) {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '5',
  });

  const valasz = await fetch(`${VEGPONT}?${p}`);
  if (!valasz.ok) throw new Error(sz('hiba.elorejelzes'));
  const adat = await valasz.json();
  const d = adat.daily;
  if (!d?.time) throw new Error(sz('hiba.elorejelzes'));

  return d.time.map((nap, i) => ({
    nap,
    kod: d.weather_code[i],
    max: Math.round(d.temperature_2m_max[i]),
    min: Math.round(d.temperature_2m_min[i]),
    csapadek: d.precipitation_sum[i] ?? 0,
    szel: Math.round(d.wind_speed_10m_max[i] ?? 0),
  }));
}

/* Túrázói tanács a napból. Nem tudományos, de ezek azok a küszöbök,
   amiktől tényleg más lesz a nap. */
export function figyelmeztetes(nap) {
  if ([95, 96, 99].includes(nap.kod)) {
    return { szint: 'fontos', szoveg: sz('idoFigy.zivatar') };
  }
  if (nap.csapadek >= 10) {
    return { szint: 'fontos', szoveg: sz('idoFigy.sokCsapadek', { mm: nap.csapadek.toFixed(0) }) };
  }
  if (nap.csapadek >= 2) {
    return { szint: 'figyelem', szoveg: sz('idoFigy.eso') };
  }
  if (nap.max >= 30) {
    return { szint: 'figyelem', szoveg: sz('idoFigy.meleg', { fok: nap.max }) };
  }
  if (nap.min <= -5) {
    return { szint: 'figyelem', szoveg: sz('idoFigy.fagy', { fok: nap.min }) };
  }
  if (nap.szel >= 45) {
    return { szint: 'figyelem', szoveg: sz('idoFigy.szel', { szel: nap.szel }) };
  }
  return null;
}

/* Hány fok van most.

   Az öt napos előrejelzés a térképen ült, saját ablakkal. A fejlécbe ebből
   egyetlen szám kerül, ezért külön kérdés: a napi bontás nem kell hozzá,
   és így a válasz is töredéke. */
export async function mostaniFok([lat, lng]) {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current: 'temperature_2m,weather_code',
    timezone: 'auto',
  });

  const valasz = await fetch(`${VEGPONT}?${p}`);
  if (!valasz.ok) throw new Error(sz('hiba.homerseklet'));
  const adat = await valasz.json();
  const m = adat.current;
  if (m?.temperature_2m == null) throw new Error(sz('hiba.homerseklet'));

  return { fok: Math.round(m.temperature_2m), kod: m.weather_code };
}
