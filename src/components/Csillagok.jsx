/* Csillagsor. Fél csillagot nem használunk: az ötfokú skála pont attól
   érthető, hogy egész lépésekben mozog. */

export default function Csillagok({ ertek, max = 5, meret = 18, cimke }) {
  const szoveg = cimke ?? `${ertek} csillag az ötből`;

  return (
    <span className="csillagok" role="img" aria-label={szoveg} style={{ '--cs-meret': `${meret}px` }}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`csillag${i < ertek ? ' csillag--tele' : ''}`}
          aria-hidden="true"
        >
          <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />
        </svg>
      ))}
    </span>
  );
}
