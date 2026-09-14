import { useEffect, useRef, useState } from 'react';
import { peldaUtvonalak } from '../data/peldak.js';
import { tuHtml } from '../data/jelolesek.js';
import { hossz, kmSzoveg } from '../data/utvonalak.js';
import { sz } from '../nyelv/index.js';
import { ut } from '../router.js';

/* Egy ösvény, ami görgetésre rajzolódik meg.

   MIÉRT VALÓDI ÚTVONAL: a kezdőlapon minden rajz a példák VALÓDI
   pontjaiból készül — ez sincs kivétel. A Dobogókő – Rám-szakadék –
   Dömös azért ez a túra, mert álló formátumú (magasabb, mint amilyen
   széles), szépen kanyarog, és három jelölése van: parkoló a rajtnál,
   a létrás szakasz a közepén, busz és hajó a célnál. A három jelölés
   ott gyullad ki, ahol tényleg van.

   HOGYAN MŰKÖDIK: a szakasz magas, benne a rajz megragad. Ahogy
   görgetsz rajta, a JavaScript EGYETLEN számot ír ki — hogy hol tartasz
   (0-tól 1-ig) —, a többit a CSS számolja belőle: a vonal
   `stroke-dashoffset`-jét és azt, hogy melyik jelölés látszik már.
   Egy stílusírás képkockánként, semmi több.

   Aki kevesebb mozgást kért, annak a kész ösvény áll ott, végig
   megrajzolva. */

const TURA = 'dobogoko-ram-domos';
const SZELES = 300;
const KERET = 26;

/* Álló formátum: a szakasz egy képernyőnyi magas, a rajz azt tölti ki. */
const MAGAS = 520;

export default function OsvenyGorgetve() {
  const doboz = useRef(null);
  const vonal = useRef(null);
  const [hosszUE, setHosszUE] = useState(0);

  const tura = peldaUtvonalak.find((p) => p.id === TURA);

  /* ---- Vetítés ----
     A hosszúságot a szélességi kör koszinuszával szorozzuk, különben a
     Kárpát-medencében minden vonal negyven százalékkal szélesebbnek
     látszana, mint amilyen. */
  const rajz = (() => {
    if (!tura) return null;
    const { pontok } = tura;
    const kozepLat = pontok.reduce((o, p) => o + p[0], 0) / pontok.length;
    const nyujt = Math.cos((kozepLat * Math.PI) / 180);

    const xs = pontok.map((p) => p[1] * nyujt);
    const ys = pontok.map((p) => -p[0]);
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    const szel = x1 - x0 || 1e-9;
    const mag = y1 - y0 || 1e-9;

    const belsoSz = SZELES - 2 * KERET;
    const belsoMa = MAGAS - 2 * KERET;
    /* Egyetlen arány mindkét tengelyre, hogy a vonal alakja ne torzuljon. */
    const arany = Math.min(belsoSz / szel, belsoMa / mag);
    const eltolX = KERET + (belsoSz - szel * arany) / 2;
    const eltolY = KERET + (belsoMa - mag * arany) / 2;
    const helyre = (lat, lng) => [
      (lng * nyujt - x0) * arany + eltolX,
      (-lat - y0) * arany + eltolY,
    ];

    const helyek = pontok.map(([lat, lng]) => helyre(lat, lng));
    const d = helyek
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join('');

    /* Hol tart a vonal az egyes pontoknál — ebből tudjuk, mikor gyulladjon
       ki egy jelölés. A rajzolt vonal ugyanezeken a pontokon megy át,
       tehát az arány a `getTotalLength()` szerintivel egyezik. */
    const eddig = [0];
    for (let i = 1; i < helyek.length; i += 1) {
      eddig[i] = eddig[i - 1] + Math.hypot(helyek[i][0] - helyek[i - 1][0], helyek[i][1] - helyek[i - 1][1]);
    }
    const teljes = eddig[eddig.length - 1] || 1;

    const allomasok = (tura.jelolesek ?? []).map((j) => {
      /* A jelölés a vonal melletti valódi hely: a hozzá legközelebbi
         útpont mondja meg, hol tart addigra a rajzolás. */
      let legjobb = 0;
      let tavolsag = Infinity;
      const [jx, jy] = helyre(j.lat, j.lng);
      helyek.forEach(([x, y], i) => {
        const t = Math.hypot(x - jx, y - jy);
        if (t < tavolsag) { tavolsag = t; legjobb = i; }
      });
      /* A vonal VÉGÉN álló jelölés sosem gyulladna ki, ha pontosan
         egynél várná a vonalat: a rajzolás ott ér véget. Ezért a
         küszöböt kicsivel a vég elé húzzuk. */
      return {
        ...j,
        x: jx,
        y: jy,
        mikor: Math.min(eddig[legjobb] / teljes, 0.93),
        /* A címke a rajz közepétől ELFELÉ írjon, ne a vonalon keresztül. */
        balra: jx > SZELES / 2,
      };
    });

    return { d, helyek, allomasok, rajt: helyek[0], cel: helyek[helyek.length - 1] };
  })();

  /* A vonal hossza saját egységben — a szaggatás ebből számol. */
  useEffect(() => {
    if (vonal.current) setHosszUE(vonal.current.getTotalLength());
  }, []);

  /* ---- A görgetés állása ----
     Egyetlen szám, egyetlen stílusírás képkockánként. A figyelő csak
     akkor fut, amikor a szakasz a képernyő közelében van — hosszú
     oldalon ne dolgozzon hiába. */
  useEffect(() => {
    const elem = doboz.current;
    if (!elem) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elem.style.setProperty('--halad', '1');
      return undefined;
    }

    let keret = 0;
    const szamol = () => {
      keret = 0;
      const r = elem.getBoundingClientRect();
      const futas = r.height - window.innerHeight;
      const halad = futas <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / futas));
      elem.style.setProperty('--halad', halad.toFixed(4));
    };
    const figyel = () => { if (!keret) keret = requestAnimationFrame(szamol); };

    let figyelunk = false;
    const be = () => {
      if (figyelunk) return;
      figyelunk = true;
      window.addEventListener('scroll', figyel, { passive: true });
      window.addEventListener('resize', figyel);
      /* AZONNAL számolunk is. A figyelő akkor kapcsol be, amikor a szakasz
         képbe ér — de ha a görgetés addigra megállt (ugrás horgonyra,
         újratöltés a lap közepén), nem jön több `scroll` esemény, és a
         vonal örökre a nulladik állásában maradna. */
      szamol();
    };
    const ki = () => {
      if (!figyelunk) return;
      figyelunk = false;
      window.removeEventListener('scroll', figyel);
      window.removeEventListener('resize', figyel);
    };

    const figyelo = new IntersectionObserver(
      ([be_]) => (be_.isIntersecting ? be() : ki()),
      { rootMargin: '400px 0px' },
    );
    figyelo.observe(elem);
    szamol();

    return () => {
      figyelo.disconnect();
      ki();
      cancelAnimationFrame(keret);
    };
  }, []);

  if (!rajz) return null;
  const km = hossz(tura.pontok);

  return (
    <section className="osveny" ref={doboz} data-feltun>
      <div className="osveny__szin">
        <header className="osveny__fej">
          <h2 className="szekcio__cim">{sz('fooldal.osvenyCim')}</h2>
          <p className="szekcio__lead">{sz('fooldal.osvenyLead')}</p>
        </header>

        <div className="osveny__rajz">
          <svg viewBox={`0 0 ${SZELES} ${MAGAS}`} role="img" aria-label={`${tura.nev} — ${tura.hol}`}>
            {/* Halvány teljes nyom: látszik, merre tart az ösvény, mielőtt
                odaérne a vonal. Enélkül a semmibe rajzolna. */}
            <path className="osveny__nyom" d={rajz.d} />
            {/* A talp és a vonal együtt fogy: a szaggatás mindkettőn ugyanaz. */}
            <path className="osveny__talp" d={rajz.d} style={{ '--hossz': hosszUE }} />
            <path className="osveny__vonal" ref={vonal} d={rajz.d} style={{ '--hossz': hosszUE }} />

            <circle className="osveny__rajt" cx={rajz.rajt[0]} cy={rajz.rajt[1]} r="6" />
            <circle
              className="osveny__cel"
              cx={rajz.cel[0]}
              cy={rajz.cel[1]}
              r="6"
              style={{ '--mikor': 0.93 }}
            />
          </svg>

          {/* A jelölések a valódi helyükön ülnek, és ott gyulladnak ki,
              ahová a vonal odaér. Százalékban, hogy a rajzzal együtt
              nyúljanak. */}
          {rajz.allomasok.map((a) => (
            <div
              key={a.cimke}
              className={`osveny__allomas${a.balra ? ' osveny__allomas--balra' : ''}`}
              style={{
                '--mikor': a.mikor.toFixed(3),
                left: `${((a.x / SZELES) * 100).toFixed(2)}%`,
                top: `${((a.y / MAGAS) * 100).toFixed(2)}%`,
              }}
            >
              <span className="osveny__tu" dangerouslySetInnerHTML={{ __html: tuHtml(a.tipus) }} />
              <span className="osveny__cimke">{a.cimke}</span>
            </div>
          ))}
        </div>

        <footer className="osveny__lab">
          <p className="osveny__adat">
            <strong>{tura.nev}</strong>
            <span>{tura.hol} · {kmSzoveg(km)} · {tura.emelkedo?.fel} m {sz('adat.emelkedo')}</span>
          </p>
          <a className="gomb gomb--halk" href={ut(`/utvonalak/${tura.id}`)}>
            {sz('fooldal.osvenyGomb')}
          </a>
        </footer>
      </div>
    </section>
  );
}
