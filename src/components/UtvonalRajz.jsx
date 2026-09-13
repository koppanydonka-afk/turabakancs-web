/* Egy útvonal rajza — térkép nélkül.

   MIÉRT NEM TÉRKÉP: a főoldalnak gyorsan kell betöltenie, a térkép
   könyvtára pedig kétszáz kilobájt, és WebGL kell hozzá. Ez a rajz a példa VALÓDI pontjaiból készül, ugyanabból az
   adatból, amiből a tervező dolgozik — tehát nem illusztráció, hanem az,
   ami tényleg kijön. Néhány száz bájt, és nincs hozzá idegen kérés.

   A vetítés egyszerű: a hosszúságot a szélességi kör koszinuszával
   szorozzuk, különben a Kárpát-medencében minden vonal negyven százalékkal
   szélesebbnek látszana, mint amilyen. */

const SZELES = 320;
const KERET = 14;

/* A doboz magassága az ÚTVONAL arányait követi, nem fordítva. Fix 320×200
   mellett egy hosszú, keskeny túra egy vékony vonalka lett a doboz
   közepén. A korlát azért kell, mert a Kéktúra egy szakasza önmagában
   olyan lapos, hogy néhány képpont magas sávvá fogyna. */
const ARANY_MIN = 0.45;
const ARANY_MAX = 1.1;

export default function UtvonalRajz({ pontok, cimke = '' }) {
  if (!pontok || pontum(pontok) < 2) return null;

  const kozepLat = pontok.reduce((o, p) => o + p[0], 0) / pontok.length;
  const nyujt = Math.cos((kozepLat * Math.PI) / 180);

  const xs = pontok.map((p) => p[1] * nyujt);
  const ys = pontok.map((p) => -p[0]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const szelesseg = x1 - x0 || 1e-9;
  const magassag = y1 - y0 || 1e-9;

  const belsoSz = SZELES - 2 * KERET;
  const magas = SZELES * Math.min(ARANY_MAX, Math.max(ARANY_MIN, magassag / szelesseg));
  const belsoMa = magas - 2 * KERET;

  /* Egyetlen arány mindkét tengelyre, hogy a vonal alakja ne torzuljon. */
  const arany = Math.min(belsoSz / szelesseg, belsoMa / magassag);
  const eltolX = KERET + (belsoSz - szelesseg * arany) / 2;
  const eltolY = KERET + (belsoMa - magassag * arany) / 2;

  const helyre = (i) => [
    (xs[i] - x0) * arany + eltolX,
    (ys[i] - y0) * arany + eltolY,
  ];

  const d = pontok
    .map((_, i) => `${i === 0 ? 'M' : 'L'}${helyre(i).map((n) => n.toFixed(1)).join(' ')}`)
    .join('');

  const rajt = helyre(0);
  const cel = helyre(pontok.length - 1);

  return (
    <svg
      className="ut-rajz"
      viewBox={`0 0 ${SZELES} ${magas.toFixed(1)}`}
      role={cimke ? 'img' : 'presentation'}
      aria-label={cimke || undefined}
      aria-hidden={cimke ? undefined : 'true'}
    >
      {/* A vonal alá egy halvány másolat: így a világos háttéren is látszik
          a nyomvonal, nem olvad bele. */}
      <path className="ut-rajz__arnyek" d={d} />
      <path className="ut-rajz__vonal" d={d} />
      <circle className="ut-rajz__rajt" cx={rajt[0]} cy={rajt[1]} r="5" />
      <circle className="ut-rajz__cel" cx={cel[0]} cy={cel[1]} r="5" />
    </svg>
  );
}

const pontum = (p) => (Array.isArray(p) ? p.length : 0);
