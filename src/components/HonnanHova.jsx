import { useEffect, useRef, useState } from 'react';
import { elsoTalalat, javaslatok } from '../data/helykereses.js';
import { osvenyreHuz, ritkit } from '../data/utvonalkereso.js';
import { sz, nyelv } from '../nyelv/index.js';

/* „Honnan hova” a tervező panelén.

   Korábban külön oldal volt, de ugyanazt csinálta, mint a tervező —
   csak rajzolás helyett beírásból. Most egy mező-pár a panel tetején:

   - ha csak a felső mező van kitöltve, a térkép odaugrik (helykeresés),
   - ha mindkettő, a két hely közé útvonalat számol, és beteszi a tervezőbe.

   Így minden, ami a tervezőben van — emelkedő, menetidő, GPX, megosztás —
   ugyanúgy működik a beírt útvonalra is. */

export default function HonnanHova({ onUgras, onUtvonal }) {
  const [honnan, setHonnan] = useState('');
  const [hova, setHova] = useState('');
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);

  /* „47.5, 19.0” alakot koordinátaként veszünk, minden mást keresünk. */
  const pontot = async (szoveg) => {
    const p = szoveg.trim().match(/^(-?\d+[.,]\d+)\s*[,;]\s*(-?\d+[.,]\d+)$/);
    if (p) {
      return {
        pont: [Number(p[1].replace(',', '.')), Number(p[2].replace(',', '.'))],
        nev: sz('hh.koordinata'),
      };
    }
    const { valasztott } = await elsoTalalat(szoveg);
    return { pont: valasztott.pont, nev: valasztott.nev };
  };

  const sajatHelyzet = () => {
    if (!navigator.geolocation) {
      setHiba(sz('hiba.nincsHelyzet'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (poz) => {
        const pont = [poz.coords.latitude, poz.coords.longitude];
        setHonnan(`${pont[0].toFixed(5)}, ${pont[1].toFixed(5)}`);
        setHiba(null);
        onUgras(pont, { kozeli: true });
      },
      () => setHiba(sz('hh.nincsHelyzet')),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const kuldes = async (event) => {
    event.preventDefault();
    if (!honnan.trim()) return;
    setFut(true);
    setHiba(null);
    try {
      const a = await pontot(honnan);

      /* Csak a kiindulópont van meg: odaugrunk, és megmutatjuk, mi van ott. */
      if (!hova.trim()) {
        onUgras(a.pont, { kozeli: true });
        return;
      }

      const b = await pontot(hova);
      const ut = await osvenyreHuz([a.pont, b.pont]);
      onUtvonal({
        pontok: ritkit(ut.pontok, 250),
        /* A két beírt hely marad a horgony: a térképen ezt a kettőt lehet
           arrébb húzni, és a vonal magától újraszámolódik. */
        horgonyok: [a.pont, b.pont],
        km: ut.km,
        nev: `${a.nev.split(',')[0]} – ${b.nev.split(',')[0]}`,
        honnan: a.pont,
      });
    } catch (e) {
      setHiba(e.message);
    } finally {
      setFut(false);
    }
  };

  return (
    <form className="hh-panel" onSubmit={kuldes}>
      <HelyMezo
        cimke={sz('hh.honnan')}
        jelzes={sz('hh.honnanHely')}
        ertek={honnan}
        beallit={setHonnan}
      />
      <HelyMezo
        cimke={sz('hh.hova')}
        jelzes={sz('hh.hovaHely')}
        ertek={hova}
        beallit={setHova}
      />

      <div className="hh-panel__gombok">
        <button className="gomb gomb--halk" type="button" onClick={sajatHelyzet}>
          {sz('hh.innen')}
        </button>
        <button
          className="gomb gomb--fo"
          type="submit"
          disabled={fut || !honnan.trim()}
          aria-busy={fut}
        >
          {fut ? sz('hh.szamolom') : hova.trim() ? sz('hh.utvonalat') : sz('hh.odaugras')}
        </button>
      </div>

      {hiba && <p className="uzenet uzenet--hiba">{hiba}</p>}
    </form>
  );
}

/* Egy helymező, gépelés közbeni javaslatokkal.

   MIÉRT VAN EGYÁLTALÁN: eddig csak gombnyomásra keresett, és az ELSŐ
   találatot vette — ha az nem az volt, amire gondoltál, nem lehetett
   választani. A Photon viszont harminc-százötven ezredmásodperc alatt
   válaszol, tehát a javaslatok gépelés közben is kijönnek.

   A gomb továbbra is működik javaslat nélkül is: aki koordinátát ír be
   vagy egyszerűen leüti az entert, ugyanúgy célba ér. */
function HelyMezo({ cimke, jelzes, ertek, beallit }) {
  const [lista, setLista] = useState([]);
  const [nyitva, setNyitva] = useState(false);
  const [valasztottSor, setValasztottSor] = useState(-1);
  /* A felhasználó választott egy javaslatot: erre a szövegre ne kérdezzünk
     újra, különben a lista rögtön visszanyílna alatta. */
  const kihagy = useRef(null);

  useEffect(() => {
    if (ertek === kihagy.current) return undefined;
    if (ertek.trim().length < 3) {
      setLista([]);
      return undefined;
    }
    /* Negyedmásodperc: ennyi szünet után szoktunk megállni gépelés közben,
       és ennyi elég ahhoz, hogy ne minden leütés menjen ki kérésként. */
    const ora = setTimeout(() => {
      javaslatok(ertek, { nyelv: nyelv() }).then((j) => {
        setLista(j);
        setValasztottSor(-1);
        setNyitva(true);
      });
    }, 250);
    return () => clearTimeout(ora);
  }, [ertek]);

  const valaszt = (j) => {
    kihagy.current = j.nev;
    beallit(j.nev);
    setLista([]);
    setNyitva(false);
  };

  const billentyu = (e) => {
    if (!nyitva || lista.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setValasztottSor((n) => {
        const kov = e.key === 'ArrowDown' ? n + 1 : n - 1;
        return (kov + lista.length) % lista.length;
      });
    } else if (e.key === 'Enter' && valasztottSor >= 0) {
      e.preventDefault();
      valaszt(lista[valasztottSor]);
    } else if (e.key === 'Escape') {
      setNyitva(false);
    }
  };

  const mutat = nyitva && lista.length > 0;

  return (
    <div className="hely-mezo">
      <label className="mezo">
        <span>{cimke}</span>
        <input
          type="text"
          value={ertek}
          onChange={(e) => beallit(e.target.value)}
          onKeyDown={billentyu}
          onFocus={() => setNyitva(true)}
          /* Késleltetve zárunk: a lista elemére kattintás előbb elveszi a
             fókuszt, mint hogy a kattintás megtörténne. */
          onBlur={() => setTimeout(() => setNyitva(false), 140)}
          placeholder={jelzes}
          autoComplete="off"
          role="combobox"
          aria-expanded={mutat}
          aria-autocomplete="list"
        />
      </label>
      {mutat && (
        <ul className="javaslatok" role="listbox">
          {lista.map((j, i) => (
            <li key={`${j.nev}-${i}`}>
              <button
                type="button"
                className={`javaslat${i === valasztottSor ? ' javaslat--kijelolt' : ''}`}
                onClick={() => valaszt(j)}
                role="option"
                aria-selected={i === valasztottSor}
              >
                {j.nev}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
