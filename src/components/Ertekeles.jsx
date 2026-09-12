import Csillagok from './Csillagok.jsx';
import { RESZ_NEVEK } from '../data/ertekelesek.js';

/* Az „szerintünk” doboz az útvonal oldalán.

   Külön ki van írva, hogy ez a szerkesztőség véleménye, nem mások
   értékeléseinek átlaga — a kettő nem ugyanaz, és a látogatónak joga van
   tudni, melyiket olvassa. */

export default function Ertekeles({ ertekeles }) {
  if (!ertekeles) return null;
  const { csillag, verdikt, reszek, mellette, ellene } = ertekeles;

  return (
    <section className="ertekeles">
      <header className="ertekeles__fej">
        <div>
          <p className="ertekeles__kalap">Szerintünk</p>
          <Csillagok ertek={csillag} meret={24} />
        </div>
        <span className="ertekeles__szam">
          {csillag}<span>/5</span>
        </span>
      </header>

      <p className="ertekeles__verdikt">{verdikt}</p>

      <dl className="reszpontok">
        {Object.entries(reszek).map(([kulcs, ertek]) => (
          <div className="reszpont" key={kulcs}>
            <dt>{RESZ_NEVEK[kulcs] ?? kulcs}</dt>
            <dd>
              <span className="reszpont__sav" aria-hidden="true">
                <span className="reszpont__kitolt" style={{ width: `${(ertek / 5) * 100}%` }} />
              </span>
              <Csillagok ertek={ertek} meret={13} cimke={`${RESZ_NEVEK[kulcs]}: ${ertek} az ötből`} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="ertekeles__lista">
        <div>
          <h3 className="ertekeles__alcim ertekeles__alcim--mellette">Ami mellette szól</h3>
          <ul>
            {mellette.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="ertekeles__alcim ertekeles__alcim--ellene">Amire számíts</h3>
          <ul>
            {ellene.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="apro">
        A mi véleményünk, nem mások értékeléseinek átlaga.
      </p>
    </section>
  );
}
