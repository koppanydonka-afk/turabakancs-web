import { LATVANYOSSAGOK } from '../data/latvanyossagok.js';

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
        <p className="kalap">Impresszum</p>
        <h1 className="oldal__cim">Mire jó, és mire nem.</h1>
        <p className="oldal__bevezeto">
          A Túrabakancs ingyenes, nem kereskedelmi oldal. Nem árul semmit, nem közvetít,
          nem gyűjt adatot — egy eszköz, amit bárki használhat.
        </p>
      </header>

      <div className="szoveg">
        <h2>Felelősség — ezt olvasd el, ha túrázni indulsz</h2>
        <p>
          Az oldal útvonalakat, távolságokat, emelkedőket, menetidőt és napnyugtát mutat.
          Ezek <strong>számítások és becslések</strong>, nem garanciák:
        </p>
        <ul>
          <li>
            A vonalak a térképadatból származó gyalogutakat követik. Hogy az adott ösvény
            most járható-e, azt a térkép nem tudja — fa dőlhet rá, elmoshatja az eső,
            lezárhatják.
          </li>
          <li>
            A menetidő sík terepre és átlagos tempóra számol. Terhelés, hó, sár, sötétedés
            és a saját erőnléted mind felülírja.
          </li>
          <li>
            Az emelkedő domborzatmodellből jön, ami néhány méterrel eltérhet a valóságtól.
          </li>
        </ul>
        <p>
          <strong>A terepen a saját döntésed és felelősséged számít.</strong> Tájékozódásra a
          jelzett turistautak és a hivatalos térképek valók; indulás előtt nézd meg az
          időjárást, és mondd meg valakinek, hova mész. Ez az oldal segít tervezni — nem
          helyettesíti a józan észt.
        </p>

        <h2>A tartalom</h2>
        <p>
          A csillagos értékelések a mi véleményünk, nem mások pontszámainak átlaga.
          A térképadat az OpenStreetMapből jön, amit önkéntesek tartanak karban. A
          látványosságok fotói szabad licenc alatt állnak, a szerzőik nevével együtt —
          a teljes jegyzék lent, <a href="#kepek">A képek</a> alatt.
        </p>

        <h2>Adatkezelés</h2>
        <p>
          Az oldal nem kér fiókot, nem gyűjt személyes adatot, és nem használ sütiket.
          Amit rajzolsz, a böngésződben keletkezik, és ott is marad: a mentett terveid a
          saját géped tárolójába kerülnek, a megosztható link pedig magába a címbe teszi
          az útvonalat, nem egy adatbázisba.
        </p>
        <p>
          Ami mégis kimegy az internetre, az nem hozzánk megy. A térképcsempéket és a
          helykeresés válaszát az OpenStreetMap nyilvános szolgáltatásai adják, a
          magassági adatot az Open-Meteo, az útvonalak ösvényre húzását pedig a FOSSGIS
          gyalogos útvonalkeresője. Ilyenkor — mint minden weboldal minden képénél —
          látszik feléjük az IP-címed, a húzásnál és a magasságnál pedig a vonalad
          koordinátái is. Ezt nem tudjuk megkerülni, ha térképet akarunk mutatni; de
          legalább tudsz róla.
        </p>

        <h2 id="kepek">A képek</h2>
        <p>
          A térképen látható látványosságok fotói a Wikimedia Commonsról valók, és
          szabad licenc alatt állnak — de a szabad nem azt jelenti, hogy gazdátlan:
          mindegyiknek van szerzője, akit meg kell nevezni. Az alábbi lista ezt teszi.
          A képeket letöltöttük a saját oldalunkra, hogy a böngésződ ne kérjen le
          semmit idegen szerverről.
        </p>
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
