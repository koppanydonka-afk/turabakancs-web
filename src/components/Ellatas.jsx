import { useRef, useState } from 'react';
import { megallok, utMentiek } from '../data/szolgaltatasok.js';
import { tipusSzerint } from '../data/jelolesek.js';

/* „Mi van az útvonalon?”

   A tanácsadó eddig két dolgot kifogásolt — nincs víz jelölve, nincs
   megközelítés jelölve —, és mindkettőt a felhasználóra tolta. Ez a fiók
   megválaszolja őket.

   Csak nyitáskor kérdez, és csak egyszer: az Overpass közös, ingyenes
   szolgáltatás, nem terheljük automatikus lekérésekkel.

   A víznél végig különbséget teszünk aközött, amit ivásra szántak, és ami
   csak egy forrás a térképen. Utóbbi lehet kiszáradt vagy szennyezett — egy
   nyári túrán ezen múlhat valami, ezért nem mossuk össze a kettőt. */

const meter = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

export default function Ellatas({ pontok, onJelolesHozzaad, onOdaugrik }) {
  const [allapot, setAllapot] = useState('varakozik');
  const [lista, setLista] = useState([]);
  const [osszkep, setOsszkep] = useState({ osszesen: 0, levagva: 0, szamlalo: { ivhato: 0, forras: 0, menedek: 0 } });
  const [indulo, setIndulo] = useState([]);
  /* 'kesz' | 'nem-sikerult' — a kettőt nem szabad összemosni. Ha a lekérés
     elhasal, attól még lehet ott megálló; ilyenkor hallgatni kell róla, nem
     azt állítani, hogy nincs. */
  const [induloAllapot, setInduloAllapot] = useState('kesz');
  const [hiba, setHiba] = useState(null);
  const [betett, setBetett] = useState(() => new Set());
  const lefutott = useRef(false);
  /* Amit már lekérdeztünk; újranyitáskor nem kérjük el mégegyszer. */
  const mar = useRef(null);

  const keres = async () => {
    if (lefutott.current) return;
    lefutott.current = true;
    setAllapot('keres');
    setHiba(null);

    /* Újranyitáskor csak azt kérdezzük le újra, ami hiányzik. Az Overpass
       közös erőforrás; nincs értelme még egyszer elkérni, ami megvan. */
    const kellUtMenti = mar.current === null;

    try {
      if (kellUtMenti) {
        const t = await utMentiek(pontok, { savMeter: 500 });
        mar.current = t;
        setLista(t.lista);
        setOsszkep({ osszesen: t.osszesen, levagva: t.levagva, szamlalo: t.szamlalo });
      }
    } catch (e) {
      setHiba(e.message);
      setAllapot('kesz');
      lefutott.current = false;
      return;
    }

    /* Sorban, nem párhuzamosan: két egyszerre induló kérésre az Overpass
       könnyen 429-cel válaszol. */
    try {
      setIndulo(await megallok(pontok[0]));
      setInduloAllapot('kesz');
    } catch {
      setIndulo([]);
      setInduloAllapot('nem-sikerult');
      /* A fiók becsukása-nyitása újrapróbálja — de csak a megállókat. */
      lefutott.current = false;
    }
    setAllapot('kesz');
  };

  const betesz = (x) => {
    onJelolesHozzaad?.({ lat: x.lat, lng: x.lng, tipus: x.tipus, cimke: x.nev });
    setBetett((e) => new Set(e).add(x.id));
  };

  const { ivhato, forras, menedek } = osszkep.szamlalo;
  /* Igazolt ivóvíz sehol, csak forrás: ezt ki kell mondani, nem elrejteni. */
  const csakForras = ivhato === 0 && forras > 0;

  const sor = (x, masodik) => (
    <li key={x.id} className="ellatas__sor">
      <span className="ellatas__jel" style={{ '--tu-szin': tipusSzerint(x.tipus).szin }} aria-hidden="true">
        <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: tipusSzerint(x.tipus).rajz }} />
      </span>
      <button className="ellatas__nev" onClick={() => onOdaugrik?.([x.lat, x.lng])} title="Megmutatom a térképen">
        {x.nev}
        <span>{masodik}</span>
      </button>
      <button
        className="ellatas__betesz"
        onClick={() => betesz(x)}
        disabled={betett.has(x.id)}
        title="Jelölésként beteszem a tervbe"
      >
        {betett.has(x.id) ? 'bent' : '+ terv'}
      </button>
    </li>
  );

  return (
    <details className="fiok" onToggle={(e) => e.currentTarget.open && keres()}>
      <summary>Mi van az útvonalon?</summary>
      <div className="fiok__tartalom">
        {allapot === 'varakozik' && (
          <p className="apro">
            Megkeresem a víz-, menedék- és megállóhelyeket az útvonalad 500 méteres
            sávjában. Az adat az OpenStreetMapből jön, gombnyomásra.
          </p>
        )}

        {allapot === 'keres' && <p className="apro">Keresem…</p>}

        {hiba && <p className="uzenet uzenet--hiba">{hiba}</p>}

        {allapot === 'kesz' && !hiba && (
          <>
            <div className="ellatas__osszegzes">
              <span><strong>{ivhato}</strong> ivóvíz</span>
              <span><strong>{forras}</strong> forrás</span>
              <span><strong>{menedek}</strong> menedék</span>
            </div>

            {csakForras && (
              <p className="uzenet uzenet--hiba">
                Igazolt ivóvíz nincs az útvonalon, csak forrás. A forrás kiszáradhat, és
                nem ivóvízminőségű — <strong>vidd magaddal a napi vizedet</strong>.
              </p>
            )}

            {osszkep.levagva > 0 && (
              <p className="apro">
                Összesen {osszkep.osszesen} hely esik a sávba — itt a húsz, amelyik a
                legközelebb van a vonaladhoz. A többi nagyobb kitérő lenne.
              </p>
            )}

            {lista.length === 0 && (
              <p className="apro">
                Nem találtam semmit a sávban. Ez nem jelenti, hogy nincs — csak azt, hogy
                az OpenStreetMapben nincs felvéve. Vizet mindenképp vigyél.
              </p>
            )}

            {lista.length > 0 && (
              <ul className="ellatas__lista">
                {lista.map((x) =>
                  sor(
                    x,
                    `${x.utKm.toFixed(1)} km-nél · ${meter(x.eltavolodasM)}-re az úttól${
                      x.tipus === 'forras'
                        ? x.ivasra === true
                          ? ' · iható'
                          : x.ivasra === false
                            ? ' · NEM iható'
                            : ' · nincs adat róla, hogy iható-e'
                        : ''
                    }`,
                  ),
                )}
              </ul>
            )}

            <h3 className="ellatas__cim">Megközelítés a rajthoz</h3>
            {induloAllapot === 'nem-sikerult' ? (
              <p className="apro">
                A megállókat most nem sikerült lekérdezni — a kereső túlterhelt volt.
                Ez nem azt jelenti, hogy nincs megálló: csak azt, hogy nem tudom. Csukd
                be és nyisd ki a fiókot, ha újra megpróbálnád.
              </p>
            ) : indulo.length === 0 ? (
              <p className="apro">
                Nem találtam megállót a rajt 1,5 kilométeres körzetében. Ide alighanem
                autóval érdemes jönni.
              </p>
            ) : (
              <ul className="ellatas__lista">
                {indulo.map((x) => sor(x, `${meter(x.tavolsagM)}-re a rajttól · ${x.fajta}`))}
              </ul>
            )}
            <p className="apro">
              A menetrendet nem ismerjük — a megálló helyét igen. Indulás előtt nézd meg
              a szolgáltatónál, jár-e arra busz a te időpontodban.
            </p>
          </>
        )}
      </div>
    </details>
  );
}
