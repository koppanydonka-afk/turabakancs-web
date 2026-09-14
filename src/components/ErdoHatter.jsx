import { useEffect, useRef } from 'react';

/* Erdei háttér az egész oldal mögött, és egy ösvény, ami perspektívában
   fut középen.

   A KÉP a látogatóé: egy festett erdei ösvény, 387×516 képponton. Teljes
   képernyőre ez négy-hatszoros nagyítás, ami önmagában mosott volna —
   ezért a kezelés NEM harcol a lágysággal, hanem ráerősít: sötétítő
   fátyol, a két szélen elmosás, és a felső harmadban a fénybe olvadó
   köd. Így a lágyság szándékos hangulat lesz, nem hiba.

   HÁROM DIMENZIÓ: a háttér a képernyőhöz van rögzítve, tehát a festett
   ösvény mindig ugyanott fut. A rárajzolt vonal ezt követi — fent, az
   enyészpontnál vékony, lent, a nézőnél széles. Ahogy görgetsz, a vonal
   a távolból közeledik: nem oldalra halad, hanem FELÉD.

   Az egész réteg a tartalom mögött ül, és egéreseményt nem fog el. */

/* Az enyészpont a kép felső harmadában van; a vonal onnan indul. */
const ENYESZ = 0.4;

export default function ErdoHatter() {
  const doboz = useRef(null);

  useEffect(() => {
    const elem = doboz.current;
    if (!elem) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elem.style.setProperty('--halad', '1');
      return undefined;
    }

    /* Egyetlen szám képkockánként: hol tartunk a lapon. A vonal hosszát
       és a köd sűrűségét a CSS számolja belőle. */
    let keret = 0;
    const szamol = () => {
      keret = 0;
      const futas = document.documentElement.scrollHeight - window.innerHeight;
      const halad = futas <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / futas));
      elem.style.setProperty('--halad', halad.toFixed(4));
    };
    const figyel = () => { if (!keret) keret = requestAnimationFrame(szamol); };

    szamol();
    window.addEventListener('scroll', figyel, { passive: true });
    window.addEventListener('resize', figyel);
    return () => {
      cancelAnimationFrame(keret);
      window.removeEventListener('scroll', figyel);
      window.removeEventListener('resize', figyel);
    };
  }, []);

  return (
    <div className="erdo-szin" ref={doboz} aria-hidden="true">
      <div className="erdo-szin__kep" />
      {/* Sötétítő fátyol: a kép önmagában túl világos ahhoz, hogy szöveg
          álljon rajta. Sötét módban erősebb. */}
      <div className="erdo-szin__fatyol" />

      {/* A két szélen elmosás: ott ülnek a kártyák, és így a betű nem a
          lombok közé vész. A közép éles marad — az az ösvény. */}
      <div className="erdo-szin__oldal erdo-szin__oldal--bal" />
      <div className="erdo-szin__oldal erdo-szin__oldal--jobb" />

      {/* Az ösvény vonala perspektívában: fent tű, lent tenyérnyi.
          Ahogy görgetsz, a távolból közeledik. */}
      <svg className="erdo-szin__ut" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="osvenyHalvany" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--nyom)" stopOpacity="0" />
            <stop offset="0.25" stopColor="var(--nyom)" stopOpacity=".55" />
            <stop offset="1" stopColor="var(--nyom)" stopOpacity=".92" />
          </linearGradient>
        </defs>
        <path
          className="erdo-szin__ut-alak"
          d={`M50 ${ENYESZ * 100} C49.4 ${ENYESZ * 100 + 22} 47 ${ENYESZ * 100 + 42} 41 100 `
            + `L59 100 C53 ${ENYESZ * 100 + 42} 50.6 ${ENYESZ * 100 + 22} 50 ${ENYESZ * 100} Z`}
          fill="url(#osvenyHalvany)"
        />
      </svg>
    </div>
  );
}
