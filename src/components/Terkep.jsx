import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tuHtml } from '../data/jelolesek.js';
import { LATVANYOSSAGOK } from '../data/latvanyossagok.js';

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
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        'Térkép: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> közreműködői',
    }).addTo(map);

    map.on('click', (event) => {
      const { mod: m, onPontHozzaad: pont, onJelolesHozzaad: jel, ujTipus: tipus } = friss.current;
      if (m === 'ut') pont?.([event.latlng.lat, event.latlng.lng]);
      if (m === 'jeloles') jel?.({ lat: event.latlng.lat, lng: event.latlng.lng, tipus });
    });

    terkep.current = map;
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

  /* ---- Ráközelítés kérésre ---- */
  useEffect(() => {
    if (!illeszt || !terkep.current) return;
    const osszes = [...pontok.map(([lat, lng]) => [lat, lng]), ...jelolesek.map((j) => [j.lat, j.lng])];
    if (osszes.length === 0) return;
    terkep.current.fitBounds(L.latLngBounds(osszes), { padding: [56, 56], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [illeszt]);

  return <div className="terkep" ref={doboz} />;
}
