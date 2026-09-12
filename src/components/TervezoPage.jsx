import { useEffect, useMemo, useRef, useState } from 'react';
import Terkep from './TerkepKesobb.jsx';
import HonnanHova from './HonnanHova.jsx';
import KozeliTurak from './KozeliTurak.jsx';
import TuraLista from './TuraLista.jsx';
import JelolesLista from './JelolesLista.jsx';
import Tanacsok from './Tanacsok.jsx';
import Labjegyzet from './Labjegyzet.jsx';
import { JELOLES_TIPUSOK, tipusSzerint } from '../data/jelolesek.js';
import {
  TEMPOK,
  dekodol,
  hossz,
  jeloleseketDekodol,
  kmSzoveg,
  kodol,
  tervLinkje,
} from '../data/utvonalak.js';
import { menetido, nehezseg } from '../data/ajanlo.js';
import { magassagot } from '../data/magassag.js';
import { gpxLetoltes } from '../data/gpx.js';
import { osvenyreHuz, ritkit as utatRitkit } from '../data/utvonalkereso.js';
import { kozeliTurak } from '../data/kozeli.js';
import { peldaUtvonalak } from '../data/peldak.js';
import { tervMentes, tervTorles, useTervek } from '../data/tarolo.js';
import { useRoute } from '../router.js';

/* A tervező.

   A panel sorrendje szándékos: előbb a kérdés (honnan hova), utána a
   válasz (adatok, tanácsok), és csak legvégül az eszközök. Ami nem
   mindenkinek kell — jelölések, mentések, közeli túrák, jelzett utak —,
   az összecsukva várakozik.

   Korábban három fül volt; azok csak elrejtették a lényeget egy kattintás
   mögé. */

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
  const [lapNyitva, setLapNyitva] = useState(false);
  const [kozeli, setKozeli] = useState(null);
  const [huzas, setHuzas] = useState(false);
  const [huzasElott, setHuzasElott] = useState(null);
  const [magassag, setMagassag] = useState(null);

  const tervek = useTervek();
  const km = useMemo(() => hossz(pontok), [pontok]);
  const utParam = params.get('ut');
  const jParam = params.get('j');
  const vonalKulcs = useMemo(() => kodol(pontok), [pontok]);

  /* Megosztott link akkor is töltsön be, ha az oldalon belül navigálunk rá. */
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

  /* A magassági adat magától töltődik — de csak akkor, ha a vonal másfél
     másodpercig nem változott. Rajzolás közben így nem megy ki kérés
     minden egyes kattintásra. */
  useEffect(() => {
    setMagassag(null);
    if (pontok.length < 2) return undefined;
    const ora = setTimeout(() => {
      magassagot(pontok)
        .then(setMagassag)
        .catch(() => setMagassag(null));
    }, 1500);
    return () => clearTimeout(ora);
  }, [vonalKulcs, pontok.length]);

  const betolt = (terv) => {
    setPontok(terv.pontok ?? []);
    setJelolesek(terv.jelolesek ?? []);
    setNev(terv.nev ?? '');
    setAktivId(terv.id ?? null);
    setUzenet(null);
    setHuzasElott(null);
    setIlleszt((n) => n + 1);
  };

  const turatBetolt = ({ nev: utNev, pontok: ujPontok, eredetiPontok, eredetiHossz }) => {
    betolt({ nev: utNev, pontok: ujPontok, jelolesek: [] });
    setUzenet(
      eredetiPontok > ujPontok.length
        ? `Betöltve. A vonalat ritkítottam, hogy szerkeszthető maradjon — a valódi hossz ${kmSzoveg(eredetiHossz)}.`
        : 'Betöltve. Húzd arrébb a pontjait, vagy tegyél rá jelöléseket.',
    );
  };

  const osvenyre = async () => {
    setHuzas(true);
    setUzenet(null);
    try {
      const elozo = pontok;
      const e = await osvenyreHuz(pontok);
      setHuzasElott(elozo);
      setPontok(utatRitkit(e.pontok));
      setIlleszt((n) => n + 1);
      setUzenet('Rákerült a tényleges gyalogutakra.');
    } catch (err) {
      setUzenet(err.message);
    } finally {
      setHuzas(false);
    }
  };

  const linkMasol = async () => {
    const cim = tervLinkje(`${window.location.origin}/tervezo`, { pontok, jelolesek });
    try {
      await navigator.clipboard.writeText(cim);
      setUzenet('A link a vágólapon — az útvonal magában a címben van.');
    } catch {
      window.history.replaceState({}, '', tervLinkje('/tervezo', { pontok, jelolesek }));
      setUzenet('A böngésző címsorában ott a megosztható link.');
    }
  };

  const ment = (event) => {
    event.preventDefault();
    if (pontok.length < 2 && jelolesek.length === 0) return;
    const mentett = tervMentes({ id: aktivId, nev: nev.trim() || 'Névtelen terv', pontok, jelolesek });
    setAktivId(mentett.id);
    setUzenet('Elmentve. Másik gépen a megosztható linkkel éred el.');
  };

  const ures = pontok.length === 0 && jelolesek.length === 0;
  const vanUt = pontok.length >= 2;
  const ido = vanUt ? menetido(km, tempo, magassag?.fel) : 0;
  const nehez = vanUt ? nehezseg(km, magassag?.fel) : null;

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
            latvanyok
            onKesz={(map) => {
              terkep.current = map;
              setTerkepKesz(true);
            }}
            onPontHozzaad={(p) => setPontok((e) => [...e, p])}
            onPontMozgat={(i, p) => setPontok((e) => e.map((x, n) => (n === i ? p : x)))}
            onPontTorol={(i) => setPontok((e) => e.filter((_, n) => n !== i))}
            onJelolesHozzaad={(j) => setJelolesek((e) => [...e, { ...j, cimke: '' }])}
            onJelolesMozgat={(i, hely) =>
              setJelolesek((e) => e.map((x, n) => (n === i ? { ...x, ...hely } : x)))
            }
            onJelolesTorol={(i) => setJelolesek((e) => e.filter((_, n) => n !== i))}
          />

          <div className="modvalto" role="group" aria-label="Mit tesz az érintés">
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

          <p className="terkep__sug">
            {mod === 'jeloles'
              ? `Érintsd oda, ahová a(z) „${tipusSzerint(ujTipus).nev}” jelölés kerüljön.`
              : pontok.length > 60
                ? 'Kész útvonal. Érints a térképre új pontért, vagy nyisd meg a szerkesztést.'
                : 'Érintsd a térképet a pontokért. A pontok húzhatók; kétszer rájuk koppintva törlődnek.'}
          </p>
        </div>

        <aside className={`panel${lapNyitva ? ' panel--nyitva' : ''}`}>
          <button
            className="lapfogo"
            onClick={() => setLapNyitva((v) => !v)}
            aria-expanded={lapNyitva}
            aria-controls="tervezo-panel"
          >
            <span className="lapfogo__csik" aria-hidden="true" />
            <span className="lapfogo__szoveg">
              {lapNyitva
                ? 'Térkép mutatása'
                : vanUt
                  ? `${kmSzoveg(km)} · ${ido ? `${Math.floor(ido / 60)} ó ${String(ido % 60).padStart(2, '0')} p` : '—'} · részletek`
                  : 'Honnan hova? · részletek'}
            </span>
          </button>

          <div className="panel__tartalom" id="tervezo-panel">
            {/* 1. A kérdés */}
            <HonnanHova
              onUgras={(pont, { kozeli: kell } = {}) => {
                terkep.current?.setView(pont, 13);
                if (kell) setKozeli(kozeliTurak(pont));
              }}
              onUtvonal={({ pontok: ujPontok, nev: ujNev, honnan }) => {
                betolt({ nev: ujNev, pontok: ujPontok, jelolesek: [] });
                setKozeli(kozeliTurak(honnan));
                setUzenet('Kész — a vonal a tényleges gyalogutakon fut.');
              }}
            />

            {uzenet && <p className="uzenet">{uzenet}</p>}

            {/* 2. A válasz */}
            {vanUt && (
              <div className="adatok">
                <div className="ertekek">
                  <div className="ertekek__elem">
                    <strong>{kmSzoveg(km)}</strong>
                    <span>hossz</span>
                  </div>
                  <div className="ertekek__elem ertekek__elem--kiemelt">
                    <strong>
                      {ido < 60 ? `${ido} perc` : `${Math.floor(ido / 60)} ó ${String(ido % 60).padStart(2, '0')} p`}
                    </strong>
                    <span>
                      <select
                        className="tempo"
                        value={tempo}
                        onChange={(e) => setTempo(e.target.value)}
                        aria-label="Haladási tempó"
                      >
                        {TEMPOK.map((t) => (
                          <option key={t.id} value={t.id}>{t.nev}</option>
                        ))}
                      </select>
                    </span>
                  </div>
                  <div className="ertekek__elem">
                    <strong>{magassag ? `↑ ${magassag.fel} m` : '…'}</strong>
                    <span>emelkedő</span>
                  </div>
                  <div className="ertekek__elem">
                    <strong>{nehez.szo}</strong>
                    <span>nehézség</span>
                  </div>
                </div>

                <Tanacsok pontok={pontok} jelolesek={jelolesek} tempo={tempo} magassag={magassag} />

                <div className="gombsor">
                  <button className="gomb gomb--fo" onClick={linkMasol}>Megosztható link</button>
                  <button
                    className="gomb gomb--halk"
                    onClick={() => gpxLetoltes({ nev: nev.trim() || 'Túrabakancs', pontok, jelolesek })}
                  >
                    GPX
                  </button>
                </div>
              </div>
            )}

            {/* 3. Az eszközök — csak ha van min dolgozni */}
            {!ures && (
              <details className="fiok">
                <summary>Szerkesztés és mentés</summary>
                <div className="fiok__tartalom">
                  <div className="gombsor">
                    <button className="gomb gomb--halk" onClick={() => setPontok((p) => p.slice(0, -1))}>
                      Utolsó pont vissza
                    </button>
                    {huzasElott ? (
                      <button
                        className="gomb gomb--halk"
                        onClick={() => {
                          setPontok(huzasElott);
                          setHuzasElott(null);
                          setIlleszt((n) => n + 1);
                          setUzenet('Visszaálltak az eredeti pontjaid.');
                        }}
                      >
                        Húzás visszavonása
                      </button>
                    ) : (
                      <button
                        className="gomb gomb--halk"
                        onClick={osvenyre}
                        disabled={!vanUt || huzas}
                        aria-busy={huzas}
                        title="A pontjaidat ráteszi a tényleges gyalogutakra"
                      >
                        Ösvényre húzás
                      </button>
                    )}
                    <button
                      className="gomb gomb--halk"
                      onClick={() => {
                        setPontok([]);
                        setJelolesek([]);
                        setNev('');
                        setAktivId(null);
                        setUzenet(null);
                        setHuzasElott(null);
                      }}
                    >
                      Üres lap
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
                    <button className="gomb gomb--halk" type="submit">
                      {aktivId ? 'Mentés frissítése' : 'Mentés a böngészőbe'}
                    </button>
                  </form>

                  <JelolesLista
                    jelolesek={jelolesek}
                    onCimke={(i, cimke) =>
                      setJelolesek((e) => e.map((j, n) => (n === i ? { ...j, cimke } : j)))
                    }
                    onTorol={(i) => setJelolesek((e) => e.filter((_, n) => n !== i))}
                    onOdaugrik={(j) => terkep.current?.setView([j.lat, j.lng], 16)}
                  />
                </div>
              </details>
            )}

            {/* 4. Ami készen várakozik */}
            <details className="fiok">
              <summary>Kész útvonalak</summary>
              <div className="fiok__tartalom">
                <KozeliTurak
                  lista={kozeli}
                  onBetolt={(p) => betolt({ nev: p.nev, pontok: p.pontok, jelolesek: p.jelolesek })}
                />
                <TuraLista terkep={terkepKesz ? terkep.current : null} onBetolt={turatBetolt} />
                <a className="gomb gomb--halk gomb--szeles" href="/utvonalak">
                  Mind a {peldaUtvonalak.length} példa
                </a>
              </div>
            </details>

            {tervek.length > 0 && (
              <details className="fiok">
                <summary>Mentett terveid ({tervek.length})</summary>
                <div className="fiok__tartalom">
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
                  <p className="apro">Csak ezen a böngészőn. Túra előtt töltsd le GPX-ben.</p>
                </div>
              </details>
            )}

            <Labjegyzet tomor />
          </div>
        </aside>
      </div>
    </section>
  );
}
