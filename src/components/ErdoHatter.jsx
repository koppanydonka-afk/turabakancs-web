import { useEffect, useRef } from 'react';
import { KEP_MAGAS, KEP_SZELES, KEZDET, UT } from '../data/erdoUt.js';
import { halad as haladAranybol } from '../osveny.js';

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

   MI KERÜL KÉPKOCKÁNKÉNT PÉNZBE. Görgetéskor összesen három vászon
   vetemítését írjuk át (`transform`) és egy számot (`--halad`). Se
   elrendezést nem kérünk a böngészőtől, se szűrőt nem futtatunk újra:
   ami elmosott, az egyszer készül el, és utána már csak tolódik. A lapok
   alól ezért tűnt el a `backdrop-filter` is — az mozgó háttér fölött
   minden képkockán újraszámolt volna.

   Az egész réteg a tartalom mögött ül, és egéreseményt nem fog el. */

export default function ErdoHatter() {
  const doboz = useRef(null);
  const vaszonok = useRef([]);
  const vonal = useRef(null);
  const jaro = useRef(null);

  /* Három réteg mozog együtt: az éles kép, a széleken látszó elmosott
     másolata, és a rajz. Egy tömbben tartom őket, hogy a kísérő egyetlen
     körrel végezzen. */
  const vaszonra = (i) => (elem) => { vaszonok.current[i] = elem; };

  useEffect(() => {
    const elem = doboz.current;
    const ut = vonal.current;
    if (!elem || !ut) return undefined;

    /* A hosszt a `pathLength` NÉLKÜLI útról kérem: a szabvány szerint a
       `getTotalLength()` a megadott hosszt is visszaadhatná, és akkor a
       fej rossz helyre kerülne. */
    const hossz = ut.getTotalLength();

    /* Amit elég ritkán kiszámolni, azt ne képkockánként kérjük. A
       `scrollHeight` és az `offsetWidth` OLVASÁSA elrendezést kényszerít a
       böngészőre — görgetés közben ez pont az, amitől akad. */
    let meret = { w: 0, h: 0, vw: 0, vh: 0, futas: 0 };
    const merj = () => {
      /* Az elsőt, ami tényleg látszik: keskeny lapon az éles réteg
         kimarad, mert a lágy másolat úgyis eltakarná. */
      const v = vaszonok.current.find((x) => x && x.offsetWidth);
      meret = {
        w: v?.offsetWidth ?? 0,
        h: v?.offsetHeight ?? 0,
        vw: elem.clientWidth,
        vh: elem.clientHeight,
        futas: document.documentElement.scrollHeight - window.innerHeight,
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
      for (const v of vaszonok.current) if (v) v.style.transform = hova;
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
      const arany = meret.futas <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / meret.futas));
      /* Ugyanazt a képletet használja a lap elrendezése is, hogy tudja,
         hol jár a vonal — ezért közös (`osveny.js`). */
      const halad = haladAranybol(arany);
      elem.style.setProperty('--halad', halad.toFixed(4));
      kisero(halad);
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
      <div className="erdo-szin__vaszon erdo-szin__vaszon--eles" ref={vaszonra(0)}>
        {/* Sima JPEG, 1400 képponton. Készült AVIF is (feleennyi bájt), de
            a `sips` kódolója olyat ad, amit a böngésző BETÖLT — a mérete
            megvan —, kifesteni viszont nem festi ki: kimérve a kép helyén a
            lap alapszíne maradt. Nem éri meg utánamenni. */}
        <img className="erdo-szin__kep" src="/erdo.jpg" alt="" width={KEP_SZELES} height={KEP_MAGAS} />
      </div>

      {/* A két szél lágyítása: ugyanaz a kép, elmosva, és csak a széleken
          látszik. A maszk a burkolaton ül, mert a KÉPERNYŐHÖZ tartozik —
          a kivágat alatta elcsúszhat. Ugyanez a kép, tehát nem tölt le
          semmi újat. */}
      <div className="erdo-szin__oldalak">
        <div className="erdo-szin__vaszon" ref={vaszonra(1)}>
          <img className="erdo-szin__kep erdo-szin__kep--lagy" src="/erdo.jpg" alt="" width={KEP_SZELES} height={KEP_MAGAS} />
        </div>
      </div>

      {/* Fátyol: a képernyőhöz rögzítve, nem a képhez — az olvashatóság a
          képernyőn múlik, nem azon, hol jár a kivágat. */}
      <div className="erdo-szin__fatyol" />

      <div className="erdo-szin__vaszon" ref={vaszonra(2)}>
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
