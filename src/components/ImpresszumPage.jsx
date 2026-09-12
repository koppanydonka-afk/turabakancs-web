import { UZEMELTETO, vanElerhetoseg } from '../data/uzemelteto.js';

/* Impresszum és felelősség.

   Nem jogi sablon: sima mondatok arról, ki csinálja az oldalt, mire jó,
   és mire nem. Egy ingyenes, nem kereskedelmi oldalnál ennyi a tisztesség
   — és sokkal többet ér a bizalomnak, mint egy másolt jogi szöveg. */

export default function ImpresszumPage() {
  return (
    <section className="oldal oldal--szoveg">
      <header className="oldal__fej">
        <p className="kalap">Impresszum</p>
        <h1 className="oldal__cim">Ki csinálja, és mire jó.</h1>
        <p className="oldal__bevezeto">
          A Túrabakancs ingyenes, nem kereskedelmi oldal. Nem árul semmit, nem közvetít,
          nem gyűjt adatot — egy eszköz, amit bárki használhat.
        </p>
      </header>

      <div className="szoveg">
        <h2>Az üzemeltető</h2>
        <p>
          <strong>{UZEMELTETO.nev}</strong>
          {UZEMELTETO.varos ? `, ${UZEMELTETO.varos}` : ''}
          {vanElerhetoseg() ? (
            <>
              {' · '}
              <a href={`mailto:${UZEMELTETO.email}`}>{UZEMELTETO.email}</a>
            </>
          ) : null}
        </p>
        {!vanElerhetoseg() && (
          <p className="figyelmeztetes">
            <strong>Itt még nincs elérhetőség.</strong> Ha szeretnéd, hogy a látogatók
            írhassanak neked, vedd fel az e-mail-címet a <code>src/data/uzemelteto.js</code>{' '}
            fájlban. Érdemes külön címet használni erre, ne a személyeset.
          </p>
        )}

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
          a teljes jegyzék a <a href="/rolad">Mit tudunk rólad</a> oldalon van.
        </p>

        <h2>Adatkezelés</h2>
        <p>
          Az oldal nem kér fiókot, nem gyűjt személyes adatot, és nem használ sütiket.
          Hogy pontosan mi történik (és mi nem), azt a{' '}
          <a href="/rolad">Mit tudunk rólad</a> oldal írja le.
        </p>
      </div>
    </section>
  );
}
