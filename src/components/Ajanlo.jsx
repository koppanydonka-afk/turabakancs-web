import { useState } from 'react';
import { ajanlasok } from '../data/ajanlo.js';
import { magassagot } from '../data/magassag.js';
import { elorejelzes, figyelmeztetes, kodSzerint } from '../data/idojaras.js';

/* Ajánló fül: mit érdemes tudni a megrajzolt útról.

   Minden tanács a saját vonaladból számol. A magassági adat az egyetlen,
   amihez le kell kérdezni valamit — ezért külön gombra, nem magától. */

export default function Ajanlo({ pontok, jelolesek, tempo }) {
  const [magassag, setMagassag] = useState(null);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);
  const [ido, setIdo] = useState(null);
  const [idoFut, setIdoFut] = useState(false);
  const [idoHiba, setIdoHiba] = useState(null);

  const kerd = async () => {
    setFut(true);
    setHiba(null);
    try {
      setMagassag(await magassagot(pontok));
    } catch (e) {
      setHiba(e.message);
    } finally {
      setFut(false);
    }
  };

  const idotKer = async () => {
    setIdoFut(true);
    setIdoHiba(null);
    try {
      setIdo(await elorejelzes(pontok[0]));
    } catch (e) {
      setIdoHiba(e.message);
    } finally {
      setIdoFut(false);
    }
  };

  if (pontok.length < 2) {
    return (
      <p className="apro">
        Rajzolj legalább két pontot, és megmondom, mire számíts: menetidőt,
        nehézséget, és hogy beéred-e sötétedés előtt.
      </p>
    );
  }

  const lista = ajanlasok({ pontok, jelolesek, tempo, magassag });

  return (
    <div className="ajanlo">
      {!magassag && (
        <div className="ajanlo__magassag">
          <button
            className="gomb gomb--halk gomb--szeles"
            onClick={kerd}
            disabled={fut}
            aria-busy={fut}
          >
            {fut ? 'Lekérem…' : 'Magassági adat lekérése'}
          </button>
          <p className="apro">
            Az emelkedő dönti el, hogy séta-e vagy túra.
          </p>
          {hiba && <p className="uzenet">{hiba}</p>}
        </div>
      )}

      {magassag && <Profil magassag={magassag} />}

      {!ido && (
        <div className="ajanlo__magassag">
          <button
            className="gomb gomb--halk gomb--szeles"
            onClick={idotKer}
            disabled={idoFut}
            aria-busy={idoFut}
          >
            {idoFut ? 'Lekérem…' : 'Időjárás a következő öt napra'}
          </button>
          <p className="apro">A túra kezdőpontjára, öt napra előre.</p>
          {idoHiba && <p className="uzenet">{idoHiba}</p>}
        </div>
      )}

      {ido && <Idojaras napok={ido} />}

      <ul className="ajanlo__lista">
        {lista.map((a) => (
          <li key={a.id} className={`tanacs tanacs--${a.szint}`}>
            <p className="tanacs__cim">{a.cimke}</p>
            <p className="tanacs__szoveg">{a.szoveg}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Öt nap előrejelzése. A figyelmeztetés a nap alatt jelenik meg, ha van —
   a szám önmagában keveset mond, az „ilyenkor csúszik a létra” sokat. */
function Idojaras({ napok }) {
  const nevek = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

  return (
    <div className="idojaras">
      <h3 className="lista__cim">Időjárás</h3>
      <div className="idojaras__napok">
        {napok.map((n, i) => {
          const d = new Date(`${n.nap}T12:00:00`);
          const fig = figyelmeztetes(n);
          return (
            <div className={`ido-nap${fig ? ` ido-nap--${fig.szint}` : ''}`} key={n.nap}>
              <p className="ido-nap__nap">
                {i === 0 ? 'ma' : i === 1 ? 'holnap' : nevek[d.getDay()]}
              </p>
              <p className="ido-nap__fok">
                <strong>{n.max}°</strong>
                <span>{n.min}°</span>
              </p>
              <p className="ido-nap__allapot">{kodSzerint(n.kod).szo}</p>
              {n.csapadek > 0 && <p className="ido-nap__csapadek">{n.csapadek.toFixed(1)} mm</p>}
            </div>
          );
        })}
      </div>
      {napok.map((n, i) => {
        const fig = figyelmeztetes(n);
        if (!fig || i > 2) return null;
        return (
          <p className={`tanacs tanacs--${fig.szint}`} key={`f-${n.nap}`}>
            <span className="tanacs__cim">{i === 0 ? 'Ma' : i === 1 ? 'Holnap' : 'Két nap múlva'}</span>
            <span className="tanacs__szoveg">{fig.szoveg}</span>
          </p>
        );
      })}
      <p className="apro">Forrás: Open-Meteo.</p>
    </div>
  );
}

/* Magassági metszet. Egyszerű területdiagram — nem elemzésre való, arra,
   hogy egy pillantásra lásd, hol megy fel. */
function Profil({ magassag }) {
  const { magassagok, min, max, fel, le } = magassag;
  const also = Math.min(...magassagok);
  const felso = Math.max(...magassagok);
  const kiterjedes = Math.max(1, felso - also);

  const pontok = magassagok
    .map((m, i) => {
      const x = (i / (magassagok.length - 1)) * 100;
      const y = 100 - ((m - also) / kiterjedes) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <figure className="profil">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={`0,100 ${pontok} 100,100`} className="profil__teruleti" />
        <polyline points={pontok} className="profil__vonal" />
      </svg>
      <figcaption className="profil__adatok">
        <span><strong>↑ {fel} m</strong> emelkedő</span>
        <span><strong>↓ {le} m</strong> lejtő</span>
        <span><strong>{min}–{max} m</strong> tengerszint felett</span>
      </figcaption>
    </figure>
  );
}
