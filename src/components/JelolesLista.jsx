import { tipusSzerint } from '../data/jelolesek.js';
import { sz } from '../nyelv/index.js';

/* A kitett jelölések listája. A címke itt kap nevet: a térképen csak
   kattintani kell, elnevezni ráérsz utólag. */

export default function JelolesLista({ jelolesek, onCimke, onTorol, onOdaugrik }) {
  if (jelolesek.length === 0) return null;

  return (
    <div className="lista">
      <h2 className="lista__cim">Jelöléseid</h2>
      {jelolesek.map((j, i) => {
        const tipus = tipusSzerint(j.tipus);
        return (
          <div className="jeloles-sor" key={`${j.lat}-${j.lng}-${i}`}>
            <button
              className="jeloles-sor__jel"
              style={{ '--tu-szin': tipus.szin }}
              onClick={() => onOdaugrik(j)}
              title={sz('jeloles.ugras', { nev: j.cimke || sz(tipus.nevKulcs) })}
              aria-label={sz('jeloles.ugras', { nev: j.cimke || sz(tipus.nevKulcs) })}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tipus.rajz }} />
            </button>
            <input
              type="text"
              value={j.cimke}
              placeholder={sz(tipus.nevKulcs)}
              onChange={(e) => onCimke(i, e.target.value)}
              aria-label={sz('jeloles.neve', { tipus: sz(tipus.nevKulcs) })}
            />
            <button className="lista__torol" onClick={() => onTorol(i)} aria-label={sz('terkep.jelolesTorol')}>
              Törlés
            </button>
          </div>
        );
      })}
    </div>
  );
}
