import { useEffect, useRef } from 'react';
import { KEP_MAGAS, KEP_SZELES, KEZDET, UT } from '../data/erdoUt.js';

/* Erdei háttér: egy madártávlati fotó kanyargó erdei úttal, és egy vonal,
   ami GÖRGETÉSRE VÉGIGHALAD EZEN AZ ÚTON.

   A lényeg, hogy a vonal ne a kép mellett fusson, hanem rajta: ugyanazt az
   utat járja, amit a fotó mutat. Ezért a fotó és a rajz KÖZÖS vásznon ül,
   a kép saját koordinátáiban (2000×1125) — nem háttérképként, mert annak a
   kivágását egy különálló rajz nem tudná lekövetni.

   A KÍSÉRŐ. A vászon „cover” méretű: ami nem fér a képernyőre, az kilóg.
   Széles képernyőn ez pár tíz képpont, keskenyen viszont a kép háromnegyede
   — ott a vonal feje simán kimenne a képből. Ezért a vászon a fej után
   csúszik: a kivágat mindig ott jár, ahol a vonal tart. Széles lapon ez
   alig észrevehető sodródás, keskenyen valódi kísérés — mintha a kamera
   az úton haladóval menne.

   Az egész réteg a tartalom mögött ül, és egéreseményt nem fog el. */

/* Görgetés nélkül is látszódjon, hogy van vonal: ennyivel indul. */
const ELONY = 0.045;

export default function ErdoHatter() {
  const doboz = useRef(null);
  const kepVaszon = useRef(null);
  const utVaszon = useRef(null);
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
    /* A két vászon mérete azonos; egyszer kiolvasva nem kell képkockánként
       elrendezést kérni a böngészőtől. */
    let meret = { w: 0, h: 0, vw: 0, vh: 0 };
    const merj = () => {
      meret = {
        w: utVaszon.current?.offsetWidth ?? 0,
        h: utVaszon.current?.offsetHeight ?? 0,
        vw: elem.clientWidth,
        vh: elem.clientHeight,
      };
    };

    const kisero = (halad) => {
      const p = ut.getPointAtLength(hossz * halad);
      const { w, h, vw, vh } = meret;
      const csuszX = Math.max(0, w - vw);
      const csuszY = Math.max(0, h - vh);
      /* A fej a képernyő közepére kívánkozik, de a kép széleinél megáll:
         üres sáv nem kerülhet a kép mellé. */
      const x = Math.min(Math.max((p.x / KEP_SZELES) * w - vw / 2, 0), csuszX) - csuszX / 2;
      const y = Math.min(Math.max((p.y / KEP_MAGAS) * h - vh / 2, 0), csuszY) - csuszY / 2;
      const hova = `translate(-50%, -50%) translate3d(${-x.toFixed(1)}px, ${-y.toFixed(1)}px, 0)`;
      if (kepVaszon.current) kepVaszon.current.style.transform = hova;
      if (utVaszon.current) utVaszon.current.style.transform = hova;
      if (jaro.current) jaro.current.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* Csökkentett mozgásnál nincs utazás: az út kirajzolva áll. */
      elem.style.setProperty('--halad', '1');
      merj();
      kisero(1);
      return undefined;
    }

    /* Egyetlen szám képkockánként: hol tartunk a lapon. A vonal hosszát
       ebből a CSS számolja, a kivágat helyét a kísérő. */
    let keret = 0;
    const szamol = () => {
      keret = 0;
      const futas = document.documentElement.scrollHeight - window.innerHeight;
      const arany = futas <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / futas));
      const halad = Math.min(1, ELONY + (1 - ELONY) * arany);
      elem.style.setProperty('--halad', halad.toFixed(4));
      kisero(halad);
    };
    const figyel = () => { if (!keret) keret = requestAnimationFrame(szamol); };
    const atmeret = () => { merj(); figyel(); };

    merj();
    szamol();
    window.addEventListener('scroll', figyel, { passive: true });
    window.addEventListener('resize', atmeret);
    return () => {
      cancelAnimationFrame(keret);
      window.removeEventListener('scroll', figyel);
      window.removeEventListener('resize', atmeret);
    };
  }, []);

  return (
    <div className="erdo-szin" ref={doboz} aria-hidden="true">
      <div className="erdo-szin__vaszon" ref={kepVaszon}>
        {/* Sima JPEG, 1400 képponton. Készült AVIF is (feleennyi bájt), de
            a `sips` kódolója olyat ad, amit a böngésző BETÖLT — a mérete
            megvan —, kifesteni viszont nem festi ki: kimérve a kép helyén a
            lap alapszíne maradt. Nem éri meg utánamenni. */}
        <img className="erdo-szin__kep" src="/erdo.jpg" alt="" width={KEP_SZELES} height={KEP_MAGAS} />
      </div>

      {/* Fátyol: a képernyőhöz rögzítve, nem a képhez — az olvashatóság a
          képernyőn múlik, nem azon, hol jár a kivágat. */}
      <div className="erdo-szin__fatyol" />

      <div className="erdo-szin__vaszon" ref={utVaszon}>
        <svg className="erdo-szin__ut" viewBox={`0 0 ${KEP_SZELES} ${KEP_MAGAS}`} preserveAspectRatio="none">
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
            <circle className="erdo-szin__fej-udvar" r="26" />
            <circle className="erdo-szin__fej-talp" r="11" />
            <circle className="erdo-szin__fej-mag" r="6" />
          </g>
        </svg>
      </div>

      {/* A két szélen elmosás: ott ülnek a kártyák, és így a betű nem a
          lombok közé vész. A közép éles marad — az az út. */}
      <div className="erdo-szin__oldal erdo-szin__oldal--bal" />
      <div className="erdo-szin__oldal erdo-szin__oldal--jobb" />
    </div>
  );
}
