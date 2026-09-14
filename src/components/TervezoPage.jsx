import { useEffect, useMemo, useRef, useState } from 'react';
import Terkep from './TerkepKesobb.jsx';
import HonnanHova from './HonnanHova.jsx';
import KozeliTurak from './KozeliTurak.jsx';
import TuraLista from './TuraLista.jsx';
import JelolesLista from './JelolesLista.jsx';
import Tanacsok from './Tanacsok.jsx';
import Labjegyzet from './Labjegyzet.jsx';

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
import { GpxHiba, gpxBeolvas, gpxLetoltes } from '../data/gpx.js';
import { UtvonalHiba, osvenyreHuz, ritkit as utatRitkit } from '../data/utvonalkereso.js';
import { idoHelyBeallit } from '../data/idoHely.js';
import { KEZDO_KOZEP } from '../data/terkepAlap.js';
import { kozeliTurak } from '../data/kozeli.js';
import { peldaUtvonalak } from '../data/peldak.js';
import { tervMentes, tervTorles, useTervek } from '../data/tarolo.js';
import { ut, useRoute } from '../router.js';
import { sz } from '../nyelv/index.js';

/* A fejléc alatti lapok neve. Az ikonok némák, a képernyőolvasó ezt
   mondja ki helyettük. */
const LAP_KULCSA = {
  hova: 'tervezo.honnanHova',
  adat: 'tervezo.adatok',
  eszkoz: 'tervezo.eszkozok',
};

/* A tervező.

   A térkép a teljes felület, és semmi nem lebeg fölötte. A vezérlők a
   fejléc sávjában ülnek, ikonként:

     rétegek   mit mutasson a térkép (ivóvíz, pad, busz, parkoló, kilátó,
               vendéglátás) — ezeket a Terkep.jsx teszi oda
     kérdés    honnan hova
     válasz    táv, menetidő, emelkedő, nehézség, tanácsok
     eszközök  mentés, kész útvonalak, GPX
     vissza    egy lépés visszafelé

   Az első négy mögül egy-egy lap nyílik le a sáv alól, egyszerre egy.
   Ez volt a sorrend: oldalsáv → felhúzható lap → lebegő widgetek → sáv.
   Mindegyik lépésben ugyanaz a cél: több térkép, kevesebb keret. */

/* Két dolgot tartunk külön:

   - `horgonyok`: amit a felhasználó kattintott. Ezeket lehet húzni, törölni.
   - `pontok`: amit kirajzolunk, mentünk, megosztunk. Ez rendszerint a
     horgonyokra illesztett, valódi gyalogutakon futó vonal.

   Ha nem választanánk szét őket, a harmadik kattintásnál már a kétszázötven
   pontos, kész vonalat küldenénk újra az útvonalkeresőnek — és a vonal
   lépésről lépésre eltorzulna. */

/* Ennél hosszabb vonalat nem kattintással raktak össze, hanem egy
   szolgáltatás adta. Azt nem horgonyonként szerkesztjük. */
const HORGONY_MAX = 12;
const horgonynak = (vonal) => (vonal.length <= HORGONY_MAX ? vonal : []);

export default function TervezoPage() {
  const { params } = useRoute();
  const terkep = useRef(null);
  const [terkepKesz, setTerkepKesz] = useState(false);
  /* Az időjárás helye. Alapból a térkép közepe (betöltéskor egyszer), utána
     az útvonal kezdőpontja. Pásztázásra NEM követ: az Open-Meteo ingyenes
     szolgáltatás, nem kérdezzük minden térképmozdulatra.

     Maga a hőmérséklet a fejlécben látszik, ezért a helyet oda adjuk át.

     A kiindulás a térkép alaphelye, nem `null`: a térkép külön darabban
     érkezik, és ha a fokot is megvárnánk vele, másodpercekkel később
     jelenne meg. Amint a térkép kész, felülírja a tényleges közepével. */
  const [terkepKozep, setTerkepKozep] = useState(KEZDO_KOZEP);

  const [pontok, setPontok] = useState(() => dekodol(params.get('ut')));
  const [horgonyok, setHorgonyok] = useState(() => horgonynak(dekodol(params.get('ut'))));
  const [jelolesek, setJelolesek] = useState(() => jeloleseketDekodol(params.get('j')));
  const [nev, setNev] = useState('');
  const [tempo, setTempo] = useState('gyalog');
  const [uzenet, setUzenet] = useState(null);
  const [illeszt, setIlleszt] = useState(0);
  const [aktivId, setAktivId] = useState(null);
  /* Melyik lap van nyitva a fejléc alatt: a kérdés, a válasz vagy az
     eszközök. Egyszerre csak egy — a fejléc alatti hely egy lapé. */
  /* `{ id, zarul }` vagy `null`. A `zarul` azért kell, mert a becsukódás
     animált: a tálca még ott van egy pillanatig, miközben már fogy. */
  const [lap, setLap] = useState(null);
  const nyitottLap = lap && !lap.zarul ? lap.id : null;
  const [kozeli, setKozeli] = useState(null);
  const [huzas, setHuzas] = useState(false);
  const [vanVissza, setVanVissza] = useState(false);
  const [magassag, setMagassag] = useState(null);

  /* Az utolsó horgonysor, amit már elküldtünk az útvonalkeresőnek. */
  const huzottKulcs = useRef('');
  /* Minden húzás kap egy sorszámot: ha közben visszaléptek, a befutó
     eredményt eldobjuk. */
  const futoHuzas = useRef(0);
  /* A térkép sarkában lévő nyíl verme. */
  const elozmeny = useRef([]);

  const tervek = useTervek();
  const km = useMemo(() => hossz(pontok), [pontok]);
  const utParam = params.get('ut');
  const jParam = params.get('j');
  const vonalKulcs = useMemo(() => kodol(pontok), [pontok]);
  const horgonyKulcs = useMemo(() => kodol(horgonyok), [horgonyok]);
  /* Van-e olyan horgonysor, amit még nem húztunk ösvényre. Rendereléskor
     pontos: a horgonyok változása és a `huzas` billenése is újrarendel. */
  const huzasVar = horgonyok.length >= 2 && horgonyKulcs !== huzottKulcs.current;

  const lapDoboz = useRef(null);
  const oszlopDoboz = useRef(null);
  const rudDoboz = useRef(null);
  /* Az ikon melletti felirat: `{ szoveg, teto, magas }` vagy `null`. A
     helyét a gomb adja, hogy pontosan a sorában üljön. */
  const [cimke, setCimke] = useState(null);
  const cimkeOra = useRef(0);
  /* Rögzített a tálca, ha KÉRTÉK: rákattintottak az ikonra, vagy épp
     beleírnak. Ilyenkor az egér elvitele nem csukja be — a legrosszabb,
     ami egy ráhúzásra nyíló tálcával történhet, hogy gépelés közben
     kihúzzák alóla a mezőt. */
  const rogzitve = useRef(false);
  const egerBent = useRef(false);
  const nyitoOra = useRef(0);
  const zaroOra = useRef(0);
  const bontoOra = useRef(0);

  /* Ráhúzásnál nem rögtön nyílik: a rúd mellett elhaladó egér ne
     nyitogasson. Becsukni pedig türelmesebben kell, mint kinyitni — a
     sarkot levágó egérmozdulat ne vegye el a tálcát. */
  const NYIT_MS = 160;
  const ZAR_MS = 260;
  const KIFUT_MS = 140;

  const orakStop = () => {
    clearTimeout(nyitoOra.current);
    clearTimeout(zaroOra.current);
    clearTimeout(bontoOra.current);
  };

  const nyit = (id, kerte) => {
    orakStop();
    rogzitve.current = kerte;
    setLap({ id, zarul: false });
  };

  const zar = () => {
    orakStop();
    rogzitve.current = false;
    setLap((e) => (e ? { ...e, zarul: true } : null));
    const keves = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    bontoOra.current = setTimeout(() => setLap(null), keves ? 0 : KIFUT_MS);
  };

  /* Kattintásra ugyanaz marad, ami eddig volt: kapcsol, és nyitva is
     tartja. Ez a billentyűzet és az érintés útja is. */
  const lapot = (id) => {
    if (nyitottLap === id) zar();
    else nyit(id, true);
  };

  const rahuzas = (id) => (e) => {
    /* Csak egérrel. Ujjal nincs „ráhúzás", ott a koppintás nyit. */
    if (e.pointerType !== 'mouse') return;
    /* Amibe épp írnak, azt egy elhaladó egér nem cserélheti le. */
    if (rogzitve.current) return;
    orakStop();
    if (nyitottLap === id) return;
    nyitoOra.current = setTimeout(() => nyit(id, false), NYIT_MS);
  };

  const oszlopraLep = () => {
    egerBent.current = true;
    clearTimeout(zaroOra.current);
  };
  const oszloprolLe = (e) => {
    /* A rétegikonok PORTÁLON át kerülnek a rúdba (a térkép rendeli őket),
       és a React a ki-belépést a saját fájára számolja, nem a DOM-ra —
       így „kilépésnek" látja azt is, ha csak átmegyünk rajtuk. A DOM
       viszont tudja az igazat: ha a másik elem is az oszlopban van, nem
       léptünk sehova. */
    if (e.relatedTarget && oszlopDoboz.current?.contains(e.relatedTarget)) return;
    egerBent.current = false;
    clearTimeout(nyitoOra.current);
    if (e.pointerType !== 'mouse' || rogzitve.current || !lap) return;
    zaroOra.current = setTimeout(zar, ZAR_MS);
  };

  /* Amint beleírnak, a tálca marad. Amint kilép belőle a fókusz, megint
     az egér dönt — így „ha megvan, eltűnik". */
  const talcabaFokusz = () => { rogzitve.current = true; };
  const talcabolKi = (e) => {
    if (lapDoboz.current?.contains(e.relatedTarget)) return;
    rogzitve.current = false;
    if (!egerBent.current && lap) {
      clearTimeout(zaroOra.current);
      zaroOra.current = setTimeout(zar, ZAR_MS);
    }
  };

  /* Escape zárja, és a lapon kívülre koppintva is becsukódik. A sávban lévő
     ikonok maguk kapcsolgatnak, őket ki kell hagyni. */
  useEffect(() => {
    if (!lap) return undefined;
    const billentyu = (e) => e.key === 'Escape' && zar();
    const kattintas = (e) => {
      if (!e.target.closest('.eszkoz-oszlop')) zar();
    };
    document.addEventListener('keydown', billentyu);
    document.addEventListener('pointerdown', kattintas);
    return () => {
      document.removeEventListener('keydown', billentyu);
      document.removeEventListener('pointerdown', kattintas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lap]);

  /* Az időzítők ne éljék túl a lapot. */
  useEffect(() => orakStop, []);

  /* ---- Felirat az ikon mellé ----

     A rétegikonok mellé eddig a gyári buboréksúgó írta ki, mi micsoda.
     Most a tálcával egy stílusban nő ki a rúdból, egyetlen ikonsornyi
     magasan — a tálca szélességében, hogy a kettő egy rendszer legyen.

     NATÍV ESEMÉNYFIGYELŐ, nem React: a rétegikonok portálon át kerülnek
     a rúdba, és a React a buborékolást a saját fájára számolja — így a
     rúdra tett React-figyelő meg sem kapná őket. A DOM-é igen. */
  useEffect(() => {
    const rud = rudDoboz.current;
    const oszlop = oszlopDoboz.current;
    if (!rud || !oszlop) return undefined;

    const CIMKE_MS = 160;
    const allj = () => { clearTimeout(cimkeOra.current); setCimke(null); };

    const mutasd = (gomb) => {
      const g = gomb.getBoundingClientRect();
      const o = oszlop.getBoundingClientRect();
      setCimke({
        szoveg: gomb.dataset.cimke,
        teto: Math.round(g.top - o.top),
        magas: Math.round(g.height),
      });
    };

    const ra = (e) => {
      const gomb = e.target.closest?.('.reteg-gomb[data-cimke]');
      clearTimeout(cimkeOra.current);
      if (!gomb) { setCimke(null); return; }
      /* Ujjal nincs ráhúzás, és a saját ujjad alá írt felirat úgyis
         takarna. */
      if (e.pointerType && e.pointerType !== 'mouse') return;
      cimkeOra.current = setTimeout(() => mutasd(gomb), CIMKE_MS);
    };

    /* Billentyűzettel járva ne kelljen várni rá. */
    const fokuszra = (e) => {
      const gomb = e.target.closest?.('.reteg-gomb[data-cimke]');
      clearTimeout(cimkeOra.current);
      if (gomb) mutasd(gomb);
      else setCimke(null);
    };

    rud.addEventListener('pointerover', ra);
    rud.addEventListener('pointerleave', allj);
    rud.addEventListener('focusin', fokuszra);
    rud.addEventListener('focusout', allj);
    rud.addEventListener('scroll', allj);
    return () => {
      clearTimeout(cimkeOra.current);
      rud.removeEventListener('pointerover', ra);
      rud.removeEventListener('pointerleave', allj);
      rud.removeEventListener('focusin', fokuszra);
      rud.removeEventListener('focusout', allj);
      rud.removeEventListener('scroll', allj);
    };
  }, []);

  /* A fejléc hőmérséklete a túra helyét mutatja: az útvonal kezdőpontját,
     vagy amíg nincs útvonal, a térkép közepét. */
  useEffect(() => {
    idoHelyBeallit(pontok.length > 0 ? pontok[0] : terkepKozep);
  }, [pontok, terkepKozep]);

  /* Megosztott link akkor is töltsön be, ha az oldalon belül navigálunk rá. */
  useEffect(() => {
    const ujPontok = dekodol(utParam);
    const ujJelolesek = jeloleseketDekodol(jParam);
    if (ujPontok.length === 0 && ujJelolesek.length === 0) return;
    setPontok((eddigi) => (kodol(eddigi) === kodol(ujPontok) ? eddigi : ujPontok));
    setJelolesek((eddigi) =>
      JSON.stringify(eddigi) === JSON.stringify(ujJelolesek) ? eddigi : ujJelolesek,
    );
    const horgony = horgonynak(ujPontok);
    huzottKulcs.current = kodol(horgony);
    setHorgonyok(horgony);
    setIlleszt((n) => n + 1);
  }, [utParam, jParam]);

  /* ---- Ösvényre húzás magától ----

     Amint két pont megvan, a vonal magától rákerül a valódi gyalogutakra —
     nem kell hozzá gomb.

     Másfél másodpercet várunk az utolsó változás után. Az útvonalkeresőt
     (FOSSGIS OSRM) közösségi szolgáltatásként kapjuk, kulcs és fizetés
     nélkül: nem küldünk rá kérést minden egyes koppintásra.

     A kérés mindig a horgonyokból indul, sosem az előző eredményből. */
  useEffect(() => {
    if (horgonyok.length < 2) {
      huzottKulcs.current = horgonyKulcs;
      return undefined;
    }
    if (horgonyKulcs === huzottKulcs.current) return undefined;

    const ora = setTimeout(() => {
      huzottKulcs.current = horgonyKulcs;
      const sajat = (futoHuzas.current += 1);
      setHuzas(true);
      osvenyreHuz(horgonyok)
        .then((e) => {
          if (futoHuzas.current !== sajat) return;
          setPontok(utatRitkit(e.pontok));
        })
        .catch((hiba) => {
          if (futoHuzas.current !== sajat) return;
          /* A szolgáltatás saját üzenete pontosabb, mint bármi, amit itt
             kitalálnánk (nincs gyalogút, túl sok kérés, túl sok pont). */
          const ok = hiba instanceof UtvonalHiba ? hiba.message : sz('hiba.utvonalkereso');
          setUzenet(sz('terv.egyenesMarad', { ok }));
        })
        .finally(() => {
          if (futoHuzas.current === sajat) setHuzas(false);
        });
    }, 1500);
    return () => clearTimeout(ora);
    /* A `horgonyok` a kulcsával együtt változik, ezért elég a kulcs. */
  }, [horgonyKulcs]);

  /* A magassági adat magától töltődik — de csak akkor, ha a vonal másfél
     másodpercig nem változott. Rajzolás közben így nem megy ki kérés
     minden egyes kattintásra.

     Ha az ösvényre húzás még hátravan vagy épp fut, megvárjuk: különben
     kétszer kérdeznénk le a magasságot — egyszer az ideiglenes egyenes
     vonalra, aztán a valódira. */
  useEffect(() => {
    setMagassag(null);
    if (pontok.length < 2 || huzas || huzasVar) return undefined;
    const ora = setTimeout(() => {
      magassagot(pontok)
        .then(setMagassag)
        .catch(() => setMagassag(null));
    }, 1500);
    return () => clearTimeout(ora);
  }, [vonalKulcs, pontok.length, huzas, huzasVar]);

  /* Egy lépés megjegyzése a nyílhoz. Mindig a művelet ELŐTT hívjuk. */
  const megjegyez = ({ cimke = false } = {}) => {
    const teteje = elozmeny.current[elozmeny.current.length - 1];
    /* Címke gépelése közben ne gyűljön minden betűről külön lépés. */
    if (cimke && teteje?.cimkezes) return;
    elozmeny.current = [
      ...elozmeny.current,
      { pontok, horgonyok, jelolesek, nev, aktivId, kulcs: huzottKulcs.current, cimkezes: cimke },
    ].slice(-30);
    setVanVissza(true);
  };

  const vissza = () => {
    const elozo = elozmeny.current.pop();
    if (!elozo) return;
    futoHuzas.current += 1; // a még futó húzás eredménye ne érjen ide vissza
    huzottKulcs.current = elozo.kulcs;
    setPontok(elozo.pontok);
    setHorgonyok(elozo.horgonyok);
    setJelolesek(elozo.jelolesek);
    setNev(elozo.nev);
    setAktivId(elozo.aktivId);
    setHuzas(false);
    setUzenet(null);
    setVanVissza(elozmeny.current.length > 0);
  };

  const betolt = (terv) => {
    megjegyez();
    const vonal = terv.pontok ?? [];
    const horgony = terv.horgonyok ?? horgonynak(vonal);
    futoHuzas.current += 1;
    huzottKulcs.current = kodol(horgony);
    setPontok(vonal);
    setHorgonyok(horgony);
    setJelolesek(terv.jelolesek ?? []);
    setNev(terv.nev ?? '');
    setAktivId(terv.id ?? null);
    setUzenet(null);
    setHuzas(false);
    setIlleszt((n) => n + 1);
  };

  /* ---- Amit a térképen csinálsz ---- */

  const pontHozzaad = (p) => {
    const ujKezdes = horgonyok.length === 0 && pontok.length > 0;
    megjegyez();
    const uj = [...horgonyok, p];
    setHorgonyok(uj);
    setPontok(uj); // azonnali visszajelzés; a húzás másfél másodperc múlva felülírja
    setUzenet(ujKezdes ? sz('terv.ujKezdtel') : null);
  };

  /* A jelölők a horgonyokon ülnek, ha vannak; különben magán a vonalon
     (betöltött túránál csak a rajt és a cél). Az index ezért oda mutat. */
  const pontCsere = (kesz) => {
    megjegyez();
    if (horgonyok.length > 0) {
      const uj = kesz(horgonyok);
      setHorgonyok(uj);
      setPontok(uj);
    } else {
      setPontok(kesz(pontok));
    }
  };

  const turatBetolt = ({ nev: utNev, pontok: ujPontok, eredetiPontok, eredetiHossz }) => {
    betolt({ nev: utNev, pontok: ujPontok, jelolesek: [] });
    setUzenet(
      eredetiPontok > ujPontok.length
        ? `Betöltve. A vonalat ritkítottam, hogy szerkeszthető maradjon — a valódi hossz ${kmSzoveg(eredetiHossz)}.`
        : sz('terv.betoltve'),
    );
  };

  /* GPX betöltése. A fájl nem megy sehova: a böngésző olvassa be.

     A betöltött nyomvonalat szándékosan NEM húzzuk ösvényre — ez a
     felhasználó saját adata, egy rögzített nyom vagy egy máshonnan kapott
     terv. Nem a mi dolgunk átrajzolni. Ezért kap üres horgonylistát. */
  const gpxBetolt = async (fajl) => {
    if (!fajl) return;
    if (fajl.size > 5 * 1024 * 1024) {
      setUzenet(sz('gpx.nagy'));
      return;
    }
    try {
      const t = gpxBeolvas(await fajl.text());
      betolt({
        nev: t.nev || fajl.name.replace(/\.gpx$/i, ''),
        pontok: t.pontok,
        jelolesek: t.jelolesek,
        horgonyok: [],
      });
      const reszek = [];
      if (t.pontok.length >= 2) reszek.push(`${t.pontok.length} pont`);
      if (t.jelolesek.length > 0) reszek.push(`${t.jelolesek.length} jelölés`);
      setUzenet(
        `Betöltve: ${reszek.join(', ')}.` +
          (t.ritkitva ? ` A ${t.eredetiPontok} pontos nyomvonalat ritkítottam, hogy szerkeszthető maradjon.` : ''),
      );
    } catch (e) {
      setUzenet(e instanceof GpxHiba ? e.message : sz('gpx.nemSikerult'));
    }
  };

  const linkMasol = async () => {
    const cim = tervLinkje(`${window.location.origin}/tervezo`, { pontok, jelolesek });
    try {
      await navigator.clipboard.writeText(cim);
      setUzenet(sz('terv.vagolapon'));
    } catch {
      window.history.replaceState({}, '', tervLinkje('/tervezo', { pontok, jelolesek }));
      setUzenet(sz('terv.cimsorban'));
    }
  };

  const ment = (event) => {
    event.preventDefault();
    if (pontok.length < 2 && jelolesek.length === 0) return;
    const mentett = tervMentes({ id: aktivId, nev: nev.trim() || sz('terv.nevtelen'), pontok, jelolesek });
    setAktivId(mentett.id);
    setUzenet(sz('terv.elmentve'));
  };

  /* A térképre írt súgó felugrik, majd magától eltűnik — a felhasználó
     kérte. Állandóan kint hagyva zavaró: eltakarja a térképet, és aki már
     tudja, mit kell csinálni, annak fölösleges.

     Újra megjelenik, valahányszor MÁS mondanivalója lesz: módváltáskor, az
     első pont után, ösvényre húzás közben. Tehát nem vész el, csak nem ül
     ott örökké. */
  const sugSzoveg = huzas
    ? sz('terkep.igazit')
    : horgonyok.length === 1
      ? sz('terkep.masodik')
      : horgonyok.length === 0 && pontok.length > 1
        ? sz('terkep.keszUt')
        : sz('terkep.sug');

  const [sugLathato, setSugLathato] = useState(true);
  useEffect(() => {
    setSugLathato(true);
    const ora = setTimeout(() => setSugLathato(false), 5000);
    return () => clearTimeout(ora);
  }, [sugSzoveg]);

  const ures = pontok.length === 0 && jelolesek.length === 0;
  const vanUt = pontok.length >= 2;
  const ido = vanUt ? menetido(km, tempo, magassag?.fel) : 0;
  const nehez = vanUt ? nehezseg(km, magassag?.fel) : null;
  const idoSzoveg =
    ido < 60
      ? sz('ido.rovidPerc', { p: ido })
      : sz('ido.rovidOra', { o: Math.floor(ido / 60), p: String(ido % 60).padStart(2, '0') });

  return (
    <section className="tervezo">
      {/* A tervező egy teljes képernyős térkép: nincs rajta látható cím.
          A lapnak viszont kell egy — az előállított HTML-ben van is, csak
          a React azt lecseréli erre az alkalmazásra, és a képernyőolvasó
          onnantól címek nélküli oldalt talál. Ugyanaz a kulcs, mint az
          előállításban (eloallit.js), hogy a kettő ne tudjon elcsúszni. */}
      <h1 className="csak-olvasonak">{sz('tervezo.oldalCim')}</h1>
      <div className="tervezo__racs">
        <div className="tervezo__terkep-doboz">
          <Terkep
            pontok={pontok}
            horgonyok={horgonyok.length > 0 ? horgonyok : null}
            jelolesek={jelolesek}
            mod="ut"

            illeszt={illeszt}
            retegGombok
            onKesz={(map) => {
              terkep.current = map;
              setTerkepKesz(true);
              const k = map.getCenter();
              setTerkepKozep([k.lat, k.lng]);
            }}
            onPontHozzaad={pontHozzaad}
            onPontMozgat={(i, p) => pontCsere((lista) => lista.map((x, n) => (n === i ? p : x)))}
            onPontTorol={(i) => pontCsere((lista) => lista.filter((_, n) => n !== i))}
            onJelolesHozzaad={(j) => {
              megjegyez();
              setJelolesek((e) => [...e, { ...j, cimke: '' }]);
            }}
            onJelolesMozgat={(i, hely) => {
              megjegyez();
              setJelolesek((e) => e.map((x, n) => (n === i ? { ...x, ...hely } : x)));
            }}
            onJelolesTorol={(i) => {
              megjegyez();
              setJelolesek((e) => e.filter((_, n) => n !== i));
            }}
          />

          {/* Itt volt a módváltó és a jelölőpaletta. A jelöléstípusokból
              réteg lett: amit eddig kézzel kellett kirakni, azt most
              megkeressük. A rétegikonok a fejléc sávjában ülnek
              (a Terkep.jsx teszi oda őket).

              A jelölések maguk nem tűntek el: a GPX-ből betöltött és a
              megosztható linkben érkező jelölések továbbra is megjelennek,
              és a „Szerkesztés és mentés” fiókban átnevezhetők, törölhetők.
              Új jelölést viszont már nem lehet kézzel kirakni. */}

          {/* ---- Eszközrúd a térkép bal szélén ----

              Minden vezérlő egy helyen, csak ikonként: fent a rétegek
              (azokat a Terkep.jsx portálozza a rúdba), alattuk a lapok.
              A rúd a bal szélen, függőlegesen középen áll — ott, ahol a
              kéz úgyis van rajzolás közben.

              A lapok nem külön ablakként ugranak ki: a rúdhoz nőve
              nyílnak, tálcaként. Ezért van a kettő egy sorban, hézag
              nélkül, és ezért veszi le a rúd a jobb oldali lekerekítését,
              amikor nyitva van. */}
          <div
            className="eszkoz-oszlop"
            ref={oszlopDoboz}
            onPointerEnter={oszlopraLep}
            onPointerLeave={oszloprolLe}
          >
            <div className="eszkoz-rud" ref={rudDoboz}>
              <div id="terkep-eszkozok" />

              <div className="eszkozsor eszkozsor--lapok">
              <button
                className={`reteg-gomb${nyitottLap === 'hova' ? ' reteg-gomb--nyitva' : ''}`}
                onClick={() => lapot('hova')}
                onPointerEnter={rahuzas('hova')}
                aria-expanded={nyitottLap === 'hova'}
                title={sz('tervezo.honnanHova')}
                aria-label={sz('tervezo.honnanHova')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.6-3.6" />
                </svg>
              </button>

              {vanUt && (
                <button
                  className={`reteg-gomb${nyitottLap === 'adat' ? ' reteg-gomb--nyitva' : ''}`}
                  onClick={() => lapot('adat')}
                onPointerEnter={rahuzas('adat')}
                  aria-expanded={nyitottLap === 'adat'}
                  title={sz('tervezo.adatokCimke', { km: kmSzoveg(km), ido: idoSzoveg })}
                  aria-label={sz('tervezo.adatokCimke', { km: kmSzoveg(km), ido: idoSzoveg })}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 19V5" />
                    <path d="M4 19h16" />
                    <path d="m7 15 4-5 3 3 5-7" />
                  </svg>
                </button>
              )}

              <button
                className={`reteg-gomb${nyitottLap === 'eszkoz' ? ' reteg-gomb--nyitva' : ''}`}
                onClick={() => lapot('eszkoz')}
                onPointerEnter={rahuzas('eszkoz')}
                aria-expanded={nyitottLap === 'eszkoz'}
                title={sz('tervezo.eszkozok')}
                aria-label={sz('tervezo.eszkozok')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              {vanVissza && (
                <button
                  className="reteg-gomb"
                  onClick={vissza}
                  data-cimke={sz('tervezo.vissza')}
                  aria-label={sz('tervezo.vissza')}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h9a6.5 6.5 0 0 1 0 13h-2.5" />
                  </svg>
                </button>
              )}
              </div>
            </div>

            {/* A felirat és a tálca ugyanazt a helyet foglalja — nyitott
                tálca mellett nincs mit kiírni. */}
            {cimke && !lap && (
              <div
                className="reteg-cimke"
                style={{ '--cimke-teto': `${cimke.teto}px`, '--cimke-magas': `${cimke.magas}px` }}
                aria-hidden="true"
              >
                <span>{cimke.szoveg}</span>
              </div>
            )}

            {lap && (
              <div
                className={`eszkoz-talca${lap.zarul ? ' eszkoz-talca--zarul' : ''}`}
                ref={lapDoboz}
                role="dialog"
                aria-label={sz(LAP_KULCSA[lap.id])}
                onFocusCapture={talcabaFokusz}
                onBlurCapture={talcabolKi}
              >

                {lap.id === 'hova' && (
                  <>
                    {/* 1. A kérdés */}
                    <HonnanHova
                      onUgras={(pont, { kozeli: kell } = {}) => {
                        terkep.current?.flyTo({ center: [pont[1], pont[0]], zoom: 13 });
                        if (kell) setKozeli(kozeliTurak(pont));
                        zar();
                      }}
                      onUtvonal={({ pontok: ujPontok, nev: ujNev, honnan, horgonyok: ujHorgonyok }) => {
                        betolt({ nev: ujNev, pontok: ujPontok, jelolesek: [], horgonyok: ujHorgonyok });
                        setKozeli(kozeliTurak(honnan));
                        setUzenet(sz('terkep.keszVonal'));
                        zar();
                      }}
                    />
                  </>
                )}

                {lap.id === 'adat' && vanUt && (
                  <>
                    <div className="ertekek">
                      <div className="ertekek__elem">
                        <strong>{kmSzoveg(km)}</strong>
                        <span>{sz('adat.hossz')}</span>
                      </div>
                      <div className="ertekek__elem ertekek__elem--kiemelt">
                        <strong>
                          {idoSzoveg}
                        </strong>
                        <span>
                          <select
                          className="tempo"
                          value={tempo}
                          onChange={(e) => setTempo(e.target.value)}
                          aria-label={sz('adat.tempo')}
                          >
                          {TEMPOK.map((t) => (
                            <option key={t.id} value={t.id}>{sz(t.nevKulcs)}</option>
                          ))}
                          </select>
                        </span>
                      </div>
                      <div className="ertekek__elem">
                        <strong>{magassag ? `↑ ${magassag.fel} m` : '…'}</strong>
                        <span>{sz('adat.emelkedo')}</span>
                      </div>
                      <div className="ertekek__elem">
                        <strong>{nehez.szo}</strong>
                        <span>{sz('adat.nehezseg')}</span>
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
                  </>
                )}

                {lap.id === 'eszkoz' && (
                  <>
                    {/* 3. Az eszközök — csak ha van min dolgozni */}
                    {!ures && (
                    <details className="fiok">
                      <summary>Szerkesztés és mentés</summary>
                      <div className="fiok__tartalom">
                        <form className="mentes" onSubmit={ment}>
                          <label className="mezo">
                            <span>A terv neve</span>
                            <input
                              type="text"
                              value={nev}
                              onChange={(e) => setNev(e.target.value)}
                              placeholder={sz('adat.nev')}
                            />
                          </label>
                          <button className="gomb gomb--halk" type="submit">
                            {aktivId ? sz('terv.mentesFrissit') : sz('terv.mentesBongeszobe')}
                          </button>
                        </form>

                        <JelolesLista
                          jelolesek={jelolesek}
                          onCimke={(i, cimke) => {
                            megjegyez({ cimke: true });
                            setJelolesek((e) => e.map((j, n) => (n === i ? { ...j, cimke } : j)));
                          }}
                          onTorol={(i) => {
                            megjegyez();
                            setJelolesek((e) => e.filter((_, n) => n !== i));
                          }}
                          onOdaugrik={(j) => terkep.current?.flyTo({ center: [j.lng, j.lat], zoom: 16 })}
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

                      <label className="gomb gomb--halk gomb--szeles gomb--fajl">
                        GPX betöltése
                        <input
                          type="file"
                          accept=".gpx,application/gpx+xml,application/xml,text/xml"
                          onChange={(e) => {
                            gpxBetolt(e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <p className="apro">
                        Saját nyomvonal a telefonodról vagy egy ismerőstől. A fájl a böngésződben
                        marad, nem töltődik fel sehova.
                      </p>
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* A rajzolás visszajelzése: rövid üzenet a térkép tetején.
              Nem vezérlő, magától elmúlik. */}
          {uzenet && <p className="uzenet uzenet--lebego">{uzenet}</p>}



          <p className={`terkep__sug${sugLathato ? '' : ' terkep__sug--rejtve'}`}>{sugSzoveg}</p>
        </div>

      </div>
    </section>
  );
}
