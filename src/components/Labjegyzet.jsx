/* Lábjegyzet. Az impresszum — benne a felelősséggel és az adatkezeléssel —
   itt van, apró betűvel, nem menüpontként: nem ott keresik. */

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
        <a href="/impresszum">Impresszum és adatkezelés</a>
      </p>
    </footer>
  );
}
