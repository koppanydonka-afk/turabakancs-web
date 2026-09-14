import Vedjegy from './Vedjegy.jsx';
import Csillagok from './Csillagok.jsx';
import UtvonalRajz from './UtvonalRajz.jsx';
import { ertekelesSzerint } from '../data/ertekelesek.js';
import { JELZESEK, SZINEK } from '../data/erdekessegek.js';
import { RETEGEK } from '../data/szolgaltatasok.js';
import { tipusSzerint } from '../data/jelolesek.js';
import { peldaUtvonalak } from '../data/peldak.js';
import { hossz, ido, kmSzoveg, tervLinkje } from '../data/utvonalak.js';
import { napkelte, napnyugta, oraPerc, vilagosMeg } from '../data/naptar.js';
import { menetido, nehezseg } from '../data/ajanlo.js';
import { useMost } from '../ora.js';
import { ut } from '../router.js';
import { sz } from '../nyelv/index.js';

/* Főoldal. A tervező innen nyílik, de előbb van mit nézni:
   egy mai adat, a jelzésrendszer magyarázata, három példa, és a
   név nélküli véleményfal. */

const BUDAPEST = [47.4979, 19.0402];

const perc = (p) =>
  p < 60 ? sz('ido.perc', { p }) : sz('ido.oraPerc', { o: Math.floor(p / 60), p: p % 60 });

export default function FooldalPage() {
  /* Nem `new Date()`: az egyszer futna le, és a nyitva hagyott lap
     másnap is a tegnapi napkeltét mutatná. */
  const most = useMost();
  const kelte = napkelte(most, ...BUDAPEST);
  const nyugta = napnyugta(most, ...BUDAPEST);
  const maradek = vilagosMeg(...BUDAPEST, most);

  /* Az első példa a kirakat. Mért adat: a hossz a pontokból, az emelkedő a
     domborzatmodellből — se becslés, se kézzel beírt szám. */
  const kiemelt = peldaUtvonalak[0];
  const kiemeltKm = kiemelt ? hossz(kiemelt.pontok) : 0;
  const kiemeltIdo = kiemelt ? menetido(kiemeltKm, 'gyalog', kiemelt.emelkedo?.fel) : 0;

  return (
    <div className="fooldal tura">
      {/* A lap egy túra: középen az ösvény fut (a háttérben), a tartalom
          pedig állomásokként áll mellette — hol jobbra, hol balra. A
          csupasz szöveg mind lapra került: erdei háttéren csak úgy
          olvasható. Keskeny képernyőn az egész egy hasáb marad. */}
      <section className="hos tura__teljes">
        {/* Eddig egyáltalán nem volt h1 az oldalon. A védjegy a cím: a nevet
            ő maga mondja ki (a bakancs `aria-label`-je a hiányzó „k”), ezért
            ide csak a leíró farok kerül — különben kétszer hangzana el. */}
        <h1 className="hos__vedjegy">
          <Vedjegy magassag={54} />
          <span className="csak-olvasonak"> — túraútvonal-tervező térkép</span>
        </h1>
        <p className="hos__lead">{sz('fooldal.lead')}</p>
        <div className="hos__gombok">
          <a className="gomb gomb--fo" href={ut('/tervezo')}>{sz('fooldal.tervezek')}</a>
          <a className="gomb gomb--halk" href={ut('/utvonalak')}>{sz('fooldal.peldak')}</a>
        </div>
      </section>

      {/* ---- Kiemelt példa ----

          A főoldalon eddig egyetlen térkép sem volt, pedig ez egy térképes
          eszköz. Ez a rajz a példa VALÓDI pontjaiból készül — ugyanabból az
          adatból, amiből a tervező dolgozik —, tehát nem illusztráció,
          hanem az, ami tényleg kijön belőle. Térképkönyvtár nélkül, pár
          száz bájtból: a főoldalnak gyorsan kell betöltenie. */}
      {kiemelt && (
        <section className="pelda-sav tura__allomas tura__allomas--bal" data-feltun>
          <div className="pelda-sav__rajz">
            <UtvonalRajz pontok={kiemelt.pontok} cimke={kiemelt.nev} />
          </div>
          <div className="pelda-sav__szoveg">
            <p className="kalap">{sz('fooldal.peldaKalap')}</p>
            <h2 className="pelda-sav__cim">{kiemelt.nev}</h2>
            <p className="pelda-sav__hol">{kiemelt.hol}</p>
            <div className="ertekek">
              <div className="ertekek__elem">
                <strong>{kmSzoveg(kiemeltKm)}</strong>
                <span>{sz('adat.hossz')}</span>
              </div>
              <div className="ertekek__elem">
                <strong>↑ {kiemelt.emelkedo.fel} m</strong>
                <span>{sz('adat.emelkedo')}</span>
              </div>
              <div className="ertekek__elem ertekek__elem--kiemelt">
                <strong>{perc(kiemeltIdo)}</strong>
                <span>{sz('adat.menetido')}</span>
              </div>
              <div className="ertekek__elem">
                <strong>{nehezseg(kiemeltKm, kiemelt.emelkedo.fel).szo}</strong>
                <span>{sz('adat.nehezseg')}</span>
              </div>
            </div>
            <a className="gomb gomb--fo" href={tervLinkje(ut('/tervezo'), kiemelt)}>
              {sz('fooldal.peldaNyisd')}
            </a>
          </div>
        </section>
      )}

      {nyugta && (
        <section className="ma tura__allomas tura__allomas--jobb" data-feltun style={{ "--lepcso": 0 }}>
          <h2 className="ma__cim">{sz('fooldal.ma')}</h2>
          <div className="ma__adatok">
            <div className="ma__elem">
              <strong>{oraPerc(kelte)}</strong>
              <span>{sz('fooldal.napkelte')}</span>
            </div>
            <div className="ma__elem">
              <strong>{oraPerc(nyugta)}</strong>
              <span>{sz('fooldal.napnyugta')}</span>
            </div>
            <div className="ma__elem ma__elem--kiemelt">
              <strong>{maradek > 0 ? perc(maradek) : sz('fooldal.lement')}</strong>
              <span>{maradek > 0 ? sz('fooldal.vanMeg') : sz('fooldal.marLement')}</span>
            </div>
          </div>
          <p className="apro">{sz('fooldal.napAlap')}</p>
        </section>
      )}

      {/* ---- Mit tud ----

          Négy hasábos kártyarács volt, de 272 képpontos kártyákon négy-öt
          soros mondatokkal az egész egy szövegfal lett, és az egyenlő
          magasságú kártyák alján ott maradt az üresség. Listában viszont
          minden tétel a saját tartalmához igazodik, a sor teljes
          szélességben fut, és a szöveg olvasható méretű lehet.

          A sorszám nem dísz: négyet ígér a bevezető, és így meg is
          számolható. */}
      <section className="szekcio tura__allomas tura__allomas--bal" data-feltun>
        <header className="szekcio__fej">
          <h2 className="szekcio__cim">{sz('fooldal.mitTud')}</h2>
          <p className="szekcio__lead">{sz('fooldal.mitTudLead')}</p>
        </header>
        <ol className="tud-lista">
          {[1, 2, 3, 4].map((n) => (
            <li className="tud" key={n}>
              <span className="tud__szam" aria-hidden="true">{`0${n}`}</span>
              <div className="tud__test">
                <h3 className="tud__cim">{sz(`fooldal.tud${n}Cim`)}</h3>
                <p className="tud__szoveg">
                  {sz(`fooldal.tud${n}`)}
                  {/* Két ízelítő ikon a mondat végén, a szöveg sorában. A
                      hét réteg teljes jelmagyarázata a tervezőben van. */}
                  {n === 3 && (
                    /* `span`, nem `ul`: a mondat közepén állnak, a `<p>` pedig
                       nem tűr listát — a böngésző HTML-elemzője ilyenkor
                       lezárná a bekezdést, és szétesne a szerkezet. Nem is
                       lista: két ízelítő ikon, nem végigolvasható felsorolás. */
                    <span className="tud__retegek">
                      {['viz', 'latvany'].map((id) => (
                        <span key={id} style={{ '--tu-szin': RETEGEK[id].gombSzin }} title={sz(RETEGEK[id].nevKulcs)}>
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            dangerouslySetInnerHTML={{ __html: tipusSzerint(RETEGEK[id].tipus).rajz }}
                          />
                          <span className="csak-olvasonak">{sz(RETEGEK[id].nevKulcs)}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="szekcio tura__allomas tura__allomas--jobb" data-feltun>
        <header className="szekcio__fej">
          <h2 className="szekcio__cim">{sz('fooldal.jelzesCim')}</h2>
          <p className="szekcio__lead">
            {sz('fooldal.jelzesLead')}
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

        <p className="apro">{sz('fooldal.jelzesApro')}</p>
      </section>

      <section className="szekcio tura__teljes" data-feltun>
        <header className="szekcio__fej">
          <h2 className="szekcio__cim">{sz('fooldal.keszVonal')}</h2>
          <p className="szekcio__lead">{sz('fooldal.keszVonalLead')}</p>
        </header>
        <div className="kartyak">
          {peldaUtvonalak.slice(0, 3).map((p) => {
            const km = hossz(p.pontok);
            const ertekeles = ertekelesSzerint(p.id);
            return (
              <article className="kartya" key={p.id}>
                {/* A vonal alakja: ennyiből is látszik, hogy kör-e vagy
                    átmenő, és hogy mennyire kanyarog. */}
                <a className="kartya__rajz" href={ut(`/utvonalak/${p.id}`)} tabIndex={-1} aria-hidden="true">
                  <UtvonalRajz pontok={p.pontok} />
                </a>
                <h3 className="kartya__cim">
                  <a href={ut(`/utvonalak/${p.id}`)}>{p.nev}</a>
                </h3>
                <p className="kartya__hol">{p.hol}</p>
                {/* A csillagsor akkor is megjelenik, ha nincs értékelés —
                    üresen. A rácssorok száma így állandó, és a kártyák
                    egymáshoz igazodnak. */}
                <p className="kartya__csillag">
                  {ertekeles && (
                    <>
                      <Csillagok ertek={ertekeles.csillag} meret={15} />
                      <span>{sz('fooldal.szerintunk')}</span>
                    </>
                  )}
                </p>
                <p className="kartya__jegyzet">{ertekeles?.verdikt ?? p.jegyzet}</p>
                <ul className="cimkek">
                  <li>{kmSzoveg(km)}</li>
                  <li>{ido(km)}</li>
                </ul>
                <div className="kartya__gombok">
                  <a className="gomb gomb--halk" href={tervLinkje(ut('/tervezo'), p)}>
                    {sz('utvonal.megnyitas')}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        {/* Szám nélkül: a kézzel beírt darabszám elavul, és el is avult —
            „nyolc” állt itt, miközben tizennyolc útvonal van. */}
        <a className="vissza-link" href={ut('/utvonalak')}>{sz('fooldal.osszesPelda')}</a>
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
