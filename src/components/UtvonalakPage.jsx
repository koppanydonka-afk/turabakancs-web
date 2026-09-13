import { useMemo, useState } from 'react';
import { peldaUtvonalak } from '../data/peldak.js';
import { hossz, ido, kmSzoveg, tervLinkje } from '../data/utvonalak.js';
import { tipusSzerint } from '../data/jelolesek.js';
import Csillagok from './Csillagok.jsx';
import { ertekelesSzerint } from '../data/ertekelesek.js';
import { HOSSZ_SAVOK, NEHEZSEGEK, jellemzok, szur, tajegysegek } from '../data/szures.js';

/* Példák, szűrhetően.

   A szűrés a lemért adatokból dolgozik (hossz és emelkedő), nem becslésből.
   Az állapot szándékosan a komponensben marad, nem a címsorban: a szűrés itt
   böngészési segédeszköz, nem megosztandó nézet. */

export default function UtvonalakPage() {
  const [tajegyseg, setTajegyseg] = useState('');
  const [hosszSav, setHosszSav] = useState('');
  const [nehezsegek, setNehezsegek] = useState([]);

  const tajak = useMemo(() => tajegysegek(peldaUtvonalak), []);
  const talalatok = useMemo(
    () => szur(peldaUtvonalak, { tajegyseg, hosszSav, nehezsegek }),
    [tajegyseg, hosszSav, nehezsegek],
  );

  const vanSzuro = Boolean(tajegyseg || hosszSav || nehezsegek.length);
  const torol = () => {
    setTajegyseg('');
    setHosszSav('');
    setNehezsegek([]);
  };

  const nehezsegValt = (n) =>
    setNehezsegek((eddig) => (eddig.includes(n) ? eddig.filter((x) => x !== n) : [...eddig, n]));

  return (
    <section className="oldal">
      <header className="oldal__fej">
        <p className="kalap">Példák</p>
        {/* Szám nélkül, hogy a példák bővítése ne írja át a címsort. A
            darabszám a szűrő alatt amúgy is ott van, és az magától számol. */}
        <h1 className="oldal__cim">Kész vonalak, amikből kiindulhatsz.</h1>
        <p className="oldal__bevezeto">
          Nyisd meg bármelyiket, húzd arrébb a pontjait, tegyél rá saját jelöléseket —
          és már a tiéd.
        </p>
      </header>

      <div className="szuro">
        <div className="szuro__sor">
          <label className="szuro__mezo">
            <span>Tájegység</span>
            <select value={tajegyseg} onChange={(e) => setTajegyseg(e.target.value)}>
              <option value="">Mindegyik</option>
              {tajak.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="szuro__mezo">
            <span>Hossz</span>
            <div className="szuro__pirulak">
              {HOSSZ_SAVOK.map((s) => (
                <button
                  key={s.id}
                  className={`pirula${hosszSav === s.id ? ' pirula--aktiv' : ''}`}
                  onClick={() => setHosszSav(hosszSav === s.id ? '' : s.id)}
                  aria-pressed={hosszSav === s.id}
                  title={s.leiras}
                >
                  {s.nev}
                </button>
              ))}
            </div>
          </div>

          <div className="szuro__mezo">
            <span>Nehézség</span>
            <div className="szuro__pirulak">
              {NEHEZSEGEK.map((n) => (
                <button
                  key={n}
                  className={`pirula${nehezsegek.includes(n) ? ' pirula--aktiv' : ''}`}
                  onClick={() => nehezsegValt(n)}
                  aria-pressed={nehezsegek.includes(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="szuro__eredmeny">
          <strong>{talalatok.length}</strong> útvonal
          {vanSzuro && (
            <button className="szuro__torol" onClick={torol}>
              szűrők törlése
            </button>
          )}
        </p>
      </div>

      {talalatok.length === 0 ? (
        <p className="apro">
          Erre a szűrésre nincs útvonal. Vegyél le egy feltételt, vagy{' '}
          <button className="linkgomb" onClick={torol}>töröld mindet</button>.
        </p>
      ) : (
        <div className="kartyak">
          {talalatok.map((p) => {
            const km = hossz(p.pontok);
            const j = jellemzok(p);
            const ertekeles = ertekelesSzerint(p.id);
            return (
              <article className="kartya" key={p.id}>
                <h2 className="kartya__cim">
                  <a href={`/utvonalak/${p.id}`}>{p.nev}</a>
                </h2>
                <p className="kartya__hol">{p.hol}</p>
                {ertekeles && (
                  <p className="kartya__csillag">
                    <Csillagok ertek={ertekeles.csillag} meret={15} />
                    <span>szerintünk</span>
                  </p>
                )}
                <p className="kartya__jegyzet">{p.jegyzet}</p>

                <ul className="cimkek">
                  <li>{kmSzoveg(km)}</li>
                  {p.emelkedo && <li>↑ {p.emelkedo.fel} m</li>}
                  <li>{ido(km)} gyalog</li>
                  <li className={`cimke--${j.nehezseg.toLowerCase()}`}>{j.nehezseg}</li>
                </ul>

                <ul className="cimkek">
                  {p.jelolesek.slice(0, 2).map((x) => (
                    <li key={`${x.lat}-${x.lng}`} style={{ '--tu-szin': tipusSzerint(x.tipus).szin }}>
                      <span className="cimkek__pont" />
                      {x.cimke}
                    </li>
                  ))}
                </ul>

                <div className="kartya__gombok">
                  <a className="gomb gomb--halk" href={`/utvonalak/${p.id}`}>Megnézem</a>
                  <a className="gomb gomb--fo" href={tervLinkje('/tervezo', p)}>
                    Megnyitás a tervezőben
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="figyelmeztetes">
        <strong>A vonalak a tényleges gyalogutakon futnak</strong>, nem két pont közé húzott
        egyenesen — a táv és az emelkedő ezért igaz. A terepen ettől még a jelzett
        turistautak és a hivatalos térképek a mérvadók.
      </p>
    </section>
  );
}
