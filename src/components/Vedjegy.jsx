/* A szóvédjegy: „Túraba[bakancs]ancs”.

   Szövegből és egy rajzból áll, nem képfájlból — így minden méretben éles
   marad, sötét módban magától fehérre vált, és pár száz bájt az egész.
   Ha a saját PNG-det akarod használni, tedd a public/ mappába, és
   átkötöm rá. */

export default function Vedjegy({ magassag = 28 }) {
  return (
    <span className="vedjegy__lockup" style={{ '--vj-magassag': `${magassag}px` }}>
      <span className="vedjegy__betuk">Túraba</span>
      <svg
        className="vedjegy__bakancs"
        viewBox="0 0 88 106"
        role="img"
        aria-label="k"
      >
        {/* Szár és lábfej egy alakzatban. A szár végig széles marad — keskeny
            szárral a forma „L” betűnek olvasódik, nem bakancsnak. */}
        <path
          className="vedjegy__bor"
          d="M14 0h28v10h8v56h16c9 0 14 6 14 15v11H14z"
        />
        {/* Talp: a teljes talpfelület alatt végigfut, kicsit túlnyúlva. */}
        <rect className="vedjegy__talp" x="8" y="92" width="76" height="14" rx="3" />
      </svg>
      <span className="vedjegy__betuk">ancs</span>
    </span>
  );
}
