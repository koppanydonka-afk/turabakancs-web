import { useEffect, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibre, Marker, NavigationControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MIN_ZOOM, RETEGEK, tartalmazza, teruleten } from '../data/szolgaltatasok.js';
import { tipusSzerint, tuHtml } from '../data/jelolesek.js';
import { helyiKep } from '../data/latvanyossagok.js';
import { latvanyKepe } from '../data/kepek.js';
import { nyelv, sz } from '../nyelv/index.js';
import { useSotet } from '../data/tema.js';
import EszkozRudba from './EszkozRudba.jsx';
import { KEZDO_KOZEP, KEZDO_ZOOM } from '../data/terkepAlap.js';

/* A térkép.

   MapLibre GL + OpenFreeMap vektorcsempék. Se API-kulcs, se bankkártya —
   ugyanaz a feltétel, mint eddig; ami változott, az a csempe fajtája.

   MIÉRT LETT VEKTOROS. A raszteres csempe kész kép: ami rá van égetve, azt
   kapod. A vektoros csempe adat, a rajzolás a böngészőben történik, és ez
   három dolgot old meg, amit képpel nem lehetett:

   1. A feliratok a látogató nyelvén jelennek meg. A csempékben ott van a
      `name:hu`, `name:sk`, `name:ro` … mind a kilencé, amin az oldal
      beszél. Eddig a térkép mindenkinek helyi nyelven szólt.
   2. A sötét mód igazi sötét térkép, nem a világos csempe letompítva.
      Eddig szűrővel halványítottuk a képet — tisztességes hegymenet volt,
      de látszott rajta.
   3. Nagyítás közben nem mosódik el, és a feliratok a nagyítás minden
      köztes állapotában élesek.

   Cserébe a könyvtár nagyobb (kb. 200 kB a Leaflet 40-e helyett) és WebGL
   kell hozzá. Ezért érkezik külön darabban (TerkepKesobb.jsx): akinek nem
   kell térkép, az le sem tölti.

   A KÖTELEZŐ FORRÁSMEGJELÖLÉS a csempeleírásból jön, és a MapLibre magától
   kirakja: „OpenFreeMap © OpenMapTiles Data from OpenStreetMap”. Ezt sem
   elhagyni, sem olvashatatlanra kicsinyíteni nem szabad — ez a licenc
   feltétele, nem díszítés.

   Ugyanez a komponens szolgál szerkesztésre és puszta nézegetésre: ha nincs
   `mod`, akkor a kattintás nem csinál semmit. */

/* A buborék tartalma a saját adatfájlunkból jön, de a szerzőneveket a
   Commonsról vettük át — ezért itt is megszűrjük, mielőtt HTML-be tesszük. */
const htmlBiztos = (szoveg) =>
  String(szoveg ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const STILUS = {
  vilagos: 'https://tiles.openfreemap.org/styles/liberty',
  sotet: 'https://tiles.openfreemap.org/styles/dark',
};

const URES = { type: 'FeatureCollection', features: [] };

/* A vonal színét a stíluslap tartja (világos és sötét módban más), a
   MapLibre viszont kész értéket vár — itt olvassuk ki. */
const szinValtozo = (nev, tartalek) => {
  if (typeof window === 'undefined') return tartalek;
  const ertek = getComputedStyle(document.documentElement).getPropertyValue(nev).trim();
  return ertek || tartalek;
};


export default function Terkep({
  pontok = [],
  /* A felhasználó által kattintott pontok. Ha meg van adva, a jelölők
     EZEKRE kerülnek — a `pontok` ilyenkor már a szolgáltatástól kapott,
     sűrű vonal, amit nem értelmes pontonként fogdosni. */
  horgonyok = null,
  jelolesek = [],
  /* Ellátás-rétegek gombjai a térkép bal szélén (ivóvíz, megálló).
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
  const buborek = useRef(null);
  /* Melyik ellátás-pont van épp a buborékban — enélkül minden egérmozdulat
     újraírná a buborékot, és a kép is újra elindulna. */
  const buborekKulcs = useRef(null);
  const kepek = useRef(new Map());
  const utHorgonyok = useRef([]);
  const jelolesJelolok = useRef([]);
  const rajzKeret = useRef(0);
  /* Melyik területre kérdeztünk le utoljára rétegenként — ebből tudjuk, hogy
     az elpásztázott térképhez kell-e új keresés. */
  const utolsoDoboz = useRef({});

  const [retegek, setRetegek] = useState({ viz: false, kozlekedes: false });
  const [retegAllapot, setRetegAllapot] = useState({});
  const [ujraKell, setUjraKell] = useState(false);
  const [zoomOk, setZoomOk] = useState(true);
  /* Nő, valahányszor új stíluslap töltődött be (indulás, témaváltás). A
     rajzoló hatások ebből tudják, hogy a saját forrásaikat újra fel kell
     tenni: a `setStyle` mindent letöröl, ami a miénk. */
  const [stilusJel, setStilusJel] = useState(0);

  const sotet = useSotet();

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

  /* ---- Kurzor ----
     A MapLibre a vásznon tartja a kurzort, ezért CSS-ből nem lehet
     átírni: onnan kell, ahol ő is állítja. */
  const alapKurzor = () => (friss.current.mod ? 'crosshair' : '');
  const kurzor = (ertek) => {
    const m = terkep.current;
    if (m) m.getCanvas().style.cursor = ertek;
  };

  /* ---- Kép a látványosság buborékjába ----

     A sorrend: előbb a tizenöt helyben tárolt magyar kép (az már itt van),
     utána a Wikidata. Szerző nélküli képet nem teszünk ki, mert a
     megjelölés a licenc feltétele — ilyenkor marad a puszta név. */
  const kepetKer = (t, kesz) => {
    const kulcs = `${t.lat},${t.lng}`;
    if (kepek.current.has(kulcs)) {
      const tarolt = kepek.current.get(kulcs);
      if (tarolt) kesz(tarolt);
      return;
    }
    const sajat = helyiKep(t.lat, t.lng);
    if (sajat) {
      kepek.current.set(kulcs, sajat);
      kesz(sajat);
      return;
    }
    if (!t.wikidata) {
      kepek.current.set(kulcs, null);
      return;
    }
    latvanyKepe(t.wikidata).then((adat) => {
      kepek.current.set(kulcs, adat?.kep ? adat : null);
      if (adat?.kep) kesz(adat);
    });
  };

  const kepesBuborek = (t, adat) => `
    <figure class="latvany-buborek">
      <img src="${htmlBiztos(adat.kep)}" alt="${htmlBiztos(t.nev)}" loading="lazy" width="92" height="92" />
      <figcaption>
        <strong>${htmlBiztos(t.nev)}</strong>
        <span>${htmlBiztos(t.fajta)}</span>
        <small>${htmlBiztos(adat.szerzo)} · ${htmlBiztos(adat.licenc)}</small>
      </figcaption>
    </figure>`;

  /* Ellátás-pont buborékja. Látványosságnál a képet ODAMUTATÁSKOR kérjük
     el, nem előre: amíg nem érdekel, a böngésződ egyetlen képet sem tölt
     le. Ha a hely benne van a tizenöt helyben tároltban, még kérdezni sem
     kell. */
  const pontBuborek = (jellemzo) => {
    const m = terkep.current;
    const p = buborek.current;
    if (!m || !p) return;
    const t = jellemzo.properties;
    const kulcs = `${t.lat},${t.lng}`;
    if (buborekKulcs.current === kulcs && p.isOpen()) return;
    buborekKulcs.current = kulcs;

    const latnivalo = t.tipus === 'latnivalo';
    p.setLngLat(jellemzo.geometry.coordinates);
    p.setHTML(`<strong>${htmlBiztos(t.nev)}</strong><br>${htmlBiztos(t.jeloles)}`);
    p.addTo(m);
    /* Az osztály CSAK a felrakás után fog: addig a buboréknak nincs is
       doboza, amire rá lehetne tenni — az `addClassName` ilyenkor némán
       nem csinál semmit. */
    p.removeClassName(latnivalo ? 'pont-tipp' : 'latvany-tipp');
    p.addClassName(latnivalo ? 'latvany-tipp' : 'pont-tipp');

    if (latnivalo) {
      kepetKer(t, (adat) => {
        /* Mire a kép megjött, már máshol járhat az egér. */
        if (buborekKulcs.current === kulcs && p.isOpen()) p.setHTML(kepesBuborek(t, adat));
      });
    }
  };

  const buborekotZar = () => {
    buborekKulcs.current = null;
    buborek.current?.remove();
  };

  /* Ujjnyi tűrés: a korongok 5–9 képpontosak, pontosan rájuk koppintani
     telefonon nem reális. */
  const pontTalalat = (m, kepernyoPont) => {
    if (!m.getLayer('ellatas-kor')) return null;
    const d = 8;
    const talalt = m.queryRenderedFeatures(
      [
        [kepernyoPont.x - d, kepernyoPont.y - d],
        [kepernyoPont.x + d, kepernyoPont.y + d],
      ],
      { layers: ['ellatas-kor'] },
    );
    return talalt[0] ?? null;
  };

  /* ---- A saját rétegeink felrakása ----

     Nem csak induláskor kell: a `setStyle` (témaváltás) letörli az egész
     stíluslapot, és vele mindent, amit mi tettünk rá. Ezért ez a függvény
     minden `style.load` után lefut. */
  const alapokFeltesz = (m) => {
    const nyom = szinValtozo('--nyom', '#D94F1E');
    const talp = szinValtozo('--nyom-talp', '#FFFFFF');

    /* Az ellátás-pontok a vonal ALÁ kerülnek: a vonal a látogató munkája,
       a pontok a környezet. */
    m.addSource('ellatas', { type: 'geojson', data: URES });
    m.addLayer({
      id: 'ellatas-kor',
      type: 'circle',
      source: 'ellatas',
      paint: {
        /* Három szín, két változat. A tömör és az üreges kör nem szín,
           hanem forma — színtévesztéssel is elválik, márpedig hat színt
           megkülönböztethetően nem lehetett kiosztani. */
        'circle-radius': ['get', 'sugar'],
        'circle-color': ['get', 'toltes'],
        'circle-stroke-color': ['get', 'keret'],
        'circle-stroke-width': ['get', 'keretVastag'],
      },
    });
    /* A látványosság a hetedik réteg, a hat szín-forma páros viszont
       elfogyott. Ez ezért MÉRETBEN és formában válik el: nagyobb korong,
       közepén világos maggal — színtévesztéssel is más. */
    m.addLayer({
      id: 'ellatas-mag',
      type: 'circle',
      source: 'ellatas',
      filter: ['==', ['get', 'magos'], true],
      paint: { 'circle-radius': ['get', 'magSugar'], 'circle-color': '#fff' },
    });

    /* `lineMetrics`: enélkül nincs `line-progress`, és nem lehet
       megrajzoltatni a vonalat a nézetoldalakon. */
    m.addSource('ut', { type: 'geojson', lineMetrics: true, data: URES });
    /* Két vonal egymáson: alul vastag világos „talp”, hogy a sötét
       erdőfoltokon is elváljon a térképtől. */
    m.addLayer({
      id: 'ut-talp',
      type: 'line',
      source: 'ut',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': talp, 'line-width': 9, 'line-opacity': 0.85 },
    });
    m.addLayer({
      id: 'ut-vonal',
      type: 'line',
      source: 'ut',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': nyom, 'line-width': 4 },
    });

    feliratokNyelve(m);
  };

  /* A csempékben mind a kilenc nyelv neve benne van. A stíluslap alapból
     latin betűs helyi nevet ír; itt átírjuk arra, amin az oldal beszél.
     Ha egy helynek nincs neve az adott nyelven, marad a helyi. */
  const feliratokNyelve = (m) => {
    const kod = nyelv();
    const kifejezes = ['coalesce', ['get', `name:${kod}`], ['get', 'name:latin'], ['get', 'name']];
    m.getStyle().layers.forEach((r) => {
      const felirat = r.type === 'symbol' ? r.layout?.['text-field'] : null;
      if (!felirat) return;
      /* CSAK a NEVET írjuk át. Az útszámtáblák felirata az útszám
         (`ref`), nem név: ha azt is lecserélnénk, üres pajzsok
         maradnának az autópályák mentén — ez elsőre meg is történt. */
      if (!JSON.stringify(felirat).includes('"name')) return;
      try {
        m.setLayoutProperty(r.id, 'text-field', kifejezes);
      } catch {
        /* Ha egy réteg nem fogadja, az nem ér semmit — marad az eredeti. */
      }
    });
  };

  useEffect(() => {
    if (terkep.current || !doboz.current) return undefined;

    const m = new MapLibre({
      container: doboz.current,
      style: sotet ? STILUS.sotet : STILUS.vilagos,
      /* A MapLibre hosszúság–szélesség sorrendet vár, fordítva, mint a
         Leaflet és mint az egész projekt többi része. */
      center: [KEZDO_KOZEP[1], KEZDO_KOZEP[0]],
      zoom: KEZDO_ZOOM,
      maxZoom: 19,
      /* Alapból csak a szolgáltatók nevét mutatja, kinyitható gombbal.
         A forrásmegjelölés licencfeltétel: legyen kint, ne egy gomb
         mögött. */
      attributionControl: { compact: false },
    });

    /* A bal felső sarok a módváltóé és a paletta-soré, ezért a
       nagyítógombok a másik oldalra kerülnek. Az iránytű is kell: a
       vektoros térkép elforgatható, és kell egy út vissza északra. */
    m.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');

    buborek.current = new Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '340px',
      offset: 12,
    });

    m.on('style.load', () => {
      alapokFeltesz(m);
      setStilusJel((n) => n + 1);
    });

    m.on('click', (esemeny) => {
      /* Előbb a rétegpontok: ha ellátás-pontra koppintottak, az a
         buborékot nyitja, nem új útpontot tesz le. */
      const talalt = pontTalalat(m, esemeny.point);
      if (talalt) {
        pontBuborek(talalt);
        return;
      }
      buborekotZar();
      const { mod: md, onPontHozzaad: pont, onJelolesHozzaad: jel, ujTipus: tipus } = friss.current;
      const { lat, lng } = esemeny.lngLat;
      if (md === 'ut') pont?.([lat, lng]);
      if (md === 'jeloles') jel?.({ lat, lng, tipus });
    });

    /* Odamutatásra buborék. `mousemove` és nem `mouseenter`: két egymás
       melletti korong között az egér ki sem lép a rétegből, tehát a
       `mouseenter` nem szólna újra. */
    m.on('mousemove', 'ellatas-kor', (esemeny) => {
      kurzor('pointer');
      if (esemeny.features?.[0]) pontBuborek(esemeny.features[0]);
    });
    m.on('mouseleave', 'ellatas-kor', () => {
      kurzor(alapKurzor());
      buborekotZar();
    });

    m.on('moveend', () => {
      const z = m.getZoom();
      const eleg = z >= MIN_ZOOM;
      setZoomOk(eleg);
      const h = m.getBounds();
      const hatarok = { del: h.getSouth(), nyugat: h.getWest(), eszak: h.getNorth(), kelet: h.getEast() };
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
          return !d || !tartalmazza(d, hatarok);
        }),
      );
    });

    m.on('load', () => onKesz?.(m));

    terkep.current = m;

    return () => {
      cancelAnimationFrame(rajzKeret.current);
      utHorgonyok.current.forEach((j) => j.remove());
      utHorgonyok.current = [];
      jelolesJelolok.current.forEach((j) => j.remove());
      jelolesJelolok.current = [];
      m.remove();
      terkep.current = null;
      buborek.current = null;
    };
    /* Szándékosan üres: a térkép nem születik újra minden propváltozásra.
       A `sotet` csak a kezdőstílust választja ki, a váltást a lenti hatás
       intézi. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Témaváltás: másik stíluslap ----
     Nem szűrő a kész képen, hanem igazi sötét térkép. */
  useEffect(() => {
    const m = terkep.current;
    if (!m) return;
    const kell = sotet ? STILUS.sotet : STILUS.vilagos;
    if (m.__stilus === kell) return;
    m.__stilus = kell;
    m.setStyle(kell);
  }, [sotet]);

  /* A kurzor jelzi, hogy a kattintás most csinál-e valamit. */
  useEffect(() => {
    if (doboz.current) doboz.current.dataset.mod = mod ?? 'nezet';
    kurzor(mod ? 'crosshair' : '');
  }, [mod]);

  /* ---- Nyomvonal újrarajzolása ---- */
  useEffect(() => {
    const m = terkep.current;
    if (!m || !m.getSource('ut')) return;

    m.getSource('ut').setData(
      pontok.length > 1
        ? {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: pontok.map(([lat, lng]) => [lng, lat]) },
          }
        : URES,
    );

    /* A vonal megrajzolása — csak nézetben.

       Raszteres térképen ez SVG `stroke-dashoffset` volt, CSS-ből. A
       vektoros vonalat a videokártya rajzolja, oda nem ér el a CSS: a
       `line-gradient` az, ami megfelel neki. A színátmenet vágópontját
       toljuk 0-tól 1-ig, a mögötte lévő rész átlátszó. */
    cancelAnimationFrame(rajzKeret.current);
    const nyom = szinValtozo('--nyom', '#D94F1E');
    const talp = szinValtozo('--nyom-talp', '#FFFFFF');
    const teljes = (szin) => ['interpolate', ['linear'], ['line-progress'], 0, szin, 1, szin];

    const keves =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (friss.current.mod || pontok.length < 2 || keves) {
      m.setPaintProperty('ut-talp', 'line-gradient', teljes(talp));
      m.setPaintProperty('ut-vonal', 'line-gradient', teljes(nyom));
    } else {
      const HOSSZ = 1100;
      const indul = performance.now();
      const lepes = (most) => {
        const arany = Math.min(1, (most - indul) / HOSSZ);
        /* Lágy kifutás, ugyanaz a görbe, ami a CSS-ben volt. */
        const t = Math.max(0.0005, 1 - (1 - arany) ** 3);
        if (!terkep.current?.getLayer('ut-vonal')) return;
        const atmenet = (szin) =>
          t >= 1
            ? teljes(szin)
            : [
                'interpolate', ['linear'], ['line-progress'],
                0, szin,
                t, szin,
                Math.min(1, t + 0.0004), 'rgba(0,0,0,0)',
                1, 'rgba(0,0,0,0)',
              ];
        m.setPaintProperty('ut-talp', 'line-gradient', atmenet(talp));
        m.setPaintProperty('ut-vonal', 'line-gradient', atmenet(nyom));
        if (arany < 1) rajzKeret.current = requestAnimationFrame(lepes);
      };
      rajzKeret.current = requestAnimationFrame(lepes);
    }
  }, [pontok, stilusJel]);

  /* ---- Horgonyok: a húzható pontok a vonalon ---- */
  useEffect(() => {
    const m = terkep.current;
    if (!m) return undefined;

    /* Ha vannak horgonyok, azokra kerülnek a jelölők; különben magára a
       vonalra. Sűrű vonalnál (betöltött turistaút, megosztott link) csak a
       rajt és a cél kap jelölőt.

       Miért: minden jelölő DOM-elem, amit a térkép minden mozdításakor újra
       kell pozicionálni. Kétszázötven húzható jelölő telefonon érezhetően
       akadozóvá teszi a pásztázást — mérve 266 jelölő és 761 DOM-elem.
       Cserébe alig veszítünk: egy routolt vonal 137. pontját amúgy sem
       értelmes külön arrébb húzni, azt a szolgáltatás rakta oda.

       A kézzel rajzolt útvonalak (néhány tucat pont) változatlanul
       teljesen szerkeszthetők. */
    const jelolendo = horgonyok ?? pontok;
    const suru = !horgonyok && pontok.length > 60;
    const szerkeszt = Boolean(friss.current.mod);

    jelolendo.forEach(([lat, lng], i) => {
      const elso = i === 0;
      const utolso = i === jelolendo.length - 1 && jelolendo.length > 1;
      if (suru && !elso && !utolso) return;

      const elem = document.createElement('span');
      elem.className = `ut-pont${elso ? ' ut-pont--rajt' : ''}${utolso ? ' ut-pont--cel' : ''}`;
      elem.title = elso ? sz('terkep.rajt') : utolso ? sz('terkep.cel') : sz('terkep.hanyadikPont', { n: i + 1 });

      const jel = new Marker({ element: elem, draggable: szerkeszt })
        .setLngLat([lng, lat])
        .addTo(m);

      /* A húzás végén a böngésző kattintást is küld. Enélkül az arrébb
         húzott pont rögtön törlődne. */
      let mozgott = false;
      jel.on('dragstart', () => { mozgott = false; });
      jel.on('drag', () => { mozgott = true; });
      jel.on('dragend', () => {
        const { lat: y, lng: x } = jel.getLngLat();
        friss.current.onPontMozgat?.(i, [y, x]);
      });

      /* Egyetlen kattintás törli a pontot — ezt kérte a felhasználó. */
      elem.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mozgott) { mozgott = false; return; }
        if (friss.current.mod) friss.current.onPontTorol?.(i);
      });
      elem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        friss.current.onPontTorol?.(i);
      });

      utHorgonyok.current.push(jel);
    });

    return () => {
      utHorgonyok.current.forEach((j) => j.remove());
      utHorgonyok.current = [];
    };
  }, [pontok, horgonyok, mod]);

  /* ---- Jelölések újrarajzolása ---- */
  useEffect(() => {
    const m = terkep.current;
    if (!m) return undefined;

    jelolesek.forEach((j, i) => {
      const elem = document.createElement('div');
      elem.className = 'tu-doboz';
      elem.innerHTML = tuHtml(j.tipus);
      if (j.cimke) elem.title = j.cimke;

      const jel = new Marker({
        element: elem,
        anchor: 'bottom',
        draggable: Boolean(friss.current.mod),
      })
        .setLngLat([j.lng, j.lat])
        .addTo(m);

      if (j.cimke) {
        jel.setPopup(
          new Popup({ closeButton: false, className: 'pont-tipp', offset: 24 })
            .setHTML(`<strong>${htmlBiztos(j.cimke)}</strong>`),
        );
        elem.addEventListener('mouseenter', () => jel.getPopup().addTo(m));
        elem.addEventListener('mouseleave', () => jel.getPopup().remove());
      }

      let mozgott = false;
      jel.on('dragstart', () => { mozgott = false; });
      jel.on('drag', () => { mozgott = true; });
      jel.on('dragend', () => {
        const { lat, lng } = jel.getLngLat();
        friss.current.onJelolesMozgat?.(i, { lat, lng });
      });

      elem.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mozgott) { mozgott = false; return; }
        if (friss.current.mod) friss.current.onJelolesTorol?.(i);
      });
      elem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        friss.current.onJelolesTorol?.(i);
      });

      jelolesJelolok.current.push(jel);
    });

    return () => {
      jelolesJelolok.current.forEach((j) => j.remove());
      jelolesJelolok.current = [];
    };
  }, [jelolesek, mod]);

  /* Itt épült fel korábban a tizenöt magyar látványosság, mindig
     bekapcsolva, letöltött képekkel. Réteg lett belőle (`latvany`), és
     ezzel a világ bármelyik országában működik — a rajzolását a lenti
     körréteg intézi, a képét pedig a kepek.js, kérésre. */

  /* ---- Ellátás-rétegek: ivóvíz és megállók a látható területen ----

     Az Overpass közös, ingyenes szolgáltatás, ezért soha nem kérdez magától:
     csak a gomb bekapcsolására, illetve ha a felhasználó kifejezetten új
     keresést kér az elpásztázott területre. */
  const retegetKer = async (id) => {
    const m = terkep.current;
    if (!m) return;
    if (m.getZoom() < (RETEGEK[id].minZoom ?? MIN_ZOOM)) {
      setRetegAllapot((e) => ({ ...e, [id]: { allapot: 'tavol' } }));
      return;
    }
    setRetegAllapot((e) => ({ ...e, [id]: { allapot: 'keres' } }));
    const h = m.getBounds();
    const hatarok = { del: h.getSouth(), nyugat: h.getWest(), eszak: h.getNorth(), kelet: h.getEast() };
    try {
      const t = await teruleten(hatarok, id);
      utolsoDoboz.current[id] = hatarok;
      setUjraKell(false);
      setRetegAllapot((e) => ({
        ...e,
        [id]: { allapot: 'kesz', db: t.osszesen, levagva: t.levagva, lista: t.lista },
      }));
    } catch (err) {
      setRetegAllapot((e) => ({ ...e, [id]: { allapot: 'hiba', uzenet: err.message } }));
    }
  };

  /* ---- A bekapcsolt rétegek pontjai egyetlen forrásban ----

     Eddig minden pont külön rajzolt elem volt vásznon. Itt egyetlen
     GeoJSON-forrás van, és a videokártya rajzolja — négyszáz korong
     ugyanannyiba kerül, mint négy. */
  useEffect(() => {
    const m = terkep.current;
    if (!m || !m.getSource('ellatas')) return;

    const jellemzok = [];
    Object.entries(retegek).forEach(([id, be]) => {
      if (!be) return;
      const allapot = retegAllapot[id];
      if (allapot?.allapot !== 'kesz') return;
      const { szin, sugar, tomor, magos } = RETEGEK[id];

      allapot.lista.forEach((x) => {
        /* Az ivhatóságot itt is ki kell mondani: a forrás lehet kiszáradva
           vagy nem ivóvízminőségű. */
        const jeloles =
          x.ivasra === true
            ? sz('viz.ihato')
            : x.ivasra === false
              ? sz('viz.nemIhato')
              : x.tipus === 'forras'
                ? sz('viz.nincsAdat')
                : x.fajta;

        jellemzok.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [x.lng, x.lat] },
          properties: {
            nev: x.nev ?? '',
            fajta: x.fajta ?? '',
            jeloles,
            tipus: x.tipus ?? '',
            wikidata: x.wikidata ?? '',
            lat: x.lat,
            lng: x.lng,
            sugar,
            toltes: tomor ? szin : '#fff',
            keret: tomor ? '#fff' : szin,
            keretVastag: tomor ? 2 : 3,
            magos: Boolean(magos),
            magSugar: Math.max(2, sugar - 5),
          },
        });
      });
    });

    buborekotZar();
    m.getSource('ellatas').setData({ type: 'FeatureCollection', features: jellemzok });
  }, [retegek, retegAllapot, stilusJel]);

  /* ---- Ráközelítés kérésre ---- */
  useEffect(() => {
    const m = terkep.current;
    if (!illeszt || !m) return;
    const osszes = [...pontok.map(([lat, lng]) => [lng, lat]), ...jelolesek.map((j) => [j.lng, j.lat])];
    if (osszes.length === 0) return;
    const hatar = osszes.reduce(
      (h, [lng, lat]) => new LngLatBounds(h.getSouthWest(), h.getNorthEast()).extend([lng, lat]),
      new LngLatBounds(osszes[0], osszes[0]),
    );
    m.fitBounds(hatar, { padding: 56, maxZoom: 16, duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [illeszt]);

  if (!retegGombok) return <div className="terkep" ref={doboz} />;

  /* A rács ikonjai mellé nem fér felirat, ezért a nevet a `title` és egy
     képernyőolvasónak szánt szöveg hordozza, az állapotot pedig a rács alatti
     sor — ott van hely arra, hogy „keresem…” vagy „nagyíts rá” kiférjen. */
  const allapotSzava = (id) => {
    const a = retegAllapot[id]?.allapot;
    return a === 'keres' ? sz('terkep.keresem')
      : a === 'kesz' ? String(retegAllapot[id].db)
        : a === 'tavol' ? sz('terkep.nagyits')
          : a === 'hiba' ? sz('terkep.hiba')
            : null;
  };

  const gomb = (id) => {
    const be = retegek[id];
    const { nevKulcs, gombSzin, tomor } = RETEGEK[id];
    const nev = sz(nevKulcs);
    const szo = be ? allapotSzava(id) : null;
    const keres = be && retegAllapot[id]?.allapot === 'keres';
    /* Ha a területen több van, mint amennyit lekértünk, azt tudni kell:
       üres térképből nem szabad arra következtetni, hogy nincs is víz.
       Felirat helyett egy pont az ikon sarkán, a mondat a címkében. */
    const tobbVan = be && retegAllapot[id]?.levagva > 0;
    const cimke = [nev, szo, tobbVan ? sz('terkep.tobbVan') : null]
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

      {/* A rétegikonok a térkép bal szélén futó eszközrúdba kerülnek.
          Az állapotuk (keresem, nagyíts rá, ennél több van
          itt) magukra az ikonokra költözött: a keresés lüktet, a levágott
          réteg pontot kap, a mondat pedig a címkében van.

          A „keresés ezen a területen” megmaradt gombnak, mert az nem
          állapot, hanem teendő — csak ikonná fogyott. */}
      <EszkozRudba>
        <div className="eszkozsor" role="group" aria-label={sz('tervezo.retegek')}>
          {Object.keys(RETEGEK).map(gomb)}

          {keresesKell && (
            <button
              className="reteg-gomb reteg-gomb--ujra"
              onClick={() => Object.entries(retegek).forEach(([id, be]) => be && retegetKer(id))}
              title={sz('tervezo.ujraKeres')}
              aria-label={sz('tervezo.ujraKeres')}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-2.34-5.66" />
                <path d="M20 4v4.5h-4.5" />
              </svg>
            </button>
          )}
        </div>
      </EszkozRudba>
    </>
  );
}
