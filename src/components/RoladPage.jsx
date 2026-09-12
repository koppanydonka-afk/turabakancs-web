import { LATVANYOSSAGOK } from '../data/latvanyossagok.js';

/* „Mit tudunk rólad” — nem jogi szöveg, hanem sima magyar mondatok arról,
   mi történik az adataiddal. Azért lehet ilyen rövid, mert tényleg nincs
   mögötte se fiók, se adatbázis, se mérőkód.

   A képjegyzék viszont nem udvariasság: a látványosságok fotói CC BY és
   CC BY-SA alatt állnak, ahol a szerző és a licenc megjelölése a
   felhasználás feltétele. Ez a lista teljesíti azt. */

export default function RoladPage() {
  return (
    <section className="oldal oldal--szoveg">
      <header className="oldal__fej">
        <p className="kalap">Nyíltan</p>
        <h1 className="oldal__cim">Mit tudunk rólad? Semmit.</h1>
        <p className="oldal__bevezeto">
          Nincs regisztráció, nincs bejelentkezés, nincs hírlevél, és nincs mérőkód
          az oldalon. Nem azért, mert eldugtuk — hanem mert nincs ilyen.
        </p>
      </header>

      <div className="szoveg">
        <h2>Amit rajzolsz</h2>
        <p>
          A pontok és a jelölések a böngésződben keletkeznek, és ott is maradnak.
          Amikor mentesz, a saját géped tárolójába kerülnek (ezt hívják
          localStorage-nak), ahová rajtad kívül senki nem lát bele. Ha kitakarítod a
          böngésző előzményeit, a mentéseid is eltűnnek — ezért éles túra előtt érdemes
          GPX-ben letölteni.
        </p>

        <h2>A megosztható link</h2>
        <p>
          Amikor linket kérsz, az útvonal magába a címbe kerül bele — nem egy
          adatbázisba. Ezért a link hosszú, és ezért nem kell hozzá szerver. Aki
          megkapja, ugyanazt látja; aki nem kapja meg, annak nincs honnan megszereznie.
        </p>

        <h2>Sütik</h2>
        <p>
          Nincsenek. Se mérő-, se hirdetési süti. A böngésződ tárolójában két dolog
          lehet: a mentett terveid, és hogy sötét módot választottál-e. Mindkettő a te
          gépeden van, és a kedvedért van ott.
        </p>

        <h2>Ami mégis kimegy az internetre</h2>
        <p>
          Négy dolog, és egyik sem hozzám. Az első magától fut, a másik három csak
          akkor, ha megnyomsz egy gombot:
        </p>
        <ul>
          <li>
            <strong>A térképcsempék.</strong> Ahogy mozgatod a térképet, a böngésződ
            letölti a képeket az OpenStreetMap szervereiről. Ilyenkor — mint minden
            weboldal minden képénél — látszik feléjük az IP-címed.
          </li>
          <li>
            <strong>A helykeresés.</strong> Ha beírsz egy helynevet és rákattintasz a
            keresésre, azt a szót az OpenStreetMap nyilvános keresője válaszolja meg.
            Gépelés közben nem kérdez, csak gombnyomásra.
          </li>
          <li>
            <strong>A jelzett turistautak.</strong> Az „Útvonalak” fülön a keresés
            megmondja az OpenStreetMapnek, melyik térképszakasz érdekel. Magát az
            útvonaladat nem küldi el — csak a látható terület sarokpontjait.
          </li>
          <li>
            <strong>A magassági adat.</strong> Az „Ajánló” fülön a lekérés elküldi a
            vonalad mintavételi pontjait az Open-Meteo nyilvános szolgáltatásának,
            hogy visszaadja a tengerszint feletti magasságot. Ez az egyetlen eset,
            amikor a megrajzolt útvonalad koordinátái elhagyják a böngésződet — és
            csak akkor, ha te kéred.
          </li>
        </ul>
        <p>
          Ezeket nem tudjuk megkerülni, ha térképet akarunk mutatni — de legalább
          tudsz róluk.
        </p>

        <h2>A képek</h2>
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

        <h2>Miért így?</h2>
        <p>
          Mert így nincs mit elveszíteni, nincs mit kiszivárogtatni, és nincs mit
          eladni. Egy eszköz, ami elvégzi a dolgát, aztán elfelejt téged.
        </p>
      </div>
    </section>
  );
}
