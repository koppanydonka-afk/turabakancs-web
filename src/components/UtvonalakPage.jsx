import { peldaUtvonalak } from '../data/peldak.js';
import { hossz, ido, kmSzoveg, tervLinkje } from '../data/utvonalak.js';
import { tipusSzerint } from '../data/jelolesek.js';
import Csillagok from './Csillagok.jsx';
import { ertekelesSzerint } from '../data/ertekelesek.js';

/* Példák. Böngészhető lista — ez adja az oldalnak azt a szöveges tartalmat
   is, amiből a kereső megérti, miről szól a hely. */

export default function UtvonalakPage() {
  return (
    <section className="oldal">
      <header className="oldal__fej">
        <p className="kalap">Példák</p>
        <h1 className="oldal__cim">Nyolc vonal, amiből kiindulhatsz.</h1>
        <p className="oldal__bevezeto">
          Nyisd meg bármelyiket, húzd arrébb a pontjait, tegyél rá saját jelöléseket —
          és már a tiéd. Semmit nem kell hozzá regisztrálni.
        </p>
      </header>

      <div className="kartyak">
        {peldaUtvonalak.map((p) => {
          const km = hossz(p.pontok);
          const ertekeles = ertekelesSzerint(p.id);
          return (
            <article className="kartya" key={p.id}>
              <h2 className="kartya__cim">
                <a href={`/utvonalak/${p.id}`}>{p.nev}</a>
              </h2>
              <p className="kartya__hol">{p.hol}</p>
              {ertekeles && (
                <p className="kartya__csillag">
                  <Csillagok ertek={ertekeles.csillag} meret={15} />
                  <span>szerintünk</span>
                </p>
              )}
              <p className="kartya__jegyzet">{p.jegyzet}</p>

              <ul className="cimkek">
                <li>{kmSzoveg(km)}</li>
                <li>{ido(km)} gyalog</li>
                {p.jelolesek.slice(0, 2).map((j) => (
                  <li key={`${j.lat}-${j.lng}`} style={{ '--tu-szin': tipusSzerint(j.tipus).szin }}>
                    <span className="cimkek__pont" />
                    {j.cimke}
                  </li>
                ))}
              </ul>

              <div className="kartya__gombok">
                <a className="gomb gomb--halk" href={`/utvonalak/${p.id}`}>
                  Megnézem
                </a>
                <a className="gomb gomb--fo" href={tervLinkje('/tervezo', p)}>
                  Megnyitás a tervezőben
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <p className="figyelmeztetes">
        <strong>Ezek hozzávetőleges vonalvezetések, nem felmért turistautak.</strong> Arra
        valók, hogy legyen mit megnyitni és továbbrajzolni. A terepen a jelzett
        turistautak és a hivatalos térképek a mérvadók.
      </p>
    </section>
  );
}
