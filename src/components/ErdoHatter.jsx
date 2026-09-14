import { useEffect, useMemo, useRef } from 'react';

/* Erdő a kezdőlap mögött, és egy ösvény, ami végigfut rajta.

   MI EZ: vonalas rajz — fák négy mélységi rétegben, és egy nyomvonal,
   ami a védjegy mögött indul, és a lap aljáig tart. Ahogy görgetsz, a
   vonal rajzolódik, a fák pedig különböző sebességgel csúsznak: a
   közeliek gyorsabban, a távoliak lassabban.

   „HÁROM DIMENZIÓ" IDÉZŐJELBEN: ez nem térbeli motor, hanem PARALLAXIS.
   A mélységet négy dolog adja együtt: a sebesség, a méret, a vonal
   vastagsága és a halványság. Ennyiből a szem mélységet lát — és nem
   kerül bele sem WebGL, sem másfélszáz kilobájt könyvtár.

   MIÉRT NEM VALÓDI ÚTVONAL EZ A VONAL: a lap rajzai (példák, ösvény-
   szakasz) mind valódi pontokból készülnek, és az is marad. EZ viszont
   nem útvonalat állít, hanem összeköti a lapot — ugyanaz a szerepe,
   mint a védjegy vonalának, ami szintén rajzolt. Ezért is halványabb és
   vékonyabb, mint a valódi nyomvonalak: nem versenyezhet velük.

   A TARTALOMHOZ NEM NYÚL: az egész réteg a szöveg mögött ül,
   egéreseményt nem fog el, és a magasságát a lapból olvassa ki. */

/* Ugyanaz az erdő minden betöltéskor és minden nyelven: a helyeket nem
   véletlen adja, hanem egy magból induló sorozat. Így a kép nem ugrál,
   és az előállított oldal is ugyanaz. */
function sorsolo(mag) {
  let s = mag;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/* Vonalas fák. Három alak elég: a sorban a méret és a hely adja a
   változatosságot, nem a rajz. */
const FAK = [
  /* Fenyő — a klasszikus, egymásra rakott háromszög-sziluett, EGY zárt
     vonallal. Külön ágacskákból apró méretben nyílhegy lett, nem fa. */
  {
    w: 40,
    h: 96,
    d: [
      'M20 96V74',
      'M20 6 32 32 25.5 32 36 54 28 54 38.5 76H1.5L12 54 4 54 14.5 32 8 32Z',
    ],
  },
  /* Karcsú fenyő — magasabb, keskenyebb, három szint */
  {
    w: 30,
    h: 104,
    d: [
      'M15 104V82',
      'M15 8 24 34 19 34 27 60 21 60 28.5 84H1.5L9 60 3 60 11 34 6 34Z',
    ],
  },
  /* Lombos — göcsörtös korona, nem szabályos kör */
  {
    w: 48,
    h: 90,
    d: [
      'M24 90V56',
      'M24 68 15 58', 'M24 62 33 52',
      'M24 56C13 56 5 49 5 40c0-6 3-11 8-13 0-9 8-15 16-13 8-2 15 4 15 12 5 3 7 9 6 15-1 9-8 15-16 15z',
    ],
  },
  /* Nyír — vékony törzs, magas, keskeny korona */
  {
    w: 34,
    h: 98,
    d: [
      'M17 98V52',
      'M17 66 9 57', 'M17 60 25 51',
      'M17 54C9 54 4 44 5 33 6 22 11 12 17 12s11 10 12 21c1 11-4 21-12 21z',
    ],
  },
];

/* Négy mélységi réteg. A `faktor` a görgetés melyik hányadával csúszik —
   minél közelebbi, annál gyorsabban. */
const RETEGEK = [
  /* A lombos koronák apró méretben lufinak látszanak, ezért a két
     távoli réteg csak fenyőt kap: a háromszög-sziluett kicsiben is fa
     marad. Közel már elfér a részlet. */
  { mag: 12345, db: 26, meret: [0.42, 0.58], faktor: 0.05, halvany: 0.3, vastag: 1, alakok: [0, 1] },
  { mag: 777, db: 20, meret: [0.58, 0.8], faktor: 0.1, halvany: 0.45, vastag: 1.25, alakok: [0, 1] },
  { mag: 4242, db: 15, meret: [0.8, 1.08], faktor: 0.17, halvany: 0.6, vastag: 1.55, alakok: [0, 1, 2, 3] },
  { mag: 99991, db: 10, meret: [1.08, 1.5], faktor: 0.26, halvany: 0.78, vastag: 1.9, alakok: [0, 1, 2, 3] },
];

/* A fák a két szélen sűrűsödnek: középen a szöveg van. A `sav` azt
   mondja meg, a lap melyik hányadán állhat egy fa. */
const BAL = [0.005, 0.2];
const JOBB = [0.8, 0.995];

function fakat(reteg, index) {
  const rnd = sorsolo(reteg.mag);
  return Array.from({ length: reteg.db }, (_, i) => {
    const jobbra = rnd() > 0.5;
    const [s0, s1] = jobbra ? JOBB : BAL;
    const [m0, m1] = reteg.meret;
    return {
      kulcs: `${index}-${i}`,
      alak: FAK[reteg.alakok[Math.floor(rnd() * reteg.alakok.length)]],
      bal: s0 + rnd() * (s1 - s0),
      /* Függőlegesen egyenletesen, kis szórással — ne álljanak sorba. */
      teto: (i + 0.15 + rnd() * 0.7) / reteg.db,
      meret: m0 + rnd() * (m1 - m0),
      /* Tükrözve is: ugyanaz a három alak kétszer annyi félének látszik. */
      tukor: rnd() > 0.55,
    };
  });
}

export default function ErdoHatter() {
  const doboz = useRef(null);
  const nyom = useRef(null);
  const vonal = useRef(null);
  const svgDoboz = useRef(null);

  const erdo = useMemo(() => RETEGEK.map((r, i) => ({ ...r, fak: fakat(r, i) })), []);

  useEffect(() => {
    const elem = doboz.current;
    const szulo = elem?.parentElement;
    if (!elem || !szulo) return undefined;

    const keves = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Az ösvény vonala ----

       A lap magassága nyelvenként és képernyőnként más, ezért a vonalat
       méretre rajzoljuk, valódi képpontokban: így a vastagsága sehol nem
       torzul, és nincs szükség nyújtásra. */
    const vonalat = () => {
      const sz = szulo.clientWidth;
      const ma = szulo.scrollHeight;
      if (!sz || !ma) return;
      const svg = svgDoboz.current;
      svg.setAttribute('viewBox', `0 0 ${sz} ${ma}`);
      svg.style.height = `${ma}px`;

      /* A védjegy MÖGÖTT indul — nem alatta —, és a lap aljáig tart. A
         kanyarok száma a magassággal nő, hogy a hullám mindig hasonló
         hosszú legyen. */
      const indul = Math.min(ma * 0.02, 92);
      const fut = ma - indul - 40;
      const kanyar = Math.max(4, Math.round(fut / 620));
      /* Keskeny lapon szűkebb a kilengés: ne feküdjön rá a szövegre. */
      const kileng = Math.min(sz * 0.3, 210);
      const kozep = sz / 2;

      let d = `M${(kozep - kileng * 0.45).toFixed(1)} ${indul.toFixed(1)}`;
      for (let i = 1; i <= kanyar; i += 1) {
        const y0 = indul + (fut * (i - 1)) / kanyar;
        const y1 = indul + (fut * i) / kanyar;
        const x0 = kozep + kileng * (i % 2 === 1 ? -0.45 : 0.45);
        const x1 = kozep + kileng * (i % 2 === 1 ? 0.45 : -0.45);
        const kx = kileng * 1.15;
        d += ` C${(x0 + (i % 2 === 1 ? kx : -kx)).toFixed(1)} ${(y0 + (y1 - y0) * 0.34).toFixed(1)},`
          + `${(x1 + (i % 2 === 1 ? kx : -kx)).toFixed(1)} ${(y0 + (y1 - y0) * 0.66).toFixed(1)},`
          + `${x1.toFixed(1)} ${y1.toFixed(1)}`;
      }
      /* Két vonal ugyanazon a pályán: a halvány teljes nyom megmutatja,
         merre tart az ösvény, a másik pedig rajzolódik rá. */
      nyom.current.setAttribute('d', d);
      vonal.current.setAttribute('d', d);
      elem.style.setProperty('--ut-hossz', vonal.current.getTotalLength());
    };

    vonalat();
    const meret = new ResizeObserver(vonalat);
    meret.observe(szulo);

    if (keves) {
      elem.style.setProperty('--halad', '1');
      elem.style.setProperty('--gorgetes', '0px');
      return () => meret.disconnect();
    }

    /* ---- A görgetés állása ----
       Két szám képkockánként: hol tartunk a lapon (0–1), és hány
       képpontot görgettünk (ebből jön a parallaxis). A többit a CSS
       számolja. */
    let keret = 0;
    const szamol = () => {
      keret = 0;
      const y = window.scrollY;
      const futas = szulo.scrollHeight - window.innerHeight;
      elem.style.setProperty('--gorgetes', `${y}px`);
      elem.style.setProperty('--halad', futas <= 0 ? '1' : Math.min(1, Math.max(0, y / futas)).toFixed(4));
    };
    const figyel = () => { if (!keret) keret = requestAnimationFrame(szamol); };

    szamol();
    window.addEventListener('scroll', figyel, { passive: true });
    window.addEventListener('resize', figyel);
    return () => {
      meret.disconnect();
      cancelAnimationFrame(keret);
      window.removeEventListener('scroll', figyel);
      window.removeEventListener('resize', figyel);
    };
  }, []);

  return (
    <div className="erdo" ref={doboz} aria-hidden="true">
      {erdo.map((reteg, i) => (
        <div
          key={reteg.mag}
          className="erdo__reteg"
          style={{ '--melyseg': reteg.faktor, '--halvany': reteg.halvany, '--vastag': reteg.vastag }}
        >
          {reteg.fak.map((fa) => (
            <svg
              key={fa.kulcs}
              className="erdo__fa"
              viewBox={`0 0 ${fa.alak.w} ${fa.alak.h}`}
              style={{
                left: `${(fa.bal * 100).toFixed(2)}%`,
                top: `${(fa.teto * 100).toFixed(2)}%`,
                width: `${(fa.alak.w * fa.meret).toFixed(0)}px`,
                '--tukor': fa.tukor ? -1 : 1,
                '--sor': i,
              }}
            >
              {fa.alak.d.map((d) => <path key={d} d={d} />)}
            </svg>
          ))}
        </div>
      ))}

      {/* Az ösvény: a védjegy mögött indul, és a lap aljáig tart. */}
      <svg className="erdo__ut" ref={svgDoboz} preserveAspectRatio="none">
        <path className="erdo__ut-nyom" ref={nyom} />
        <path className="erdo__ut-vonal" ref={vonal} />
      </svg>
    </div>
  );
}
