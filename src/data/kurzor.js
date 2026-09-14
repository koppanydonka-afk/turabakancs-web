/* A térkép kurzorai — mind bakancs.

   Az oldal neve Túrabakancs; a kurzor bakancs, ami odalép, ahová a
   következő pont kerül. Korábban a pontok fölött célkereszt-szerű
   jel állt (korong és négy nyíl) — az más képi nyelv volt, mint a
   bakancs. Most a bakancs marad, és a TESTTARTÁSA mondja meg, mi
   történik:

     talpon    — a térkép fölött jársz; mozgásra lép
     emelve    — fogható pont fölött vagy: a bakancs felemelkedik
     viszi     — húzod a pontot: a bakancs fent van, a pont nála

   A PONTOSSÁG NEM VESZHET EL: a fogópontot nem a bakancs jelöli, hanem
   egy külön, HELYBEN MARADÓ jel a talp orra alatt. Amikor a bakancs
   felemelkedik, a jel ott marad, ahová a kattintás esik — és árnyék
   kerül alá, hogy látszódjon az emelés. */

const VISZONT = '#F4F2ED';   // fűzővonalak
const TEST = '#2F5D3A';      // szár és lábfej — ugyanaz a zöld, mint a gombokon
const TALP = '#9B6B15';      // talp — a védjegy célpontjának sárgája
const NYOM = '#D94F1E';      // a megrajzolt vonal színe

const cim = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* ---------- A bakancs teste ---------- */

const FELSO =
  'M3.2 22.6 C3.2 20.4 3.4 19 4.4 18.2 C6.4 17 10.4 16.6 15.4 15.8 '
  + 'C16.6 14.4 17.4 11.6 17.6 7.6 C17.6 6.7 18.2 6.2 19.1 6.2 L26.4 6.2 '
  + 'C27.3 6.2 27.9 6.8 27.9 7.7 L28.6 22.6 Z';
const TALP_UT =
  'M3.6 21.8 L28.8 21.8 C29.6 21.8 30 22.3 30 23.1 L30 25.6 '
  + 'C30 26.5 29.5 27 28.6 27 L3.2 27 C2.4 27 1.9 26.5 1.9 25.6 L1.9 24 '
  + 'C1.9 22.6 2.5 21.8 3.6 21.8 Z';

/* A fehér kontúr nem díszítés: enélkül a sötét zöld szár eltűnne az
   erdőfoltokon, a sárga talp pedig a mezőkön. */
export const bakancsTest = `
<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="${FELSO}"/><path d="${TALP_UT}"/></g>
<path d="${FELSO}" fill="${TEST}"/><path d="${TALP_UT}" fill="${TALP}"/>
<g stroke="${VISZONT}" stroke-width="1.35" stroke-linecap="round" opacity=".92"><path d="M20 9.6h6"/><path d="M20 13h6.2"/></g>
<path d="M6.4 19.4C8.6 18.4 11.4 18 14.4 17.4" fill="none" stroke="${VISZONT}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;

/* ---------- A földön maradó jel ----------

   A fogópont a talp orra alatt: 2 képpont jobbra, 27 lefelé. Ez a jel
   akkor sem mozdul, amikor a bakancs felemelkedik — így mindig látszik,
   hova esik a kattintás. */
export const FOGO_X = 2.1;
export const FOGO_Y = 26.6;
const FOGO = '2 27';

/* `allas`: 'alap' | 'emelt' | 'visz'

   A jel maga mondja meg az állapotot, mert harminckét képponton ez
   olvasható el a legjobban: pötty → gyűrű → tömör korong. A bakancs
   emelése ezt kíséri, nem helyettesíti. */
export const foldJel = (allas = 'alap') => {
  const hatter = allas === 'alap' ? 2.4 : 4.2;
  const belso = allas === 'emelt'
    ? `<circle cx="${FOGO_X}" cy="${FOGO_Y}" r="2.6" fill="none" stroke="${NYOM}" stroke-width="1.9"/>`
    : `<circle cx="${FOGO_X}" cy="${FOGO_Y}" r="${allas === 'visz' ? 2.8 : 1.15}" fill="${NYOM}"/>`;
  return `<circle cx="${FOGO_X}" cy="${FOGO_Y}" r="${hatter}" fill="#fff"/>${belso}`;
};

/* A testtartások. A bakancs a fogópont körül fordul: a sarok emelkedik,
   a talpvég marad a helyén — ahogy a járásban is. Az emelés mértékét a
   doboz teteje szabja meg: a szár fölött alig öt képpont van. */
export const TARTAS = {
  alap: 'translate(0,0)',
  emelt: `translate(0,-2.6) rotate(-4 ${FOGO_X} ${FOGO_Y})`,
  visz: `translate(0,-3.4) rotate(-7 ${FOGO_X} ${FOGO_Y})`,
};

/* A jel a bakancs FÖLÉ kerül: talpon állva a talp orra eltakarná, és épp
   az veszne el, ami a pontosságot mutatja. */
const egeszRajz = (meret, allas) => `<svg xmlns="http://www.w3.org/2000/svg" width="${meret}" height="${meret}" viewBox="0 0 32 32">
<g transform="${TARTAS[allas]}">${bakancsTest}</g>${foldJel(allas)}</svg>`;

/* ---------- Kész kurzorképek ----------

   MIÉRT KÉT MÉRET: a böngésző a kurzort a kép saját méretében rajzolja
   ki, tehát egy 32 képpontos rajz retinán 32 ESZKÖZ-képpontra kerül, és
   elmosódik. Az `image-set` a kétszeres változatot adja ilyenkor. Ahol
   az `image-set` nem megy, ott az alatta lévő egyszerű `url()` marad
   érvényben; ahol az sem, ott a tartalék kulcsszó.

   Ezek akkor kellenek, ha nincs mozgó bakancsunk (érintés, vagy aki
   kevesebb mozgást kért) — egyébként a követő elem rajzol. */
const kurzorPar = (allas, tartalek) => [
  `${cim(egeszRajz(32, allas))} ${FOGO}, ${tartalek}`,
  `image-set(${cim(egeszRajz(32, allas))} 1x, ${cim(egeszRajz(64, allas))} 2x) ${FOGO}, ${tartalek}`,
];

export const BAKANCS_KURZOR = kurzorPar('alap', 'default');
export const BAKANCS_EMELT = kurzorPar('emelt', 'grab');
export const BAKANCS_VISZ = kurzorPar('visz', 'grabbing');

/* ---------- A mozgó bakancs ----------

   A böngésző kurzorképe NEM animálható: a beágyazott SVG-t egyszer
   kirajzolja, és onnantól kép. Ezért mozgó kurzorhoz el kell rejteni a
   gyárit (`cursor: none`), és saját elemet kell a mutató után küldeni.

   Ez egy képkockányit késik a valódi mutatóhoz képest — ezért nem a
   bakancs a pontos rész, hanem a kattintás, ami a valódi mutató helyén
   történik. Lassú, célzó mozdulatnál a késés eltűnik.

   A lépés nem óra szerint jár, hanem MEGTETT ÚT szerint: minden
   tizenhárom képpont után vált lábat, és megálláskor letalpal. Így nem
   toporog magától, és nem is siet: ahogy mozgatod, úgy lép. */
const LEPES_TAV = 13;
const MEGALL_MS = 160;

export function bakancsKoveto(doboz) {
  if (typeof window === 'undefined' || !doboz) return null;
  /* Érintésre nincs kurzor, akit meg zavar a mozgás, annak a mozdulatlan
     rajz marad (BAKANCS_KURZOR). */
  if (!window.matchMedia('(pointer: fine)').matches) return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  const elem = document.createElement('div');
  elem.className = 'bakancs-kurzor';
  elem.setAttribute('aria-hidden', 'true');
  /* Két réteg: a földön maradó jel, és fölötte a mozgó bakancs. */
  elem.innerHTML = `
    <svg class="bakancs-kurzor__rajz" viewBox="0 0 32 32" width="32" height="32">${bakancsTest}</svg>
    <svg class="bakancs-kurzor__fold" viewBox="0 0 32 32" width="32" height="32">
      <circle class="bakancs-kurzor__hatter" cx="${FOGO_X}" cy="${FOGO_Y}" r="2.4" fill="#fff"/>
      <circle class="bakancs-kurzor__mag" cx="${FOGO_X}" cy="${FOGO_Y}" r="1.15" fill="${NYOM}"/>
      <circle class="bakancs-kurzor__gyuru" cx="${FOGO_X}" cy="${FOGO_Y}" r="2.6" fill="none" stroke="${NYOM}" stroke-width="1.9"/>
    </svg>`;
  const rajz = elem.querySelector('.bakancs-kurzor__rajz');
  doboz.appendChild(elem);

  let megtett = 0;
  let elozoX = null;
  let elozoY = null;
  let ora = 0;
  let allas = 'alap';
  /* Három külön ok a rejtésre: kint az egér, a térkép saját vezérlője
     fölött van, vagy a térkép kérte. */
  let bent = false;
  let idegen = false;
  let kertRejtes = false;

  const frissit = () => {
    elem.classList.toggle('bakancs-kurzor--lathato', bent && !idegen && !kertRejtes);
  };
  const letalpal = () => rajz.classList.remove('bakancs-kurzor__rajz--lep');

  const allasra = (uj) => {
    if (allas === uj) return;
    allas = uj;
    elem.classList.toggle('bakancs-kurzor--emelt', uj === 'emelt');
    elem.classList.toggle('bakancs-kurzor--visz', uj === 'visz');
    /* Emelt bakanccsal nem lépünk: az a láb épp nincs a földön. */
    if (uj !== 'alap') letalpal();
  };

  const mozdul = (e) => {
    /* Ujjal húzva is érkezik `pointermove`. A bakancs az egérmutató
       helyett van, ujj alatt nincs mit helyettesíteni — és a saját ujjad
       alá rajzolt bakancs csak takarna. */
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const d = doboz.getBoundingClientRect();
    const x = e.clientX - d.left;
    const y = e.clientY - d.top;
    elem.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    /* A térkép saját vezérlői (nagyítás, forrásmegjelölés, buborék) nem a
       térkép felülete: ott a gyári kurzor a helyes. A jelölők viszont
       igen — azok fölött a bakancs emelkedik. */
    const cel = e.target?.closest?.('.maplibregl-ctrl, .maplibregl-popup');
    idegen = Boolean(cel);
    if (allas !== 'visz') {
      allasra(e.target?.closest?.('.maplibregl-marker') ? 'emelt' : 'alap');
    }
    bent = true;
    frissit();

    if (allas !== 'alap') return;
    if (elozoX !== null) megtett += Math.hypot(x - elozoX, y - elozoY);
    elozoX = x;
    elozoY = y;
    if (megtett >= LEPES_TAV) {
      megtett = 0;
      rajz.classList.toggle('bakancs-kurzor__rajz--lep');
    }
    clearTimeout(ora);
    ora = setTimeout(letalpal, MEGALL_MS);
  };

  const belep = () => { bent = true; frissit(); };
  const kilep = () => { bent = false; idegen = false; frissit(); letalpal(); };

  doboz.addEventListener('pointermove', mozdul);
  doboz.addEventListener('pointerenter', belep);
  doboz.addEventListener('pointerleave', kilep);

  return {
    mutat() { kertRejtes = false; frissit(); },
    elrejt() { kertRejtes = true; frissit(); letalpal(); },
    /* Húzás közben a jelölő nem kapja az egeret (a MapLibre kikapcsolja),
       ezért a testtartást a térkép mondja meg. */
    allasra,
    bont() {
      clearTimeout(ora);
      doboz.removeEventListener('pointermove', mozdul);
      doboz.removeEventListener('pointerenter', belep);
      doboz.removeEventListener('pointerleave', kilep);
      elem.remove();
    },
  };
}
