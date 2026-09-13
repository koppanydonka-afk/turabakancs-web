/* A bakancs-kurzor.

   A tervezőn eddig a böngésző gyári keresztje állt a térkép fölött. Ez
   pontos, de semmit nem mond arról, hogy mit csinálsz vele. Az oldal
   neve Túrabakancs — a kurzor legyen bakancs, ami odalép, ahová a
   következő pont kerül.

   A PONTOSSÁG NEM VESZHET EL: a bakancs önmagában nem mutat pontos
   helyet, ezért a talp orra alatt ott a fogópont, egy apró narancs
   koronggal jelölve. A kurzor „töve” pontosan ott van, ahová kattintasz
   — a kép fölé és jobbra nyúlik, mint egy odatett láb.

   MIÉRT KÉT MÉRET: a böngésző a kurzort a kép saját méretében
   rajzolja ki, tehát egy 32 képpontos rajz retinán 32 ESZKÖZ-képpontra
   kerül, és elmosódik. Az `image-set` a kétszeres változatot adja
   ilyenkor. Ahol az `image-set` nem megy, ott az alatta lévő, egyszerű
   `url()` marad érvényben; ahol az sem, ott a kereszt. */

const VISZONT = '#F4F2ED';   // fűzővonalak
const TEST = '#2F5D3A';      // szár és lábfej — ugyanaz a zöld, mint a gombokon
const TALP = '#9B6B15';      // talp — a védjegy célpontjának sárgája
const FOGOPONT = '#D94F1E';  // a megrajzolt vonal színe

const FELSO =
  'M3.2 22.6 C3.2 20.4 3.4 19 4.4 18.2 C6.4 17 10.4 16.6 15.4 15.8 '
  + 'C16.6 14.4 17.4 11.6 17.6 7.6 C17.6 6.7 18.2 6.2 19.1 6.2 L26.4 6.2 '
  + 'C27.3 6.2 27.9 6.8 27.9 7.7 L28.6 22.6 Z';
const TALP_UT =
  'M3.6 21.8 L28.8 21.8 C29.6 21.8 30 22.3 30 23.1 L30 25.6 '
  + 'C30 26.5 29.5 27 28.6 27 L3.2 27 C2.4 27 1.9 26.5 1.9 25.6 L1.9 24 '
  + 'C1.9 22.6 2.5 21.8 3.6 21.8 Z';

/* A fehér kontúr nem díszítés: enélkül a sötét zöld bakancs eltűnne az
   erdőfoltokon, a világos talp pedig a mezőkön. */
const rajz = (meret) => `<svg xmlns="http://www.w3.org/2000/svg" width="${meret}" height="${meret}" viewBox="0 0 32 32">
<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="${FELSO}"/><path d="${TALP_UT}"/></g>
<path d="${FELSO}" fill="${TEST}"/><path d="${TALP_UT}" fill="${TALP}"/>
<g stroke="${VISZONT}" stroke-width="1.35" stroke-linecap="round" opacity=".92"><path d="M20 9.6h6"/><path d="M20 13h6.2"/></g>
<path d="M6.4 19.4C8.6 18.4 11.4 18 14.4 17.4" fill="none" stroke="${VISZONT}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
<circle cx="2.1" cy="26.6" r="2.4" fill="#fff"/><circle cx="2.1" cy="26.6" r="1.15" fill="${FOGOPONT}"/></svg>`;

const cim = (meret) => `url("data:image/svg+xml,${encodeURIComponent(rajz(meret))}")`;

/* A fogópont a talp orra: 2 képpont jobbra, 27 lefelé. */
const FOGO = '2 27';

/* Két értéket adunk vissza: a böngésző az elsőt beállítja, a másodikat
   pedig csak akkor, ha érti — így nem kell a képességeit kérdezgetni. */
export const BAKANCS_KURZOR = [
  `${cim(32)} ${FOGO}, crosshair`,
  `image-set(${cim(32)} 1x, ${cim(64)} 2x) ${FOGO}, crosshair`,
];
