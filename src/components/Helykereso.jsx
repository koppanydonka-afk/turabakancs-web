import { useState } from 'react';

/* Helykereső.

   Ez az egyetlen pont, ahol adat hagyja el a böngésződet: a beírt helynevet
   az OpenStreetMap nyilvános keresője (Nominatim) válaszolja meg. Ezt az
   oldalon ki is írjuk. Csak gombnyomásra kérdez — gépelés közben nem —,
   így a Nominatim használati feltételeit sem terheljük.

   Cserébe nem kell API-kulcs, számlázási fiók és havi keret. */

const VEGPONT = 'https://nominatim.openstreetmap.org/search';

export default function Helykereso({ onTalalat }) {
  const [szo, setSzo] = useState('');
  const [talalatok, setTalalatok] = useState(null);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);

  const keres = async (event) => {
    event.preventDefault();
    const q = szo.trim();
    if (q.length < 3) return;

    setFut(true);
    setHiba(null);
    try {
      const url = `${VEGPONT}?format=jsonv2&limit=5&accept-language=hu&q=${encodeURIComponent(q)}`;
      const valasz = await fetch(url);
      if (!valasz.ok) throw new Error('nem sikerült');
      const adat = await valasz.json();
      setTalalatok(
        adat.map((t) => ({
          nev: t.display_name,
          lat: Number(t.lat),
          lng: Number(t.lon),
        })),
      );
    } catch {
      setHiba('A kereső most nem válaszol. A térképet kézzel is odahúzhatod.');
      setTalalatok(null);
    } finally {
      setFut(false);
    }
  };

  return (
    <div className="kereso">
      <form className="kereso__sor" onSubmit={keres} role="search">
        <input
          type="search"
          value={szo}
          onChange={(e) => setSzo(e.target.value)}
          placeholder="Hely neve — például Dobogókő"
          aria-label="Hely keresése"
        />
        <button className="gomb gomb--halk" type="submit" disabled={fut || szo.trim().length < 3}>
          {fut ? 'Keresek…' : 'Keresés'}
        </button>
      </form>

      {hiba && <p className="uzenet">{hiba}</p>}

      {talalatok && talalatok.length === 0 && <p className="apro">Erre nem találtam helyet.</p>}

      {talalatok && talalatok.length > 0 && (
        <ul className="kereso__lista">
          {talalatok.map((t) => (
            <li key={`${t.lat}-${t.lng}`}>
              <button
                onClick={() => {
                  onTalalat(t);
                  setTalalatok(null);
                }}
              >
                {t.nev}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="apro">
        A keresés a beírt helynevet az OpenStreetMap nyilvános keresőjének küldi el.
        Rajta kívül semmi nem hagyja el a böngésződet.
      </p>
    </div>
  );
}
