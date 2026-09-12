/* Időjárás-előrejelzés a túra helyére.

   Az Open-Meteo ugyanúgy kulcs és számlázási fiók nélkül megy, mint a
   magassági adat. Csak gombnyomásra kérdez, és csak az útvonal kezdőpontját
   küldi el — nem a teljes nyomvonalat. */

const VEGPONT = 'https://api.open-meteo.com/v1/forecast';

/* A WMO időjáráskódok, amikre az előrejelzés hivatkozik. Csak azokat
   soroljuk fel, amik nálunk elő is fordulnak. */
const KODOK = {
  0: { szo: 'Derült', jel: 'nap' },
  1: { szo: 'Jobbára derült', jel: 'nap' },
  2: { szo: 'Szakadozott felhőzet', jel: 'felho' },
  3: { szo: 'Borult', jel: 'felho' },
  45: { szo: 'Köd', jel: 'kod' },
  48: { szo: 'Zúzmarás köd', jel: 'kod' },
  51: { szo: 'Gyenge szitálás', jel: 'eso' },
  53: { szo: 'Szitálás', jel: 'eso' },
  55: { szo: 'Erős szitálás', jel: 'eso' },
  61: { szo: 'Gyenge eső', jel: 'eso' },
  63: { szo: 'Eső', jel: 'eso' },
  65: { szo: 'Erős eső', jel: 'eso' },
  71: { szo: 'Gyenge havazás', jel: 'ho' },
  73: { szo: 'Havazás', jel: 'ho' },
  75: { szo: 'Erős havazás', jel: 'ho' },
  77: { szo: 'Hószemcsék', jel: 'ho' },
  80: { szo: 'Zápor', jel: 'eso' },
  81: { szo: 'Zápor', jel: 'eso' },
  82: { szo: 'Heves zápor', jel: 'eso' },
  85: { szo: 'Hózápor', jel: 'ho' },
  86: { szo: 'Erős hózápor', jel: 'ho' },
  95: { szo: 'Zivatar', jel: 'vihar' },
  96: { szo: 'Jégesős zivatar', jel: 'vihar' },
  99: { szo: 'Heves jégesős zivatar', jel: 'vihar' },
};

export const kodSzerint = (kod) => KODOK[kod] ?? { szo: 'Ismeretlen', jel: 'felho' };

export async function elorejelzes([lat, lng]) {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '5',
  });

  const valasz = await fetch(`${VEGPONT}?${p}`);
  if (!valasz.ok) throw new Error('Az előrejelzés most nem érhető el.');
  const adat = await valasz.json();
  const d = adat.daily;
  if (!d?.time) throw new Error('Az előrejelzés most nem érhető el.');

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
    return { szint: 'fontos', szoveg: 'Zivatar várható. Gerincen és kilátóban ilyenkor nincs keresnivalód.' };
  }
  if (nap.csapadek >= 10) {
    return { szint: 'fontos', szoveg: `${nap.csapadek.toFixed(0)} mm csapadék: a sziklás és létrás szakaszok csúsznak.` };
  }
  if (nap.csapadek >= 2) {
    return { szint: 'figyelem', szoveg: 'Eső várható — a sáros lejtőkön lassabb lesz a haladás.' };
  }
  if (nap.max >= 30) {
    return { szint: 'figyelem', szoveg: `${nap.max} fok: árnyék nélküli szakaszon vigyél dupla vizet.` };
  }
  if (nap.min <= -5) {
    return { szint: 'figyelem', szoveg: `Hajnalban ${nap.min} fok: jeges lehet a nyomvonal.` };
  }
  if (nap.szel >= 45) {
    return { szint: 'figyelem', szoveg: `${nap.szel} km/h szél: gerincen kellemetlen, kilátóban hideg.` };
  }
  return null;
}
