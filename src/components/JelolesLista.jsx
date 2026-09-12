import { tipusSzerint } from '../data/jelolesek.js';

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
              title={`Ugrás ide: ${j.cimke || tipus.nev}`}
              aria-label={`Ugrás ide: ${j.cimke || tipus.nev}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tipus.rajz }} />
            </button>
            <input
              type="text"
              value={j.cimke}
              placeholder={tipus.nev}
              onChange={(e) => onCimke(i, e.target.value)}
              aria-label={`${tipus.nev} neve`}
            />
            <button className="lista__torol" onClick={() => onTorol(i)} aria-label="Jelölés törlése">
              Törlés
            </button>
          </div>
        );
      })}
    </div>
  );
}
