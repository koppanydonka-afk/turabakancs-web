import Vedjegy from './Vedjegy.jsx';
import Csillagok from './Csillagok.jsx';
import { ertekelesSzerint } from '../data/ertekelesek.js';
import { JELZESEK, SZINEK } from '../data/erdekessegek.js';
import { peldaUtvonalak } from '../data/peldak.js';
import { hossz, ido, kmSzoveg, tervLinkje } from '../data/utvonalak.js';
import { napkelte, napnyugta, oraPerc, vilagosMeg } from '../data/naptar.js';

/* Főoldal. A tervező innen nyílik, de előbb van mit nézni:
   egy mai adat, a jelzésrendszer magyarázata, három példa, és a
   név nélküli véleményfal. */

const BUDAPEST = [47.4979, 19.0402];

const perc = (p) => (p < 60 ? `${p} perc` : `${Math.floor(p / 60)} óra ${p % 60} perc`);

export default function FooldalPage() {
  const most = new Date();
  const kelte = napkelte(most, ...BUDAPEST);
  const nyugta = napnyugta(most, ...BUDAPEST);
  const maradek = vilagosMeg(...BUDAPEST, most);

  return (
    <div className="fooldal">
      <section className="hos">
        <div className="hos__vedjegy">
          <Vedjegy magassag={54} />
        </div>
        <p className="hos__lead">
          Térkép, amire rajzolhatsz. Kész túrák, amikből kiindulhatsz.
          Menetidő, ami az emelkedővel is számol.
        </p>
        <div className="hos__gombok">
          <a className="gomb gomb--fo" href="/tervezo">Tervezek egy túrát</a>
          <a className="gomb gomb--halk" href="/utvonalak">Nézek példákat</a>
        </div>
      </section>

      {nyugta && (
        <section className="ma" data-feltun style={{ "--lepcso": 0 }}>
          <h2 className="ma__cim">Ma</h2>
          <div className="ma__adatok">
            <div className="ma__elem">
              <strong>{oraPerc(kelte)}</strong>
              <span>napkelte</span>
            </div>
            <div className="ma__elem">
              <strong>{oraPerc(nyugta)}</strong>
              <span>napnyugta</span>
            </div>
            <div className="ma__elem ma__elem--kiemelt">
              <strong>{maradek > 0 ? perc(maradek) : 'lement'}</strong>
              <span>{maradek > 0 ? 'világos van még' : 'a nap már lement'}</span>
            </div>
          </div>
          <p className="apro">Budapestre. A tervező a saját útvonalad kezdőpontjára számol.</p>
        </section>
      )}

      <section className="szekcio" data-feltun>
        <header className="szekcio__fej">
          <h2 className="szekcio__cim">Mit jelent a festék a fán?</h2>
          <p className="szekcio__lead">
            A magyar turistajelzés két dolgot mond meg egyszerre. A <strong>szín</strong> azt,
            mekkora út, az <strong>alak</strong> pedig azt, mire való.
          </p>
        </header>

        <div className="szinsor">
          {SZINEK.map((sz) => (
            <div className="szinsor__elem" key={sz.id} style={{ '--jel-szin': sz.szin }}>
              <span className="szinsor__folt" aria-hidden="true" />
              <span className="szinsor__nev">{sz.nev}</span>
              <span className="szinsor__leiras">{sz.leiras}</span>
            </div>
          ))}
        </div>

        <div className="jelzesek">
          {JELZESEK.map((j) => (
            <article className="jelzes" key={j.id}>
              <span className="jelzes__abra" aria-hidden="true">
                <Alak alak={j.alak} />
              </span>
              <h3 className="jelzes__cim">{j.cim}</h3>
              <p className="jelzes__leiras">{j.leiras}</p>
            </article>
          ))}
        </div>

        <p className="apro">
          Ezt nem fejből írtuk: az OpenStreetMap jelzett útjaiból ellenőriztük, mi hova
          vezet. A háromszöggel jelöltek neve csúcsnál vagy kilátónál végződik, a körrel
          jelöltek ugyanoda érnek vissza, ahonnan indultak.
        </p>
      </section>

      <section className="szekcio" data-feltun>
        <header className="szekcio__fej">
          <h2 className="szekcio__cim">Kezdd egy kész vonallal</h2>
          <p className="szekcio__lead">
            Nyisd meg, húzd arrébb a pontjait, tedd rá a sajátodat.
          </p>
        </header>
        <div className="kartyak">
          {peldaUtvonalak.slice(0, 3).map((p) => {
            const km = hossz(p.pontok);
            const ertekeles = ertekelesSzerint(p.id);
            return (
              <article className="kartya" key={p.id}>
                <h3 className="kartya__cim">
                  <a href={`/utvonalak/${p.id}`}>{p.nev}</a>
                </h3>
                <p className="kartya__hol">{p.hol}</p>
                {ertekeles && (
                  <p className="kartya__csillag">
                    <Csillagok ertek={ertekeles.csillag} meret={15} />
                    <span>szerintünk</span>
                  </p>
                )}
                <p className="kartya__jegyzet">{ertekeles?.verdikt ?? p.jegyzet}</p>
                <ul className="cimkek">
                  <li>{kmSzoveg(km)}</li>
                  <li>{ido(km)} gyalog</li>
                </ul>
                <div className="kartya__gombok">
                  <a className="gomb gomb--halk" href={tervLinkje('/tervezo', p)}>
                    Megnyitás a tervezőben
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        <a className="vissza-link" href="/utvonalak">Mind a nyolc példa →</a>
      </section>
    </div>
  );
}

/* A négy jelzésalak egyszerű rajza — ugyanaz, ami a fán van. */
function Alak({ alak }) {
  const kozos = { fill: 'currentColor' };
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="0" y="0" width="40" height="40" rx="4" className="jelzes__hatter" />
      {alak === 'bar' && <rect x="6" y="16" width="28" height="8" {...kozos} />}
      {alak === 'triangle' && <path d="M20 9 32 29H8z" {...kozos} />}
      {alak === 'circle' && <circle cx="20" cy="20" r="10" {...kozos} />}
      {alak === 'cross' && <path d="M16 7h8v9h9v8h-9v9h-8v-9H7v-8h9z" {...kozos} />}
    </svg>
  );
}
