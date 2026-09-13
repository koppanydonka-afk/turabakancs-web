/* A világos térkép sötét változata.

   MIÉRT NEM KÉSZ SÖTÉT STÍLUSLAP: az OpenFreeMap kínál egyet, de az egy
   MÁSIK térkép — nem a világos sötét bőrben, hanem másik rajz, feleannyi
   réteggel. Ami elveszik vele: a háromdimenziós épületek (az egyetlen
   `fill-extrusion` réteg a világosban van), a POI-k egy része, az
   úttípusok felbontása. Aki sötét módra vált, nem másik térképet kért.

   Ezért itt a VILÁGOS stíluslapot festjük át. A rétegek, a szűrők, a
   nagyítási határok, a feliratok — minden marad; csak a színek cserélődnek.

   MIÉRT NEM SZÍNÁTALAKÍTÁS: a világosságot megfordítani kézenfekvő volna,
   de pont a térképen nem működik. Egy világos térképen az utak
   VILÁGOSABBAK a háttérnél (fehér út a bézs lapon), megfordítva viszont
   sötétebbek lennének nála — márpedig sötét térképen az utak a világosak.
   A szerepeket tehát nem átszámolni kell, hanem újraosztani; ezt csinálja
   az alábbi táblázat.

   Az átlátszóságot megtartjuk: a világos stíluslap néhány helyen a
   nagyítással halványítja a foltokat, és az továbbra is így viselkedik. */

/* A rétegazonosítók beszédesek (`road_motorway_casing`, `landcover_wood`),
   ezért név szerint osztunk szerepet. Az ELSŐ találat számít, tehát a
   szegélyek (`_casing`) a saját úttípusuk előtt állnak. */
const SZABALYOK = [
  [/^background$/, '#12150F'],

  /* Víz */
  [/^water$/, '#16202E'],
  [/^waterway/, '#1C2A3A'],

  /* Növényzet és felszín */
  [/^park_outline$/, '#1E2A20'],
  [/^park$/, '#18231A'],
  [/^landcover_wood$/, '#16211A'],
  [/^landcover_grass$/, '#1A251B'],
  [/^landcover_ice$/, '#1E2428'],
  [/^landcover_sand$/, '#242017'],
  [/^landcover_wetland$/, '#17231F'],
  [/^road_area_pattern$/, '#262A22'],
  [/^landuse_residential$/, '#181B16'],
  [/^landuse_hospital$/, '#231A1D'],
  [/^landuse_/, '#1A1E17'],

  /* Repülőtér */
  [/^aeroway_fill$/, '#1B1E19'],
  [/^aeroway_/, '#2B2F28'],

  /* Utak. A szegély sötétebb a saját útjánál: így a vonal a sötét lapon is
     elválik a környezetétől, ugyanúgy, ahogy világosban a világos út
     válik el a szürke szegélyétől — csak fordított előjellel. */
  [/(motorway|trunk|primary|secondary|tertiary|link).*casing/, '#2E2A1E'],
  [/(street|minor|service|track).*casing/, '#22251F'],
  [/(path|pedestrian).*casing/, '#1E211B'],
  [/motorway/, '#6B5232'],
  [/(trunk|primary|secondary|tertiary|_link)/, '#54452E'],
  [/(street|minor|service|track)/, '#31352D'],
  [/(path|pedestrian)/, '#3A3E35'],
  [/rail/, '#383D34'],

  /* Épületek. A háromdimenziós egy árnyalattal világosabb: a
     tetőfelületek így elválnak a földszinttől. */
  [/^building-3d$/, '#262C22'],
  [/^building$/, '#1D211B'],

  [/^boundary/, '#4C5347'],
];

/* A feliratok külön táblázatban: nekik két színük van, és az udvar
   (a betű körüli kontúr) mindig a lap színe — különben a szöveg
   elveszne a sötét foltokon. */
const UDVAR = '#0E110C';
const FELIRATOK = [
  [/water_name|waterway_line_label/, '#7C9CC4'],
  [/^poi_transit$/, '#7EA0C2'],
  [/^poi_/, '#939B88'],
  [/^highway-name/, '#8A9280'],
  [/^airport$/, '#939B88'],
  [/^label_(country|state)/, '#C3CAB6'],
  [/^label_/, '#D8DECF'],
];

/* Amire nincs szabály: a típusa dönt. Új réteg is értelmes színt kap. */
const ALAPERTELMEZETT = { fill: '#1A1D17', line: '#2C302A', symbol: '#A9B19C', 'fill-extrusion': '#262C22' };

const illeszt = (tabla, id) => tabla.find(([minta]) => minta.test(id))?.[1] ?? null;

/* Az eredeti szín átlátszóságát megtartjuk. A böngésző vászna bármilyen
   CSS-színt normalizál — így nem kell se hex-, se hsl-, se rgba-elemzőt
   írni. */
let vaszon = null;
function atlatszosag(szin) {
  if (typeof szin !== 'string') return 1;
  if (!vaszon) vaszon = document.createElement('canvas').getContext('2d');
  vaszon.fillStyle = '#000';
  vaszon.fillStyle = szin;
  const m = /rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(vaszon.fillStyle);
  return m ? Number(m[1]) : 1;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const szinE = (x) => typeof x === 'string' && (HEX.test(x) || /^(rgb|hsl)a?\(/i.test(x));

const rgba = (hex, alfa) => {
  const t = hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(t.slice(i, i + 2), 16));
  return alfa >= 1 ? hex : `rgba(${r},${g},${b},${alfa})`;
};

/* A szín lehet egyszerű érték vagy kifejezés (`interpolate`, `match`…).
   A kifejezés szerkezetét nem bántjuk, csak a benne ülő színeket
   cseréljük — így a nagyítás szerinti halványodás megmarad. */
function fesd(ertek, ujSzin) {
  if (szinE(ertek)) return rgba(ujSzin, atlatszosag(ertek));
  if (Array.isArray(ertek)) return ertek.map((x) => fesd(x, ujSzin));
  return ertek;
}

export function sotetreFest(stilus) {
  const uj = structuredClone(stilus);
  uj.layers = uj.layers.map((reteg) => {
    const festek = { ...(reteg.paint ?? {}) };

    if (reteg.type === 'symbol') {
      const szoveg = illeszt(FELIRATOK, reteg.id) ?? ALAPERTELMEZETT.symbol;
      if ('text-color' in festek) festek['text-color'] = fesd(festek['text-color'], szoveg);
      if ('text-halo-color' in festek) festek['text-halo-color'] = fesd(festek['text-halo-color'], UDVAR);
      return { ...reteg, paint: festek };
    }

    /* A domborzatárnyék kész kép, azt csak tompítani lehet. */
    if (reteg.type === 'raster') {
      return { ...reteg, paint: { ...festek, 'raster-brightness-max': 0.35, 'raster-saturation': -0.4 } };
    }

    const szin = illeszt(SZABALYOK, reteg.id) ?? ALAPERTELMEZETT[reteg.type];
    if (!szin) return reteg;

    /* A mintázat (sétálóutca sraffozása, láp) kész kép a jelkészletből:
       világos vonalkák, amiket nem lehet átszínezni. Sötét lapon
       vakítanak, ezért mintázat helyett sima foltot kapnak. */
    Object.keys(festek).forEach((kulcs) => {
      if (kulcs.endsWith('pattern')) delete festek[kulcs];
    });
    if (reteg.type === 'fill' && !('fill-color' in festek) && (reteg.paint ?? {})['fill-pattern']) {
      festek['fill-color'] = szin;
    }

    Object.keys(festek).forEach((kulcs) => {
      if (kulcs.endsWith('color')) festek[kulcs] = fesd(festek[kulcs], szin);
    });
    return { ...reteg, paint: festek };
  });
  return uj;
}
