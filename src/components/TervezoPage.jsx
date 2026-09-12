import { useEffect, useMemo, useRef, useState } from 'react';
import Terkep from './Terkep.jsx';
import Helykereso from './Helykereso.jsx';
import JelolesLista from './JelolesLista.jsx';
import Ajanlo from './Ajanlo.jsx';
import TuraLista from './TuraLista.jsx';
import Labjegyzet from './Labjegyzet.jsx';
import { JELOLES_TIPUSOK, tipusSzerint } from '../data/jelolesek.js';
import {
  TEMPOK,
  dekodol,
  hossz,
  ido,
  jeloleseketDekodol,
  kmSzoveg,
  kodol,
  tervLinkje,
} from '../data/utvonalak.js';
import { gpxLetoltes } from '../data/gpx.js';
import { osvenyreHuz, ritkit as utatRitkit } from '../data/utvonalkereso.js';
import { tervMentes, tervTorles, useTervek } from '../data/tarolo.js';
import { useRoute } from '../router.js';

/* A tervező. Ez a kezdőlap is: az eszköz maga a tartalom.

   A panel három fülre oszlik — Terv, Ajánló, Útvonalak —, mert a
   rajzolás, a tanácsok és a böngészés három külön dolog, és egymás alá
   pakolva egyik sem látszana. */

const FULEK = [
  { id: 'terv', nev: 'Terv' },
  { id: 'ajanlo', nev: 'Ajánló' },
  { id: 'turak', nev: 'Útvonalak' },
];

export default function TervezoPage() {
  const { params } = useRoute();
  const terkep = useRef(null);
  const [terkepKesz, setTerkepKesz] = useState(false);

  const [pontok, setPontok] = useState(() => dekodol(params.get('ut')));
  const [jelolesek, setJelolesek] = useState(() => jeloleseketDekodol(params.get('j')));
  const [nev, setNev] = useState('');
  const [mod, setMod] = useState('ut');
  const [ujTipus, setUjTipus] = useState('kilato');
  const [tempo, setTempo] = useState('gyalog');
  const [uzenet, setUzenet] = useState(null);
  const [illeszt, setIlleszt] = useState(0);
  const [aktivId, setAktivId] = useState(null);
  const [ful, setFul] = useState('terv');
  const [latvanyok, setLatvanyok] = useState(true);
  const [huzas, setHuzas] = useState(false);
  const [huzasElott, setHuzasElott] = useState(null);

  const tervek = useTervek();
  const km = useMemo(() => hossz(pontok), [pontok]);
  const utParam = params.get('ut');
  const jParam = params.get('j');

  /* Megosztott link akkor is töltsön be, ha az oldalon belül navigálunk rá.
     Csak olvassuk a címsort, nem írjuk: rajzolás közben így nem indul
     körkörös frissítés. */
  useEffect(() => {
    const ujPontok = dekodol(utParam);
    const ujJelolesek = jeloleseketDekodol(jParam);
    if (ujPontok.length === 0 && ujJelolesek.length === 0) return;
    setPontok((eddigi) => (kodol(eddigi) === kodol(ujPontok) ? eddigi : ujPontok));
    setJelolesek((eddigi) =>
      JSON.stringify(eddigi) === JSON.stringify(ujJelolesek) ? eddigi : ujJelolesek,
    );
    setIlleszt((n) => n + 1);
  }, [utParam, jParam]);

  const betolt = (terv) => {
    setPontok(terv.pontok ?? []);
    setJelolesek(terv.jelolesek ?? []);
    setNev(terv.nev ?? '');
    setAktivId(terv.id ?? null);
    setUzenet(null);
    setIlleszt((n) => n + 1);
  };

  /* Jelzett turistaút betöltése. A nyers vonal több ezer pontból áll, azt
     ritkítva vesszük át — ezt meg is mondjuk, mert a hossz így pár
     százalékkal rövidebbnek látszik a valóságosnál. */
  const turatBetolt = ({ nev: utNev, pontok: ujPontok, eredetiPontok, eredetiHossz }) => {
    setPontok(ujPontok);
    setJelolesek([]);
    setNev(utNev);
    setAktivId(null);
    setIlleszt((n) => n + 1);
    setFul('terv');
    setUzenet(
      eredetiPontok > ujPontok.length
        ? `Betöltve. A vonalat ${eredetiPontok} pontról ${ujPontok.length}-re ritkítottam, hogy szerkeszthető maradjon — a valódi hossz ${kmSzoveg(eredetiHossz)}.`
        : 'Betöltve. Húzd arrébb a pontjait, vagy tegyél rá jelöléseket.',
    );
  };

  /* Ösvényre húzás: a kattintott pontokat rátesszük a tényleges gyalogutakra.
     Az előző állapotot megtartjuk, hogy egy gombbal vissza lehessen vonni —
     a routolt vonal sokszor meglepően másfelé megy, mint amire számítottál. */
  const osvenyre = async () => {
    setHuzas(true);
    setUzenet(null);
    try {
      /* A `pontok` itt még a húzás ELŐTTI állapot: a setPontok csak a
         következő rajzolási körben érvényesül, ezért lehet vele összevetni. */
      const elotteKm = hossz(pontok);
      const e = await osvenyreHuz(pontok);
      setHuzasElott(pontok);
      setPontok(utatRitkit(e.pontok));
      setIlleszt((n) => n + 1);
      setUzenet(
        `Rákerült a gyalogutakra: ${kmSzoveg(e.km)} a korábbi ${kmSzoveg(elotteKm)} helyett.` +
          (e.km > elotteKm + 0.05 ? ' A valódi ösvény hosszabb, mint az egyenes.' : ''),
      );
    } catch (err) {
      setUzenet(err.message);
    } finally {
      setHuzas(false);
    }
  };

  const huzastVisszavon = () => {
    if (!huzasElott) return;
    setPontok(huzasElott);
    setHuzasElott(null);
    setIlleszt((n) => n + 1);
    setUzenet('Visszaálltak az eredeti pontjaid.');
  };

  const urese = () => {
    setPontok([]);
    setJelolesek([]);
    setNev('');
    setAktivId(null);
    setUzenet(null);
    setHuzasElott(null);
  };

  const vissza = () => {
    if (mod === 'jeloles' && jelolesek.length) setJelolesek((j) => j.slice(0, -1));
    else setPontok((p) => p.slice(0, -1));
  };

  const linkMasol = async () => {
    const cim = tervLinkje(`${window.location.origin}/tervezo`, { pontok, jelolesek });
    try {
      await navigator.clipboard.writeText(cim);
      setUzenet('A link a vágólapon. Az útvonal magában a linkben van — szerverre semmi nem került.');
    } catch {
      window.history.replaceState({}, '', tervLinkje('/tervezo', { pontok, jelolesek }));
      setUzenet('A böngésző címsorában ott a megosztható link, onnan másolható.');
    }
  };

  const ment = (event) => {
    event.preventDefault();
    if (pontok.length < 2 && jelolesek.length === 0) return;
    const mentett = tervMentes({ id: aktivId, nev: nev.trim() || 'Névtelen terv', pontok, jelolesek });
    setAktivId(mentett.id);
    setUzenet('Elmentve ebbe a böngészőbe. Másik gépen a megosztható linkkel éred el.');
  };

  const sajatHelyzet = () => {
    if (!navigator.geolocation) {
      setUzenet('Ez a böngésző nem tudja megmondani a helyzetedet.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (poz) => {
        terkep.current?.setView([poz.coords.latitude, poz.coords.longitude], 15);
        setUzenet('A térkép odaugrott. A helyzeted nem hagyta el a böngésződet.');
      },
      () => setUzenet('Nem kaptam meg a helyzetedet — a térképet kézzel is odahúzhatod.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const ures = pontok.length === 0 && jelolesek.length === 0;

  return (
    <section className="tervezo">
      <div className="tervezo__racs">
        <div className="tervezo__terkep-doboz">
          <Terkep
            pontok={pontok}
            jelolesek={jelolesek}
            mod={mod}
            ujTipus={ujTipus}
            illeszt={illeszt}
            latvanyok={latvanyok}
            onKesz={(map) => {
              terkep.current = map;
              setTerkepKesz(true);
            }}
            onPontHozzaad={(p) => setPontok((eddig) => [...eddig, p])}
            onPontMozgat={(i, p) => setPontok((eddig) => eddig.map((elem, n) => (n === i ? p : elem)))}
            onPontTorol={(i) => setPontok((eddig) => eddig.filter((_, n) => n !== i))}
            onJelolesHozzaad={(j) => setJelolesek((eddig) => [...eddig, { ...j, cimke: '' }])}
            onJelolesMozgat={(i, hely) =>
              setJelolesek((eddig) => eddig.map((elem, n) => (n === i ? { ...elem, ...hely } : elem)))
            }
            onJelolesTorol={(i) => setJelolesek((eddig) => eddig.filter((_, n) => n !== i))}
          />

          <div className="modvalto" role="group" aria-label="Mit tesz a kattintás">
            <button
              className={`modvalto__gomb${mod === 'ut' ? ' modvalto__gomb--aktiv' : ''}`}
              onClick={() => setMod('ut')}
            >
              Útvonal
            </button>
            <button
              className={`modvalto__gomb${mod === 'jeloles' ? ' modvalto__gomb--aktiv' : ''}`}
              onClick={() => setMod('jeloles')}
            >
              Jelölés
            </button>
          </div>

          {mod === 'jeloles' && (
            <div className="paletta" role="group" aria-label="Jelölés típusa">
              {JELOLES_TIPUSOK.map((t) => (
                <button
                  key={t.id}
                  className={`paletta__gomb${ujTipus === t.id ? ' paletta__gomb--aktiv' : ''}`}
                  style={{ '--tu-szin': t.szin }}
                  onClick={() => setUjTipus(t.id)}
                  title={t.nev}
                  aria-label={t.nev}
                  aria-pressed={ujTipus === t.id}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: t.rajz }} />
                </button>
              ))}
            </div>
          )}

          <button
            className={`latvany-valto${latvanyok ? ' latvany-valto--aktiv' : ''}`}
            onClick={() => setLatvanyok((v) => !v)}
            aria-pressed={latvanyok}
            title={latvanyok ? 'Látványosságok elrejtése' : 'Látványosságok mutatása'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 3 9v2h18V9zM5 13v6H3v2h18v-2h-2v-6h-2v6h-3v-6h-2v6H7v-6z" />
            </svg>
            <span>Látnivalók</span>
          </button>

          <p className="terkep__sug">
            {mod === 'ut'
              ? 'Kattints a térképre a pontokért. A pontok húzhatók, jobbgombbal törölhetők.'
              : `Kattints oda, ahová a(z) „${tipusSzerint(ujTipus).nev}” jelölés kerüljön.`}
          </p>
        </div>

        <aside className="panel">
          <Helykereso onTalalat={(hely) => terkep.current?.setView([hely.lat, hely.lng], 14)} />

          <nav className="fulek" role="tablist" aria-label="Panel nézetei">
            {FULEK.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={ful === f.id}
                className={`fulek__gomb${ful === f.id ? ' fulek__gomb--aktiv' : ''}`}
                onClick={() => setFul(f.id)}
              >
                {f.nev}
              </button>
            ))}
          </nav>

          {uzenet && <p className="uzenet">{uzenet}</p>}

          {ful === 'terv' && (
            <>
              <div className="ertekek">
                <div className="ertekek__elem">
                  <strong>{kmSzoveg(km)}</strong>
                  <span>Hossz</span>
                </div>
                <div className="ertekek__elem">
                  <strong>{km > 0 ? ido(km, tempo) : '—'}</strong>
                  <span>
                    <select
                      className="tempo"
                      value={tempo}
                      onChange={(e) => setTempo(e.target.value)}
                      aria-label="Haladási tempó"
                    >
                      {TEMPOK.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nev} · {t.kmh.toLocaleString('hu-HU')} km/h
                        </option>
                      ))}
                    </select>
                  </span>
                </div>
                <div className="ertekek__elem">
                  <strong>{pontok.length}</strong>
                  <span>Pont</span>
                </div>
                <div className="ertekek__elem">
                  <strong>{jelolesek.length}</strong>
                  <span>Jelölés</span>
                </div>
              </div>
              <p className="apro">
                Ez a becslés sík terepre szól. Az emelkedővel együtt számolt menetidőt
                az <strong>Ajánló</strong> fülön találod.
              </p>

              <div className="gombsor">
                <button className="gomb gomb--halk" onClick={vissza} disabled={ures}>Vissza</button>
                <button className="gomb gomb--halk" onClick={urese} disabled={ures}>Üres lap</button>
                <button className="gomb gomb--halk" onClick={sajatHelyzet}>Hol vagyok?</button>
                {huzasElott ? (
                  <button className="gomb gomb--halk" onClick={huzastVisszavon}>
                    Húzás visszavonása
                  </button>
                ) : (
                  <button
                    className="gomb gomb--halk"
                    onClick={osvenyre}
                    disabled={pontok.length < 2 || huzas}
                    title="A pontjaidat ráteszi a tényleges gyalogutakra"
                  >
                    {huzas ? 'Húzom…' : 'Ösvényre húzás'}
                  </button>
                )}
                <button className="gomb gomb--fo" onClick={linkMasol} disabled={ures}>Megosztható link</button>
                <button
                  className="gomb gomb--halk"
                  onClick={() => gpxLetoltes({ nev: nev.trim() || 'Túrabakancs', pontok, jelolesek })}
                  disabled={ures}
                >
                  GPX letöltése
                </button>
              </div>

              <form className="mentes" onSubmit={ment}>
                <label className="mezo">
                  <span>A terv neve</span>
                  <input
                    type="text"
                    value={nev}
                    onChange={(e) => setNev(e.target.value)}
                    placeholder="Például: vasárnapi kör"
                  />
                </label>
                <button className="gomb gomb--halk" type="submit" disabled={ures}>
                  {aktivId ? 'Mentés frissítése' : 'Mentés a böngészőbe'}
                </button>
              </form>

              <JelolesLista
                jelolesek={jelolesek}
                onCimke={(i, cimke) =>
                  setJelolesek((eddig) => eddig.map((j, n) => (n === i ? { ...j, cimke } : j)))
                }
                onTorol={(i) => setJelolesek((eddig) => eddig.filter((_, n) => n !== i))}
                onOdaugrik={(j) => terkep.current?.setView([j.lat, j.lng], 16)}
              />

              {tervek.length > 0 && (
                <div className="lista">
                  <h2 className="lista__cim">Mentett terveid</h2>
                  {tervek.map((terv) => (
                    <div key={terv.id} className="lista__sor">
                      <button className="lista__nev" onClick={() => betolt(terv)}>
                        {terv.nev}
                        <span>
                          {kmSzoveg(hossz(terv.pontok ?? []))} · {(terv.jelolesek ?? []).length} jelölés
                        </span>
                      </button>
                      <button
                        className="lista__torol"
                        onClick={() => {
                          tervTorles(terv.id);
                          if (terv.id === aktivId) setAktivId(null);
                        }}
                        aria-label={`${terv.nev} törlése`}
                      >
                        Törlés
                      </button>
                    </div>
                  ))}
                  <p className="apro">
                    Ezek csak ebben a böngészőben vannak meg. Éles túra előtt töltsd le GPX-ben.
                  </p>
                </div>
              )}
            </>
          )}

          {ful === 'ajanlo' && <Ajanlo pontok={pontok} jelolesek={jelolesek} tempo={tempo} />}

          {ful === 'turak' && (
            <>
              <TuraLista terkep={terkepKesz ? terkep.current : null} onBetolt={turatBetolt} />
              <div className="lista">
                <h2 className="lista__cim">Vagy kezdd egy példával</h2>
                <a className="gomb gomb--halk gomb--szeles" href="/utvonalak">
                  Példák megnyitása
                </a>
              </div>
            </>
          )}

          {/* A teljes magasságú tervezőoldal alatt nincs külön lábsáv,
              ezért az adatkezelés apróbetűje a panel aljára kerül. */}
          <Labjegyzet tomor />
        </aside>
      </div>
    </section>
  );
}
