import Csillagok from './Csillagok.jsx';
import { autosBecsles, percSzoveg } from '../data/kozeli.js';
import { kmSzoveg } from '../data/utvonalak.js';

/* A kiindulóponthoz legközelebbi kész túrák.

   Gyakran ez a valódi kérdés — nem az, hogy A-ból B-be, hanem hogy
   „mi van a közelben”. Az „Útvonalak” fülön jelenik meg, amint a
   tervező tud egy kiindulópontot. */

export default function KozeliTurak({ lista, onBetolt }) {
  if (!lista?.length) return null;

  return (
    <div className="lista">
      <h2 className="lista__cim">A legközelebbi túrák</h2>
      <div className="kozeli">
        {lista.map((k) => {
          const autos = autosBecsles(k.legvonal);
          return (
            <div className="kozeli__elem" key={k.utvonal.id}>
              <button className="kozeli__nev" onClick={() => onBetolt(k.utvonal)}>
                {k.utvonal.nev}
                <span>
                  {k.legvonal < 1 ? 'itt van' : `${Math.round(k.legvonal)} km-re`}
                  {' · '}~{percSzoveg(autos.perc)} autóval
                </span>
                <span>
                  {kmSzoveg(k.km)} · {k.nehezseg}
                </span>
              </button>
              {k.ertekeles && (
                <span className="kozeli__csillag">
                  <Csillagok ertek={k.ertekeles.csillag} meret={12} />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="apro">Légvonalban mérve; az autós idő durva becslés.</p>
    </div>
  );
}
