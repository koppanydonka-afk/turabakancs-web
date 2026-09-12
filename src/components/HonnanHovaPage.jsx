import { useState } from 'react';
import Terkep from './Terkep.jsx';
import Csillagok from './Csillagok.jsx';
import { elsoTalalat } from '../data/helykereses.js';
import { osvenyreHuz, ritkit } from '../data/utvonalkereso.js';
import { mintakat, emelkedo } from '../data/magassag.js';
import { TEMPOK, kmSzoveg, tervLinkje } from '../data/utvonalak.js';
import { menetido, nehezseg } from '../data/ajanlo.js';
import { napnyugta, oraPerc } from '../data/naptar.js';
import { autosBecsles, kozeliTurak, percSzoveg } from '../data/kozeli.js';

/* „Honnan hova” — a térkép nélküli út.

   A tervezőben rajzolni kell, ami egérrel jó, telefonon viszont körülményes.
   Itt elég beírni két helyet: a válasz a táv, az emelkedő és a menetidő.
   A térkép csak megmutatja az eredményt, nem kell hozzányúlni.

   Emellett feldobja a kiindulóponthoz legközelebbi kész túrákat — gyakran
   az a valódi kérdés, hogy „mi van a közelben”, nem az, hogy „A-ból B-be”. */

export default function HonnanHovaPage() {
  const [honnan, setHonnan] = useState('');
  const [hova, setHova] = useState('');
  const [tempo, setTempo] = useState('gyalog');
  const [allapot, setAllapot] = useState('ures'); // ures | szamol | kesz | hiba
  const [hiba, setHiba] = useState(null);
  const [eredmeny, setEredmeny] = useState(null);
  const [kozeli, setKozeli] = useState(null);

  const sajatHelyzet = () => {
    if (!navigator.geolocation) {
      setHiba('Ez a böngésző nem tudja megmondani a helyzetedet.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (poz) => {
        setHonnan(`${poz.coords.latitude.toFixed(5)}, ${poz.coords.longitude.toFixed(5)}`);
        setKozeli(kozeliTurak([poz.coords.latitude, poz.coords.longitude]));
        setHiba(null);
      },
      () => setHiba('Nem kaptam meg a helyzetedet. Írd be a kiindulópontot kézzel.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  /* „47.5, 19.0” alakú beírást koordinátaként veszünk, különben keresünk. */
  const pontot = async (szoveg) => {
    const parok = szoveg.trim().match(/^(-?\d+[.,]\d+)\s*[,;]\s*(-?\d+[.,]\d+)$/);
    if (parok) {
      return { pont: [Number(parok[1].replace(',', '.')), Number(parok[2].replace(',', '.'))], nev: 'megadott koordináta' };
    }
    const { valasztott } = await elsoTalalat(szoveg);
    return { pont: valasztott.pont, nev: valasztott.nev };
  };

  const szamol = async (event) => {
    event.preventDefault();
    setAllapot('szamol');
    setHiba(null);
    try {
      const a = await pontot(honnan);
      const b = await pontot(hova);

      const ut = await osvenyreHuz([a.pont, b.pont]);
      const vonal = ritkit(ut.pontok, 200);

      /* A magasság külön lépés: ha nem jön meg, az eredmény többi része
         akkor is használható. */
      let mag = null;
      try {
        const minta = mintakat(vonal);
        const v = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${minta.map((x) => x[0].toFixed(5)).join(',')}&longitude=${minta.map((x) => x[1].toFixed(5)).join(',')}`,
        );
        const j = await v.json();
        if (Array.isArray(j.elevation)) mag = emelkedo(j.elevation);
      } catch {
        /* marad null */
      }

      setEredmeny({ a, b, vonal, km: ut.km, mag });
      setKozeli(kozeliTurak(a.pont));
      setAllapot('kesz');
    } catch (e) {
      setHiba(e.message);
      setAllapot('hiba');
    }
  };

  const ido = eredmeny ? menetido(eredmeny.km, tempo, eredmeny.mag?.fel) : 0;
  const nehez = eredmeny ? nehezseg(eredmeny.km, eredmeny.mag?.fel) : null;
  const nyugta = eredmeny ? napnyugta(new Date(), ...eredmeny.a.pont) : null;
  const maradek = nyugta ? Math.round((nyugta.getTime() - Date.now()) / 60000) : null;

  return (
    <section className="oldal">
      <header className="oldal__fej">
        <p className="kalap">Honnan hova</p>
        <h1 className="oldal__cim">Írd be a két helyet, a többit megmondom.</h1>
        <p className="oldal__bevezeto">
          Nem kell rajzolni: a táv, az emelkedő és a menetidő beírásból is megvan.
        </p>
      </header>

      <form className="hh" onSubmit={szamol}>
        <div className="hh__mezok">
          <label className="mezo">
            <span>Honnan</span>
            <input
              type="text"
              value={honnan}
              onChange={(e) => setHonnan(e.target.value)}
              placeholder="Például: Dömös"
              autoComplete="off"
            />
          </label>
          <label className="mezo">
            <span>Hova</span>
            <input
              type="text"
              value={hova}
              onChange={(e) => setHova(e.target.value)}
              placeholder="Például: Dobogókő"
              autoComplete="off"
            />
          </label>
        </div>

        <div className="hh__also">
          <label className="mezo mezo--kicsi">
            <span>Hogyan</span>
            <select value={tempo} onChange={(e) => setTempo(e.target.value)}>
              {TEMPOK.map((t) => (
                <option key={t.id} value={t.id}>{t.nev}</option>
              ))}
            </select>
          </label>
          <button className="gomb gomb--halk" type="button" onClick={sajatHelyzet}>
            Innen indulok
          </button>
          <button
            className="gomb gomb--fo"
            type="submit"
            disabled={allapot === 'szamol' || !honnan.trim() || !hova.trim()}
            aria-busy={allapot === 'szamol'}
          >
            {allapot === 'szamol' ? 'Számolom…' : 'Kiszámolom'}
          </button>
        </div>


        {hiba && <p className="uzenet uzenet--hiba">{hiba}</p>}
      </form>

      {allapot === 'kesz' && eredmeny && (
        <>
          <div className="hh__eredmeny">
            <p className="hh__utvonal">
              <strong>{eredmeny.a.nev}</strong> → <strong>{eredmeny.b.nev}</strong>
            </p>

            <div className="ertekek">
              <div className="ertekek__elem">
                <strong>{kmSzoveg(eredmeny.km)}</strong>
                <span>gyalogúton</span>
              </div>
              <div className="ertekek__elem ertekek__elem--kiemelt">
                <strong>{percSzoveg(ido)}</strong>
                <span>{TEMPOK.find((t) => t.id === tempo).nev}</span>
              </div>
              <div className="ertekek__elem">
                <strong>{eredmeny.mag ? `↑ ${eredmeny.mag.fel} m` : '—'}</strong>
                <span>emelkedő</span>
              </div>
              <div className="ertekek__elem">
                <strong>{nehez.szo}</strong>
                <span>nehézség</span>
              </div>
            </div>

            {nyugta && maradek !== null && (
              <p className={`tanacs tanacs--${maradek < ido + 30 ? 'fontos' : 'info'}`}>
                <span className="tanacs__cim">
                  {maradek < ido + 30 ? 'Nem éred be sötétedés előtt' : `Napnyugtáig ${percSzoveg(Math.max(0, maradek))}`}
                </span>
                <span className="tanacs__szoveg">
                  Ma {oraPerc(nyugta)}-kor sötétedik. Az út {percSzoveg(ido)}, pihenők nélkül.
                </span>
              </p>
            )}

            <div className="hh__terkep">
              <Terkep pontok={eredmeny.vonal} illeszt={eredmeny.km} />
            </div>

            <div className="gombsor">
              <a
                className="gomb gomb--fo"
                href={tervLinkje('/tervezo', { pontok: eredmeny.vonal, jelolesek: [] })}
              >
                Megnyitás a tervezőben
              </a>
            </div>
            <p className="apro">
              A vonal a tényleges gyalogutakat követi. Hogy az adott ösvény most járható-e,
              azt a térkép nem tudja.
            </p>
          </div>
        </>
      )}

      {kozeli && kozeli.length > 0 && (
        <section className="szekcio" data-feltun>
          <header className="szekcio__fej">
            <h2 className="szekcio__cim">A legközelebbi túrák innen</h2>
            <p className="szekcio__lead">
              Kész útvonalak a kiindulópontod közelében, a legközelebbivel kezdve.
            </p>
          </header>
          <div className="kartyak">
            {kozeli.map((k) => {
              const autos = autosBecsles(k.legvonal);
              return (
                <article className="kartya" key={k.utvonal.id}>
                  <h3 className="kartya__cim">
                    <a href={`/utvonalak/${k.utvonal.id}`}>{k.utvonal.nev}</a>
                  </h3>
                  <p className="kartya__hol">{k.utvonal.hol}</p>
                  {k.ertekeles && (
                    <p className="kartya__csillag">
                      <Csillagok ertek={k.ertekeles.csillag} meret={15} />
                      <span>szerintünk</span>
                    </p>
                  )}
                  <ul className="cimkek">
                    <li>{k.legvonal < 1 ? 'itt van' : `${Math.round(k.legvonal)} km-re`}</li>
                    <li>~{percSzoveg(autos.perc)} autóval</li>
                    <li>{kmSzoveg(k.km)} a túra</li>
                    <li className={`cimke--${k.nehezseg.toLowerCase()}`}>{k.nehezseg}</li>
                  </ul>
                  <p className="kartya__jegyzet">{k.utvonal.jegyzet}</p>
                  <div className="kartya__gombok">
                    <a className="gomb gomb--halk" href={`/utvonalak/${k.utvonal.id}`}>Megnézem</a>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="apro">
            A távolság légvonalban értendő, az autós idő durva becslés — arra jó, hogy
            eldöntsd, „egy óra vagy három”, nem arra, hogy percre tervezz.
          </p>
        </section>
      )}
    </section>
  );
}
