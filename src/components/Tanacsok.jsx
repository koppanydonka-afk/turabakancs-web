import { useState } from 'react';
import { ajanlasok } from '../data/ajanlo.js';
import { useMost } from '../ora.js';
import { elorejelzes, figyelmeztetes, kodSzerint } from '../data/idojaras.js';

/* Tanácsok és időjárás.

   A magassági adatot a szülő tölti be (magától, kis késleltetéssel), ezért
   ez a komponens már csak megjelenít. Így eggyel kevesebb gombot kell
   megnyomni ahhoz, hogy a lényeg látszódjon. */

export default function Tanacsok({ pontok, jelolesek, tempo, magassag }) {
  /* A sötétedésre vonatkozó tanácsok az idő múlásával változnak — a nyitva
     hagyott tervezőben is követniük kell a valóságot. */
  const most = useMost();
  const [ido, setIdo] = useState(null);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);

  if (pontok.length < 2) return null;

  const idotKer = async () => {
    setFut(true);
    setHiba(null);
    try {
      setIdo(await elorejelzes(pontok[0]));
    } catch (e) {
      setHiba(e.message);
    } finally {
      setFut(false);
    }
  };

  const lista = ajanlasok({ pontok, jelolesek, tempo, magassag, most });

  return (
    <div className="tanacsok">
      {magassag && <Profil magassag={magassag} />}

      <ul className="ajanlo__lista">
        {lista.map((a) => (
          <li key={a.id} className={`tanacs tanacs--${a.szint}`}>
            <p className="tanacs__cim">{a.cimke}</p>
            <p className="tanacs__szoveg">{a.szoveg}</p>
          </li>
        ))}
      </ul>

      {ido ? (
        <Idojaras napok={ido} />
      ) : (
        <>
          <button className="gomb gomb--halk gomb--szeles" onClick={idotKer} disabled={fut} aria-busy={fut}>
            {fut ? 'Lekérem…' : 'Milyen idő lesz?'}
          </button>
          {hiba && <p className="uzenet">{hiba}</p>}
        </>
      )}
    </div>
  );
}

/* Öt nap előrejelzése. A figyelmeztetés a nap alatt jelenik meg, ha van —
   a szám önmagában keveset mond, az „ilyenkor csúszik a létra” sokat. */
function Idojaras({ napok }) {
  const nevek = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

  return (
    <div className="idojaras">
      <div className="idojaras__napok">
        {napok.map((n, i) => {
          const d = new Date(`${n.nap}T12:00:00`);
          const fig = figyelmeztetes(n);
          return (
            <div className={`ido-nap${fig ? ` ido-nap--${fig.szint}` : ''}`} key={n.nap}>
              <p className="ido-nap__nap">{i === 0 ? 'ma' : i === 1 ? 'holnap' : nevek[d.getDay()]}</p>
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
      {napok.slice(0, 3).map((n, i) => {
        const fig = figyelmeztetes(n);
        if (!fig) return null;
        return (
          <p className={`tanacs tanacs--${fig.szint}`} key={`f-${n.nap}`}>
            <span className="tanacs__cim">{i === 0 ? 'Ma' : i === 1 ? 'Holnap' : 'Két nap múlva'}</span>
            <span className="tanacs__szoveg">{fig.szoveg}</span>
          </p>
        );
      })}
    </div>
  );
}

/* Magassági metszet — egy pillantásra látod, hol megy fel. */
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
