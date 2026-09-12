import Terkep from './Terkep.jsx';
import { peldaSzerint } from '../data/peldak.js';
import { TEMPOK, hossz, ido, kmSzoveg, tervLinkje } from '../data/utvonalak.js';
import { tipusSzerint } from '../data/jelolesek.js';
import { gpxLetoltes } from '../data/gpx.js';
import Ertekeles from './Ertekeles.jsx';
import { ertekelesSzerint } from '../data/ertekelesek.js';

/* Egy példa útvonal. A térkép itt csak nézet: nincs `mod`, tehát a
   kattintás nem rajzol. Aki továbbdolgozna rajta, egy gombbal átviszi
   a tervezőbe. */

export default function UtvonalPage({ id }) {
  const p = peldaSzerint(id);

  if (!p) {
    return (
      <section className="oldal">
        <h1 className="oldal__cim">Ez az útvonal nincs meg.</h1>
        <p className="oldal__bevezeto">
          Lehet, hogy elgépelted a címet. <a href="/utvonalak">Itt a többi példa.</a>
        </p>
      </section>
    );
  }

  const km = hossz(p.pontok);
  const ertekeles = ertekelesSzerint(p.id);

  return (
    <section className="oldal">
      <header className="oldal__fej">
        <p className="kalap">{p.hol}</p>
        <h1 className="oldal__cim">{p.nev}</h1>
        <p className="oldal__bevezeto">{p.jegyzet}</p>
      </header>

      <div className="nezet">
        <div className="nezet__terkep">
          <Terkep pontok={p.pontok} jelolesek={p.jelolesek} illeszt={1} />
        </div>

        <aside className="panel">
          <div className="ertekek">
            <div className="ertekek__elem">
              <strong>{kmSzoveg(km)}</strong>
              <span>Hossz</span>
            </div>
            {TEMPOK.map((t) => (
              <div className="ertekek__elem" key={t.id}>
                <strong>{ido(km, t.id)}</strong>
                <span>{t.nev}</span>
              </div>
            ))}
          </div>
          <p className="apro">Sík terepre számolva; emelkedőn több.</p>

          <div className="gombsor">
            <a className="gomb gomb--fo" href={tervLinkje('/tervezo', p)}>
              Megnyitás a tervezőben
            </a>
            <button className="gomb gomb--halk" onClick={() => gpxLetoltes(p)}>
              GPX letöltése
            </button>
          </div>

          <div className="lista">
            <h2 className="lista__cim">Jelölések</h2>
            {p.jelolesek.map((j) => {
              const tipus = tipusSzerint(j.tipus);
              return (
                <div className="jeloles-sor jeloles-sor--nezet" key={`${j.lat}-${j.lng}-${j.cimke}`}>
                  <span className="jeloles-sor__jel" style={{ '--tu-szin': tipus.szin }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tipus.rajz }} />
                  </span>
                  <span className="jeloles-sor__nev">
                    {j.cimke}
                    <em>{tipus.nev}</em>
                  </span>
                </div>
              );
            })}
          </div>

          <a className="vissza-link" href="/utvonalak">
            ← Vissza a példákhoz
          </a>
        </aside>
      </div>

      <div data-feltun>
        <Ertekeles ertekeles={ertekeles} />
      </div>

      <p className="figyelmeztetes">
        <strong>Hozzávetőleges vonalvezetés, nem felmért turistaút.</strong> A terepen a
        jelzett turistautak és a hivatalos térképek a mérvadók.
      </p>
    </section>
  );
}
