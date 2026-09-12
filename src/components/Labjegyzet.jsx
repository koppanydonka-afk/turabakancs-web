/* Lábjegyzet. Az adatkezelésre mutató link itt van, apró betűvel —
   nem menüpontként, mert nem ott keresik. */

export default function Labjegyzet({ tomor = false }) {
  return (
    <footer className={`labjegyzet${tomor ? ' labjegyzet--tomor' : ''}`}>
      {!tomor && (
        <p>
          A térképet az <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{' '}
          közreműködői készítik, és ők is adják hozzá a csempéket.
        </p>
      )}
      <p className="apro">
        A távolság és a menetidő becslés — a terepen a jelzett turistautak a mérvadók.{' '}
        <a href="/impresszum">Impresszum</a> · <a href="/rolad">Adatkezelés</a>
      </p>
    </footer>
  );
}
