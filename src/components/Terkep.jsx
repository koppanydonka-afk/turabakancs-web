import { useEffect, useRef, useState } from 'react';
import { MIN_ZOOM, RETEGEK, teruleten } from '../data/szolgaltatasok.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tipusSzerint, tuHtml } from '../data/jelolesek.js';
import { LATVANYOSSAGOK } from '../data/latvanyossagok.js';
import FejlecEszkozok from './FejlecEszkozok.jsx';

/* A térkép.

   Leaflet + OpenStreetMap: nem kell hozzá API-kulcs és bankkártya sem,
   szemben a Google Maps JavaScript API-jával. A csempékért cserébe kötelező
   a forrásmegjelölés — a térkép sarkában ott is van.

   Ugyanez a komponens szolgál szerkesztésre és puszta nézegetésre: ha nincs
   `mod`, akkor a kattintás nem csinál semmit. */

const KEZDO_KOZEP = [47.4979, 19.0402];
const KEZDO_ZOOM = 12;

/* A buborék tartalma a saját adatfájlunkból jön, de a szerzőneveket a
   Commonsról vettük át — ezért itt is megszűrjük, mielőtt HTML-be tesszük. */
const htmlBiztos = (szoveg) =>
  String(szoveg ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default function Terkep({
  pontok = [],
  /* A felhasználó által kattintott pontok. Ha meg van adva, a jelölők
     EZEKRE kerülnek — a `pontok` ilyenkor már a szolgáltatástól kapott,
     sűrű vonal, amit nem értelmes pontonként fogdosni. */
  horgonyok = null,
  jelolesek = [],
  latvanyok = false,
  /* Ellátás-rétegek gombjai a térkép jobb alsó sarkában (ivóvíz, megálló).
     Csak a tervezőn kell — a példaoldalak nézetében nincs értelme. */
  retegGombok = false,
  mod = null,
  ujTipus = 'kilato',
  illeszt = 0,
  onPontHozzaad,
  onPontMozgat,
  onPontTorol,
  onJelolesHozzaad,
  onJelolesMozgat,
  onJelolesTorol,
  onKesz,
}) {
  const doboz = useRef(null);
  const terkep = useRef(null);
  const vonalReteg = useRef(null);
  const jelolesReteg = useRef(null);
  const latvanyReteg = useRef(null);
  const ellatasReteg = useRef(null);
  const vaszon = useRef(null);
  /* Melyik területre kérdeztünk le utoljára rétegenként — ebből tudjuk, hogy
     az elpásztázott térképhez kell-e új keresés. */
  const utolsoDoboz = useRef({});

  const [retegek, setRetegek] = useState({ viz: false, kozlekedes: false });
  const [retegAllapot, setRetegAllapot] = useState({});
  const [ujraKell, setUjraKell] = useState(false);
  const [zoomOk, setZoomOk] = useState(true);

  /* A térkép egyszer jön létre, a kattintáskezelő viszont mindig a friss
     propokat kell lássa — ezért ref-en át éri el őket. */
  const friss = useRef({});
  friss.current = {
    mod,
    ujTipus,
    onPontHozzaad,
    onPontMozgat,
    onPontTorol,
    onJelolesHozzaad,
    onJelolesMozgat,
    onJelolesTorol,
    retegek,
  };

  useEffect(() => {
    if (terkep.current || !doboz.current) return undefined;

    const map = L.map(doboz.current, {
      center: KEZDO_KOZEP,
      zoom: KEZDO_ZOOM,
      /* A bal felső sarok a módváltóé és a paletta-soré, ezért a
         nagyítógombok a másik oldalra kerülnek. */
      zoomControl: false,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);
    /* A „Leaflet” előtag a könyvtár udvariassági megjelölése, nem licenc-
       feltétel — azt elhagyjuk. A „© OpenStreetMap közreműködői” viszont
       KÖTELEZŐ, azt sem rövidíteni, sem elhagyni nem szabad. A „Térkép:”
       előtag a mi kiegészítésünk volt, az mehet. */
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> közreműködői',
    }).addTo(map);

    map.on('click', (event) => {
      const { mod: m, onPontHozzaad: pont, onJelolesHozzaad: jel, ujTipus: tipus } = friss.current;
      if (m === 'ut') pont?.([event.latlng.lat, event.latlng.lng]);
      if (m === 'jeloles') jel?.({ lat: event.latlng.lat, lng: event.latlng.lng, tipus });
    });

    terkep.current = map;

    /* Az ellátás-pontok vászonra rajzolódnak, nem DOM-jelölőként. Négyszáz
       kör így is simán pásztázható; ugyanennyi hagyományos jelölő telefonon
       megakasztaná a térképet. */
    vaszon.current = L.canvas({ padding: 0.3 });
    ellatasReteg.current = L.layerGroup().addTo(map);

    map.on('moveend zoomend', () => {
      const z = map.getZoom();
      const eleg = z >= MIN_ZOOM;
      setZoomOk(eleg);
      const h = map.getBounds();
      const bekapcsolt = Object.entries(friss.current.retegek ?? {}).filter(([, be]) => be);

      /* A küszöb alatt nem hagyjuk kint a korábbi találatokat: az a
         legrosszabb, ha elavult adat frissnek látszik. Töröljük, és a gomb
         megmondja, hogy nagyítani kell. */
      if (!eleg) {
        if (bekapcsolt.length > 0) {
          setRetegAllapot((e) => {
            const uj = { ...e };
            bekapcsolt.forEach(([id]) => { uj[id] = { allapot: 'tavol' }; });
            return uj;
          });
          bekapcsolt.forEach(([id]) => { delete utolsoDoboz.current[id]; });
        }
        setUjraKell(false);
        return;
      }

      setUjraKell(
        bekapcsolt.some(([id]) => {
          const d = utolsoDoboz.current[id];
          return !d || !d.contains(h);
        }),
      );
    });

    vonalReteg.current = L.layerGroup().addTo(map);
    jelolesReteg.current = L.layerGroup().addTo(map);
    latvanyReteg.current = L.layerGroup();
    onKesz?.(map);

    return () => {
      map.remove();
      terkep.current = null;
      vonalReteg.current = null;
      jelolesReteg.current = null;
      latvanyReteg.current = null;
    };
    /* Szándékosan üres: a térkép nem születik újra minden propváltozásra. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* A kurzor jelzi, hogy a kattintás most csinál-e valamit. */
  useEffect(() => {
    if (doboz.current) doboz.current.dataset.mod = mod ?? 'nezet';
  }, [mod]);

  /* ---- Nyomvonal újrarajzolása ---- */
  useEffect(() => {
    const csoport = vonalReteg.current;
    if (!csoport) return;
    csoport.clearLayers();

    if (pontok.length > 1) {
      /* Két vonal egymáson: alul vastag világos „talp”, hogy a sötét
         erdőfoltokon is elváljon a térképtől. */
      L.polyline(pontok, { className: 'ut-talp', weight: 9 }).addTo(csoport);
      L.polyline(pontok, { className: 'ut-vonal', weight: 4 }).addTo(csoport);
    }

    /* Ha vannak horgonyok, azokra kerülnek a jelölők; különben magára a
       vonalra. Sűrű vonalnál (betöltött turistaút, megosztott link) csak a
       rajt és a cél kap jelölőt.

       Miért: a Leaflet minden jelölőt újrapozicionál a térkép minden
       mozdításakor. Kétszázötven húzható jelölő telefonon érezhetően
       akadozóvá teszi a pásztázást — mérve 266 jelölő és 761 DOM-elem.
       Cserébe alig veszítünk: egy routolt vonal 137. pontját amúgy sem
       értelmes külön arrébb húzni, azt a szolgáltatás rakta oda.

       A kézzel rajzolt útvonalak (néhány tucat pont) változatlanul
       teljesen szerkeszthetők. */
    const jelolendo = horgonyok ?? pontok;
    const suru = !horgonyok && pontok.length > 60;

    jelolendo.forEach(([lat, lng], i) => {
      const elso = i === 0;
      const utolso = i === jelolendo.length - 1 && jelolendo.length > 1;
      if (suru && !elso && !utolso) return;
      const meret = 16;
      const jel = L.marker([lat, lng], {
        draggable: Boolean(friss.current.mod),
        keyboard: false,
        icon: L.divIcon({
          className: '',
          html: `<span class="ut-pont${elso ? ' ut-pont--rajt' : ''}${
            utolso ? ' ut-pont--cel' : ''
          }"></span>`,
          iconSize: [meret, meret],
          iconAnchor: [meret / 2, meret / 2],
        }),
        title: elso ? 'Rajt' : utolso ? 'Cél' : `${i + 1}. pont`,
      }).addTo(csoport);

      jel.on('dragend', (e) => {
        const { lat: y, lng: x } = e.target.getLatLng();
        friss.current.onPontMozgat?.(i, [y, x]);
      });
      jel.on('contextmenu', (e) => {
        L.DomEvent.preventDefault(e);
        friss.current.onPontTorol?.(i);
      });

      /* Egyetlen kattintás törli a pontot — ezt kérte a felhasználó.
         A húzás nem vált ki kattintást, tehát az arrébb húzás nem töröl. */
      if (friss.current.mod) {
        jel.on('click', () => friss.current.onPontTorol?.(i));
      }
    });
  }, [pontok, horgonyok]);

  /* ---- Jelölések újrarajzolása ---- */
  useEffect(() => {
    const csoport = jelolesReteg.current;
    if (!csoport) return;
    csoport.clearLayers();

    jelolesek.forEach((j, i) => {
      const jel = L.marker([j.lat, j.lng], {
        draggable: Boolean(friss.current.mod),
        icon: L.divIcon({
          className: '',
          html: tuHtml(j.tipus),
          iconSize: [30, 38],
          iconAnchor: [15, 38],
          popupAnchor: [0, -34],
        }),
        title: j.cimke || '',
      }).addTo(csoport);

      if (j.cimke) jel.bindTooltip(j.cimke, { direction: 'top', offset: [0, -34] });

      jel.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        friss.current.onJelolesMozgat?.(i, { lat, lng });
      });
      jel.on('contextmenu', (e) => {
        L.DomEvent.preventDefault(e);
        friss.current.onJelolesTorol?.(i);
      });

      if (friss.current.mod) {
        jel.on('click', () => friss.current.onJelolesTorol?.(i));
      }
    });
  }, [jelolesek]);

  /* ---- Látványosságok ----
     A réteg egyszer épül fel, utána csak be- és kikapcsoljuk: tizenöt
     buborékot fölösleges újra összerakni minden váltásnál. */
  useEffect(() => {
    const csoport = latvanyReteg.current;
    const map = terkep.current;
    if (!csoport || !map) return;

    if (csoport.getLayers().length === 0) {
      for (const l of LATVANYOSSAGOK) {
        const jel = L.marker([l.lat, l.lng], {
          icon: L.divIcon({
            className: '',
            html: `<span class="latvany-jel" title="${htmlBiztos(l.nev)}">
                     <svg viewBox="0 0 24 24" aria-hidden="true">
                       <path d="M12 3 3 9v2h18V9zM5 13v6H3v2h18v-2h-2v-6h-2v6h-3v-6h-2v6H7v-6z"/>
                     </svg>
                   </span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
          keyboard: false,
          /* A nyomvonal fölé ne kerüljön: azt rajzolják, ezeket nézik. */
          zIndexOffset: -200,
        });

        jel.bindTooltip(
          `<figure class="latvany-buborek">
             <img src="${htmlBiztos(l.kep)}" alt="${htmlBiztos(l.nev)}" loading="lazy" width="92" height="92" />
             <figcaption>
               <strong>${htmlBiztos(l.nev)}</strong>
               <span>${htmlBiztos(l.tajegyseg)}</span>
               <small>${htmlBiztos(l.szerzo)} · ${htmlBiztos(l.licenc)}</small>
             </figcaption>
           </figure>`,
          { direction: 'top', offset: [0, -14], className: 'latvany-tipp', opacity: 1 },
        );

        jel.addTo(csoport);
      }
    }

    if (latvanyok) csoport.addTo(map);
    else csoport.remove();
  }, [latvanyok]);

  /* ---- Ellátás-rétegek: ivóvíz és megállók a látható területen ----

     Az Overpass közös, ingyenes szolgáltatás, ezért soha nem kérdez magától:
     csak a gomb bekapcsolására, illetve ha a felhasználó kifejezetten új
     keresést kér az elpásztázott területre. */
  const retegetKer = async (id) => {
    const map = terkep.current;
    if (!map) return;
    if (map.getZoom() < MIN_ZOOM) {
      setRetegAllapot((e) => ({ ...e, [id]: { allapot: 'tavol' } }));
      return;
    }
    setRetegAllapot((e) => ({ ...e, [id]: { allapot: 'keres' } }));
    const h = map.getBounds();
    try {
      const t = await teruleten(
        { del: h.getSouth(), nyugat: h.getWest(), eszak: h.getNorth(), kelet: h.getEast() },
        id,
      );
      utolsoDoboz.current[id] = h;
      setUjraKell(false);
      setRetegAllapot((e) => ({
        ...e,
        [id]: { allapot: 'kesz', db: t.osszesen, levagva: t.levagva, lista: t.lista },
      }));
    } catch (err) {
      setRetegAllapot((e) => ({ ...e, [id]: { allapot: 'hiba', uzenet: err.message } }));
    }
  };

  /* A vászonra rajzolás: minden bekapcsolt réteg pontjai egy csoportban. */
  useEffect(() => {
    const csoport = ellatasReteg.current;
    if (!csoport) return;
    csoport.clearLayers();

    Object.entries(retegek).forEach(([id, be]) => {
      if (!be) return;
      const allapot = retegAllapot[id];
      if (allapot?.allapot !== 'kesz') return;
      const { szin, sugar, tomor } = RETEGEK[id];

      allapot.lista.forEach((x) => {
        /* Három szín, két változat. A tömör és az üreges kör nem szín,
           hanem forma — színtévesztéssel is elválik, márpedig hat színt
           megkülönböztethetően nem lehetett kiosztani. */
        const kor = L.circleMarker([x.lat, x.lng], {
          renderer: vaszon.current,
          radius: sugar,
          weight: tomor ? 2 : 3,
          color: tomor ? '#fff' : szin,
          fillColor: tomor ? szin : '#fff',
          fillOpacity: 1,
        });
        /* Az ivhatóságot itt is ki kell mondani: a forrás lehet kiszáradva
           vagy nem ivóvízminőségű. */
        const jeloles =
          x.ivasra === true
            ? 'iható'
            : x.ivasra === false
              ? 'NEM iható'
              : x.tipus === 'forras'
                ? 'nincs adat róla, hogy iható-e'
                : x.fajta;
        kor.bindTooltip(`<strong>${htmlBiztos(x.nev)}</strong><br>${htmlBiztos(jeloles)}`, {
          direction: 'top',
          className: 'pont-tipp',
        });
        kor.addTo(csoport);
      });
    });
  }, [retegek, retegAllapot]);

  /* ---- Ráközelítés kérésre ---- */
  useEffect(() => {
    if (!illeszt || !terkep.current) return;
    const osszes = [...pontok.map(([lat, lng]) => [lat, lng]), ...jelolesek.map((j) => [j.lat, j.lng])];
    if (osszes.length === 0) return;
    terkep.current.fitBounds(L.latLngBounds(osszes), { padding: [56, 56], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [illeszt]);

  if (!retegGombok) return <div className="terkep" ref={doboz} />;

  /* A rács ikonjai mellé nem fér felirat, ezért a nevet a `title` és egy
     képernyőolvasónak szánt szöveg hordozza, az állapotot pedig a rács alatti
     sor — ott van hely arra, hogy „keresem…” vagy „nagyíts rá” kiférjen. */
  const allapotSzava = (id) => {
    const a = retegAllapot[id]?.allapot;
    return a === 'keres' ? 'keresem…'
      : a === 'kesz' ? String(retegAllapot[id].db)
        : a === 'tavol' ? 'nagyíts rá'
          : a === 'hiba' ? 'nem sikerült'
            : null;
  };

  const gomb = (id) => {
    const be = retegek[id];
    const { nev, gombSzin, tomor } = RETEGEK[id];
    const szo = be ? allapotSzava(id) : null;
    const keres = be && retegAllapot[id]?.allapot === 'keres';
    /* Ha a területen több van, mint amennyit lekértünk, azt tudni kell:
       üres térképből nem szabad arra következtetni, hogy nincs is víz.
       Felirat helyett egy pont az ikon sarkán, a mondat a címkében. */
    const tobbVan = be && retegAllapot[id]?.levagva > 0;
    const cimke = [nev, szo, tobbVan ? 'ennél több van itt — nagyíts rá' : null]
      .filter(Boolean)
      .join(' — ');
    return (
      <button
        key={id}
        className={`reteg-gomb${be ? ' reteg-gomb--aktiv' : ''}${tomor ? '' : ' reteg-gomb--ureges'}`
          + (keres ? ' reteg-gomb--keres' : '') + (tobbVan ? ' reteg-gomb--tobb' : '')}
        style={{ '--tu-szin': gombSzin }}
        aria-pressed={be}
        title={cimke}
        onClick={() => {
          const kovetkezo = !be;
          setRetegek((e) => ({ ...e, [id]: kovetkezo }));
          const allapot = retegAllapot[id]?.allapot ?? null;
          if (kovetkezo && (allapot === null || allapot === 'tavol' || allapot === 'hiba')) {
            retegetKer(id);
          }
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: tipusSzerint(RETEGEK[id].tipus).rajz }} />
        <span className="csak-olvasonak">{cimke}</span>
      </button>
    );
  };

  const vanBekapcsolt = Object.values(retegek).some(Boolean);
  const eppKeres = Object.entries(retegek).some(
    ([id, be]) => be && retegAllapot[id]?.allapot === 'keres',
  );
  /* Vissza kell kérdezni, ha elpásztáztak, vagy ha a küszöb alól nagyítottak
     föl és ezért nincs adatunk. Keresés közben viszont nem — akkor épp
     azt csináljuk, amit a gomb kínál. */
  const keresesKell =
    vanBekapcsolt &&
    zoomOk &&
    !eppKeres &&
    (ujraKell ||
      Object.entries(retegek).some(([id, be]) => be && retegAllapot[id]?.allapot !== 'kesz'));
  return (
    <>
      <div className="terkep" ref={doboz} />

      {/* A rétegikonok a fejléc sávjába kerülnek — a térképen semmi nem
          lebeg fölöttük. Az állapotuk (keresem, nagyíts rá, ennél több van
          itt) magukra az ikonokra költözött: a keresés lüktet, a levágott
          réteg pontot kap, a mondat pedig a címkében van.

          A „keresés ezen a területen” megmaradt gombnak, mert az nem
          állapot, hanem teendő — csak ikonná fogyott. */}
      <FejlecEszkozok>
        <div className="eszkozsor eszkozsor--retegek" role="group" aria-label="Mit mutasson a térkép">
          {Object.keys(RETEGEK).map(gomb)}

          {keresesKell && (
            <button
              className="reteg-gomb reteg-gomb--ujra"
              onClick={() => Object.entries(retegek).forEach(([id, be]) => be && retegetKer(id))}
              title="Keresés ezen a területen"
              aria-label="Keresés ezen a területen"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-2.34-5.66" />
                <path d="M20 4v4.5h-4.5" />
              </svg>
            </button>
          )}
        </div>
      </FejlecEszkozok>
    </>
  );
}
