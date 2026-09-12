import { useState } from 'react';
import { elsoTalalat } from '../data/helykereses.js';
import { osvenyreHuz, ritkit } from '../data/utvonalkereso.js';

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
        nev: 'megadott koordináta',
      };
    }
    const { valasztott } = await elsoTalalat(szoveg);
    return { pont: valasztott.pont, nev: valasztott.nev };
  };

  const sajatHelyzet = () => {
    if (!navigator.geolocation) {
      setHiba('Ez a böngésző nem tudja megmondani a helyzetedet.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (poz) => {
        const pont = [poz.coords.latitude, poz.coords.longitude];
        setHonnan(`${pont[0].toFixed(5)}, ${pont[1].toFixed(5)}`);
        setHiba(null);
        onUgras(pont, { kozeli: true });
      },
      () => setHiba('Nem kaptam meg a helyzetedet. Írd be a kiindulópontot kézzel.'),
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
      <label className="mezo">
        <span>Honnan</span>
        <input
          type="text"
          value={honnan}
          onChange={(e) => setHonnan(e.target.value)}
          placeholder="Hely neve vagy koordináta"
          autoComplete="off"
        />
      </label>
      <label className="mezo">
        <span>Hova — ha üresen hagyod, csak odaugrunk</span>
        <input
          type="text"
          value={hova}
          onChange={(e) => setHova(e.target.value)}
          placeholder="Például: Dobogókő"
          autoComplete="off"
        />
      </label>

      <div className="hh-panel__gombok">
        <button className="gomb gomb--halk" type="button" onClick={sajatHelyzet}>
          Innen indulok
        </button>
        <button
          className="gomb gomb--fo"
          type="submit"
          disabled={fut || !honnan.trim()}
          aria-busy={fut}
        >
          {fut ? 'Számolom…' : hova.trim() ? 'Útvonalat kérek' : 'Odaugrás'}
        </button>
      </div>

      {hiba && <p className="uzenet uzenet--hiba">{hiba}</p>}
    </form>
  );
}
