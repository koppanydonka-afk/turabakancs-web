import { LATVANYOSSAGOK } from '../data/latvanyossagok.js';
import { sz } from '../nyelv/index.js';

/* Impresszum, felelősség, adatkezelés és képjegyzék — egy oldalon.

   Korábban két oldal volt: ez, és a „Mit tudunk rólad”. Ugyanazt mondták el
   kétszer, más szavakkal, és a lábjegyzet két linkje ugyanoda vezetett.

   Nem jogi sablon: sima mondatok arról, mire jó az oldal és mire nem. Egy
   ingyenes, nem kereskedelmi oldalnál ennyi a tisztesség — és többet ér a
   bizalomnak, mint egy másolt jogi szöveg.

   A képjegyzék viszont nem udvariasság: a látványosságok fotói CC BY és
   CC BY-SA alatt állnak, ahol a szerző és a licenc megjelölése a
   felhasználás feltétele. Ez a lista teljesíti azt — ezért nem törölhető. */

export default function ImpresszumPage() {
  return (
    <section className="oldal oldal--szoveg">
      <header className="oldal__fej">
        {/* Nincs nagy címsor: ez nem kirakat, hanem tudnivaló. A kalap
            viszont h1 maradt — egy oldalnak legyen egy címe, különben a
            képolvasó és a kereső is elveszti a fonalat. */}
        <h1 className="kalap">{sz('imp.cim')}</h1>
      </header>

      <div className="szoveg">
        <h2>{sz('imp.felelossegCim')}</h2>
        {/* A kiemelt részt a szótár {eros} helye jelöli ki — a szórend
            nyelvenként más, a hangsúly nem mozdulhat el tőle. */}
        <p>
          {sz('imp.felelossegLead', { eros: '\u0000' }).split('\u0000')[0]}
          <strong>{sz('imp.felelossegEros')}</strong>
          {sz('imp.felelossegLead', { eros: '\u0000' }).split('\u0000')[1]}
        </p>
        <ul>
          <li>{sz('imp.felelosseg1')}</li>
          <li>{sz('imp.felelosseg2')}</li>
          <li>{sz('imp.felelosseg3')}</li>
        </ul>
        <p>
          <strong>{sz('imp.felelossegZaroEros')}</strong>
          {sz('imp.felelossegZaro', { eros: '' })}
        </p>

        <h2>{sz('imp.tartalomCim')}</h2>
        <p>
          {sz('imp.tartalom', { link: '\u0000' }).split('\u0000')[0]}
          <a href="#kepek">{sz('imp.kepekCim')}</a>
          {sz('imp.tartalom', { link: '\u0000' }).split('\u0000')[1]}
        </p>

        <h2>{sz('imp.adatCim')}</h2>
        <p>{sz('imp.adat1')}</p>
        <p>{sz('imp.adat2')}</p>

        <h2 id="kepek">{sz('imp.kepekCim')}</h2>
        <p>{sz('imp.kepek')}</p>
        <ul className="kepjegyzek">
          {LATVANYOSSAGOK.map((l) => (
            <li key={l.id}>
              <a href={l.forras} target="_blank" rel="noopener noreferrer">{l.nev}</a>
              {' — '}{l.szerzo}{', '}
              {l.licencUrl ? (
                <a href={l.licencUrl} target="_blank" rel="noopener noreferrer">{l.licenc}</a>
              ) : (
                l.licenc
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
