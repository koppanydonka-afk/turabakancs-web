import { useEffect, useRef } from 'react';
import { KEP_MAGAS, KEP_SZELES, KEZDET, UT } from '../data/erdoUt.js';
import { halad as haladAranybol } from '../osveny.js';

/* Erdei háttér: egy madártávlati fotó kanyargó erdei úttal, és egy vonal,
   ami GÖRGETÉSRE VÉGIGHALAD EZEN AZ ÚTON.

   A lényeg, hogy a vonal ne a kép mellett fusson, hanem rajta: ugyanazt az
   utat járja, amit a fotó mutat. Ezért a fotó és a rajz KÖZÖS vásznon ül,
   a kép saját koordinátáiban (2000×1125) — nem háttérképként, mert annak a
   kivágását egy különálló rajz nem tudná lekövetni.

   A KÉP ÁLL. Egy korábbi változatban a vászon a vonal feje után csúszott,
   hogy keskeny képernyőn se menjen ki a fej a képből. Kimérve jó ötlet
   volt, nézve viszont nem: görgetés közben az egész háttér folyamatosan
   sodródott, és ez elvonta a figyelmet arról, amiért az egész van — a
   vonaltól. Most a kivágat középen áll és nem mozdul; ami nem fér a
   képernyőre, az egyenlően lóg ki a két oldalon.

   MI KERÜL KÉPKOCKÁNKÉNT PÉNZBE. Görgetéskor egyetlen szám íródik
   (`--halad`), és abból a CSS rajzolja tovább a vonalat. Elrendezést nem
   kérünk a böngészőtől, szűrőt nem futtatunk újra: ami elmosott, az
   egyszer készül el. A lapok alól ezért tűnt el a `backdrop-filter` is.

   Az egész réteg a tartalom mögött ül, és egéreseményt nem fog el. */

export default function ErdoHatter() {
  const doboz = useRef(null);
  const vonal = useRef(null);
  const jaro = useRef(null);

  useEffect(() => {
    const elem = doboz.current;
    const ut = vonal.current;
    if (!elem || !ut) return undefined;

    /* A hosszt a `pathLength` NÉLKÜLI útról kérem: a szabvány szerint a
       `getTotalLength()` a megadott hosszt is visszaadhatná, és akkor a
       fej rossz helyre kerülne. */
    const hossz = ut.getTotalLength();

    /* A görgetési úthosszt elég ritkán kiszámolni. A `scrollHeight`
       OLVASÁSA elrendezést kényszerít a böngészőre — görgetés közben ez
       pont az, amitől akad. */
    let futas = 0;
    const merj = () => {
      futas = document.documentElement.scrollHeight - window.innerHeight;
    };

    /* Már csak a jelölőt kell a helyére tenni: a vásznak nem mozdulnak. */
    const fejet = (halad) => {
      if (!jaro.current) return;
      const p = ut.getPointAtLength(hossz * halad);
      jaro.current.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* Csökkentett mozgásnál nincs utazás: az út kirajzolva áll. */
      elem.style.setProperty('--halad', '1');
      merj();
      fejet(1);
      return undefined;
    }

    /* Egyetlen szám képkockánként: hol tartunk a lapon. A vonal hosszát
       ebből a CSS számolja, a kivágat helyét a kísérő. */
    let keret = 0;
    const szamol = () => {
      keret = 0;
      const arany = futas <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / futas));
      /* Ugyanazt a képletet használja a lap elrendezése is, hogy tudja,
         hol jár a vonal — ezért közös (`osveny.js`). */
      const halad = haladAranybol(arany);
      elem.style.setProperty('--halad', halad.toFixed(4));
      fejet(halad);
    };
    const figyel = () => { if (!keret) keret = requestAnimationFrame(szamol); };
    const ujramer = () => { merj(); figyel(); };

    merj();
    szamol();
    window.addEventListener('scroll', figyel, { passive: true });
    window.addEventListener('resize', ujramer);
    /* A lap magassága menet közben is változhat — betöltődik egy kép,
       megnyílik egy szakasz. A tárolt görgetési úthossz enélkül elavulna,
       és a vonal a lap alján sem érne célba. */
    const figyelo = 'ResizeObserver' in window ? new ResizeObserver(ujramer) : null;
    figyelo?.observe(document.body);
    return () => {
      cancelAnimationFrame(keret);
      window.removeEventListener('scroll', figyel);
      window.removeEventListener('resize', ujramer);
      figyelo?.disconnect();
    };
  }, []);

  return (
    <div className="erdo-szin" ref={doboz} aria-hidden="true">
      <div className="erdo-szin__vaszon erdo-szin__vaszon--eles">
        {/* Sima JPEG, 1400 képponton. Készült AVIF is (feleennyi bájt), de
            a `sips` kódolója olyat ad, amit a böngésző BETÖLT — a mérete
            megvan —, kifesteni viszont nem festi ki: kimérve a kép helyén a
            lap alapszíne maradt. Nem éri meg utánamenni. */}
        <img className="erdo-szin__kep" src="/erdo.jpg" alt="" width={KEP_SZELES} height={KEP_MAGAS} />
      </div>

      {/* A két szél lágyítása: ugyanaz a kép, elmosva, és csak a széleken
          látszik. A maszk a burkolaton ül, mert a KÉPERNYŐHÖZ tartozik —
          a kivágat nem a képernyő közepéhez igazodik. Ugyanez a kép,
          tehát nem tölt le semmi újat. */}
      <div className="erdo-szin__oldalak">
        <div className="erdo-szin__vaszon">
          <img className="erdo-szin__kep erdo-szin__kep--lagy" src="/erdo.jpg" alt="" width={KEP_SZELES} height={KEP_MAGAS} />
        </div>
      </div>

      {/* Fátyol: a képernyőhöz rögzítve, nem a képhez — az olvashatóság a
          képernyőn múlik, nem azon, hol jár a kivágat. */}
      <div className="erdo-szin__fatyol" />

      <div className="erdo-szin__vaszon">
        <svg className="erdo-szin__ut" viewBox={`0 0 ${KEP_SZELES} ${KEP_MAGAS}`} preserveAspectRatio="none">
          <defs>
            <radialGradient id="erdoUdvar">
              <stop offset="0" stopColor="var(--nyom)" stopOpacity=".5" />
              <stop offset="1" stopColor="var(--nyom)" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Ami még hátravan: halványan, hogy a túra íve akkor is olvasható
              legyen, amikor még alig görgettél. */}
          <path className="erdo-szin__ut-elore" d={UT} ref={vonal} />
          {/* A megtett szakasz három rétegben: fény, talp, nyom — ugyanaz a
              képi nyelv, mint a térkép megrajzolt útvonalán. */}
          <path className="erdo-szin__ut-feny" d={UT} pathLength="1" />
          <path className="erdo-szin__ut-talp" d={UT} pathLength="1" />
          <path className="erdo-szin__ut-nyom" d={UT} pathLength="1" />
          {/* A fej: ugyanaz a korong, ami a térképen a pontokat jelöli. */}
          <g className="erdo-szin__fej" ref={jaro} transform={`translate(${KEZDET[0]} ${KEZDET[1]})`}>
            <circle className="erdo-szin__fej-udvar" r="34" />
            <circle className="erdo-szin__fej-talp" r="11" />
            <circle className="erdo-szin__fej-mag" r="6" />
          </g>
        </svg>
      </div>
    </div>
  );
}
