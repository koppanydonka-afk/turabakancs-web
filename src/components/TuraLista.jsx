import { useState } from 'react';
import { kozeliUtak, ritkit, utVonala } from '../data/turautak.js';
import { hossz, kmSzoveg } from '../data/utvonalak.js';

/* Jelzett turistautak a képernyőn látható területen.

   Ez a „népszerű útvonalak” tisztességes változata. Azt nem tudjuk
   megmondani, ki merre jár — ahhoz figyelnünk kellene a látogatókat.
   Azt viszont igen, hol vannak a valóban kijelölt, festett jelzésű utak. */

export default function TuraLista({ terkep, onBetolt }) {
  const [utak, setUtak] = useState(null);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);
  const [toltId, setToltId] = useState(null);

  const keres = async () => {
    if (!terkep) return;
    setFut(true);
    setHiba(null);
    try {
      const h = terkep.getBounds();
      setUtak(
        await kozeliUtak({
          del: h.getSouth().toFixed(4),
          nyugat: h.getWest().toFixed(4),
          eszak: h.getNorth().toFixed(4),
          kelet: h.getEast().toFixed(4),
        }),
      );
    } catch (e) {
      setHiba(e.message);
      setUtak(null);
    } finally {
      setFut(false);
    }
  };

  const betolt = async (ut) => {
    setToltId(ut.id);
    setHiba(null);
    try {
      const nyers = await utVonala(ut.id);
      const pontok = ritkit(nyers);
      onBetolt({
        nev: ut.nev,
        pontok,
        eredetiPontok: nyers.length,
        eredetiHossz: hossz(nyers),
      });
    } catch (e) {
      setHiba(e.message);
    } finally {
      setToltId(null);
    }
  };

  return (
    <div className="turak">
      <p className="apro">
        Megmutatom, milyen <strong>jelzett turistaút</strong> fut ott, ahol épp a
        térkép áll. Bármelyiket betöltheted és továbbrajzolhatod.
      </p>

      <button
        className="gomb gomb--fo gomb--szeles"
        onClick={keres}
        disabled={fut}
        aria-busy={fut}
      >
        {fut ? 'Keresem…' : 'Utak keresése ezen a területen'}
      </button>

      {hiba && <p className="uzenet">{hiba}</p>}

      {utak && utak.length === 0 && (
        <p className="apro">
          Itt nem találtam jelzett utat. Húzd a térképet egy hegyvidékre, és
          próbáld újra — a Pilisben, a Bükkben vagy a Balaton-felvidéken sok van.
        </p>
      )}

      {utak && utak.length > 0 && (
        <>
          <p className="apro">{utak.length} út ezen a területen:</p>
          <div className="turak__lista">
            {utak.map((ut) => (
              <button
                key={ut.id}
                className="turak__elem"
                onClick={() => betolt(ut)}
                disabled={toltId !== null}
              >
                <span
                  className="turak__jelzes"
                  style={{ '--jel-szin': ut.jelzes?.szin ?? 'var(--muted)' }}
                  aria-hidden="true"
                />
                <span className="turak__nev">
                  {ut.nev}
                  <span>
                    {[ut.jelzes?.nev, ut.tavsag].filter(Boolean).join(' · ') || 'jelzett út'}
                  </span>
                </span>
                {toltId === ut.id && <span className="turak__tolt">töltöm…</span>}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="apro">A terepen a festett jelzés a mérvadó.</p>
    </div>
  );
}
