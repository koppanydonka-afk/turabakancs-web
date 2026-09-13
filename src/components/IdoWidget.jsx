import { useEffect, useState } from 'react';
import { elorejelzes, figyelmeztetes, kodSzerint } from '../data/idojaras.js';

/* Időjárás-widget a térképen.

   Eddig gombnyomásra jött, az oldalsáv mélyén. Most alapból látszik — a
   túratervezésnél ez az első kérdés a táv után.

   Amire figyel: a hely CSAK akkor változik, ha az útvonal kezdőpontja
   megváltozik, vagy ha nincs útvonal és a felhasználó kifejezetten frissít.
   Pásztázásra NEM kérdez újra: az Open-Meteo ingyenes, kulcs nélküli
   szolgáltatás, nem terheljük minden térképmozdulattal. */

const NAPOK = ['vas', 'hét', 'ked', 'sze', 'csü', 'pén', 'szo'];

export default function IdoWidget({ hely, helyNev }) {
  const [ido, setIdo] = useState(null);
  const [hiba, setHiba] = useState(null);
  const [nyitva, setNyitva] = useState(false);
  /* Újrapróbálkozás számlálója: a hibaüzenetre koppintva nő, és ettől
     újraindul az effekt. */
  const [ujra, setUjra] = useState(0);

  const kulcs = hely ? `${hely[0].toFixed(3)},${hely[1].toFixed(3)}` : null;

  useEffect(() => {
    if (!kulcs) return undefined;
    let ervenyes = true;
    setHiba(null);

    /* Másfél másodperc késleltetés. Rajzolás közben a kezdőpont többször
       változik egymás után — kattintáskor, majd amikor a vonal ösvényre
       kerül —, és három gyors kérésre az Open-Meteo hibát ad. Így egy
       rajzolásból egy kérés lesz. */
    const ora = setTimeout(() => {
      elorejelzes(hely)
        .then((e) => ervenyes && setIdo(e))
        .catch(() => ervenyes && setHiba('Az előrejelzés most nem érhető el.'));
    }, 1500);

    return () => { ervenyes = false; clearTimeout(ora); };
    /* A koordináta három tizedesre kerekítve a kulcs: száz méteren belüli
       elmozdulásra nem kérdezünk újra. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kulcs, ujra]);

  if (!kulcs) return null;

  if (hiba) {
    return (
      <button className="ido-widget ido-widget--hiba" onClick={() => setUjra((n) => n + 1)}>
        {hiba} Koppints az újrapróbáláshoz.
      </button>
    );
  }

  if (!ido) {
    return <div className="ido-widget"><span className="ido-widget__tolt">Időjárás…</span></div>;
  }

  const ma = ido[0];
  const figy = figyelmeztetes(ma);

  return (
    <div className={`ido-widget${nyitva ? ' ido-widget--nyitva' : ''}`}>
      <button
        className="ido-widget__fej"
        onClick={() => setNyitva((v) => !v)}
        aria-expanded={nyitva}
        title={`${helyNev ?? 'A térkép közepén'} — ${kodSzerint(ma.kod).szo}`}
      >
        <strong>{ma.max}°</strong>
        <span className="ido-widget__szo">{kodSzerint(ma.kod).szo}</span>
        {figy && <span className={`ido-widget__pont ido-widget__pont--${figy.szint}`} aria-hidden="true" />}
      </button>

      {nyitva && (
        <div className="ido-widget__tartalom">
          <p className="ido-widget__hol">{helyNev ?? 'A térkép közepén'}</p>
          <ul className="ido-widget__napok">
            {ido.map((nap) => (
              <li key={nap.nap}>
                <span className="ido-widget__nev">{NAPOK[new Date(nap.nap).getDay()]}</span>
                <span className="ido-widget__ertek">{nap.max}° / {nap.min}°</span>
                {nap.csapadek > 0 && <span className="ido-widget__csap">{nap.csapadek.toFixed(0)} mm</span>}
              </li>
            ))}
          </ul>
          {figy && <p className={`ido-widget__figy ido-widget__figy--${figy.szint}`}>{figy.szoveg}</p>}
        </div>
      )}
    </div>
  );
}
