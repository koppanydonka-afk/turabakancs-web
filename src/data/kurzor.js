/* A térkép kurzorai.

   A tervezőn eddig a böngésző gyári keresztje állt a térkép fölött, a
   pontok fölött pedig a gyári kéz. Az oldal neve Túrabakancs — a kurzor
   legyen bakancs, ami odalép, ahová a következő pont kerül, a pontok
   fölött pedig legyen látszódjon, hogy meg lehet fogni őket.

   A PONTOSSÁG NEM VESZHET EL: a bakancs önmagában nem mutat pontos
   helyet, ezért a talp orra alatt ott a fogópont, apró narancs koronggal
   jelölve — a kurzor töve pontosan ott van, ahová kattintasz. */

const VISZONT = '#F4F2ED';   // fűzővonalak
const TEST = '#2F5D3A';      // szár és lábfej — ugyanaz a zöld, mint a gombokon
const TALP = '#9B6B15';      // talp — a védjegy célpontjának sárgája
const NYOM = '#D94F1E';      // a megrajzolt vonal színe
const SOTET = '#1C2119';

const cim = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/* ---------- A bakancs ---------- */

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
export const bakancsRajz = (meret) => `<svg xmlns="http://www.w3.org/2000/svg" width="${meret}" height="${meret}" viewBox="0 0 32 32">
<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"><path d="${FELSO}"/><path d="${TALP_UT}"/></g>
<path d="${FELSO}" fill="${TEST}"/><path d="${TALP_UT}" fill="${TALP}"/>
<g stroke="${VISZONT}" stroke-width="1.35" stroke-linecap="round" opacity=".92"><path d="M20 9.6h6"/><path d="M20 13h6.2"/></g>
<path d="M6.4 19.4C8.6 18.4 11.4 18 14.4 17.4" fill="none" stroke="${VISZONT}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
<circle cx="2.1" cy="26.6" r="2.4" fill="#fff"/><circle cx="2.1" cy="26.6" r="1.15" fill="${NYOM}"/></svg>`;

/* A fogópont a talp orra: 2 képpont jobbra, 27 lefelé. */
const FOGO = '2 27';

/* MIÉRT KÉT MÉRET: a böngésző a kurzort a kép saját méretében rajzolja
   ki, tehát egy 32 képpontos rajz retinán 32 ESZKÖZ-képpontra kerül, és
   elmosódik. Az `image-set` a kétszeres változatot adja ilyenkor. Ahol
   az `image-set` nem megy, ott az alatta lévő egyszerű `url()` marad
   érvényben; ahol az sem, ott a kereszt. */
export const BAKANCS_KURZOR = [
  `${cim(bakancsRajz(32))} ${FOGO}, crosshair`,
  `image-set(${cim(bakancsRajz(32))} 1x, ${cim(bakancsRajz(64))} 2x) ${FOGO}, crosshair`,
];

/* ---------- A pontok kurzora ----------

   A vonal pontja fölött eddig a gyári kéz állt. Az nem mond semmit arról,
   MI fogható meg — ez viszont magát a pontot mutatja, körülötte a négy
   iránnyal. Fogás közben a nyilak befelé húzódnak, a korong betelik:
   ugyanaz a jel, más állapotban. */
const pontRajz = (fogva) => {
  const t = fogva ? 9.4 : 12.5;      // a nyílhegyek távolsága a középponttól
  const hegy = {
    fel: `M16 ${16 - t - 3.4} L${16 - 3.2} ${16 - t + 0.6} L${16 + 3.2} ${16 - t + 0.6} Z`,
    le: `M16 ${16 + t + 3.4} L${16 - 3.2} ${16 + t - 0.6} L${16 + 3.2} ${16 + t - 0.6} Z`,
    bal: `M${16 - t - 3.4} 16 L${16 - t + 0.6} ${16 - 3.2} L${16 - t + 0.6} ${16 + 3.2} Z`,
    jobb: `M${16 + t + 3.4} 16 L${16 + t - 0.6} ${16 - 3.2} L${16 + t - 0.6} ${16 + 3.2} Z`,
  };
  const hegyek = Object.values(hegy).map((d) => `<path d="${d}"/>`).join('');
  const sugar = fogva ? 5.6 : 4.6;
  /* Fehér kontúr itt is: a sötét nyílhegyek eltűnnének a sötét térképen,
     a narancs korong pedig az őszi lomb fölött. */
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
<g fill="#fff" stroke="#fff" stroke-width="2.8" stroke-linejoin="round">${hegyek}</g>
<circle cx="16" cy="16" r="${sugar + 2}" fill="#fff"/>
<g fill="${SOTET}">${hegyek}</g>
<circle cx="16" cy="16" r="${sugar}" fill="${fogva ? NYOM : '#fff'}" stroke="${NYOM}" stroke-width="2.4"/></svg>`;
};

/* A fogópont a korong közepe. A gyári `grab`/`grabbing` a tartalék. */
export const PONT_KURZOR = `${cim(pontRajz(false))} 16 16, grab`;
export const PONT_FOGVA = `${cim(pontRajz(true))} 16 16, grabbing`;

/* ---------- Az animált bakancs ----------

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
  elem.innerHTML = `<span class="bakancs-kurzor__rajz">${bakancsRajz(32)}</span>`;
  const rajz = elem.firstElementChild;
  doboz.appendChild(elem);

  let megtett = 0;
  let elozoX = null;
  let elozoY = null;
  let ora = 0;
  /* Három külön ok a rejtésre: kint az egér, idegen elem fölött van (a
     jelölőknek saját kurzoruk van), vagy a térkép kérte. */
  let bent = false;
  let idegen = false;
  let kertRejtes = false;

  const frissit = () => {
    elem.classList.toggle('bakancs-kurzor--lathato', bent && !idegen && !kertRejtes);
  };
  const letalpal = () => rajz.classList.remove('bakancs-kurzor__rajz--lep');

  const mozdul = (e) => {
    /* Ujjal húzva is érkezik `pointermove`. A bakancs az egérmutató
       helyett van, ujj alatt nincs mit helyettesíteni — és a saját ujjad
       alá rajzolt bakancs csak takarna. */
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const d = doboz.getBoundingClientRect();
    const x = e.clientX - d.left;
    const y = e.clientY - d.top;
    elem.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    idegen = Boolean(e.target?.closest?.('.maplibregl-marker, .maplibregl-ctrl, .maplibregl-popup'));
    bent = true;
    frissit();

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
    bont() {
      clearTimeout(ora);
      doboz.removeEventListener('pointermove', mozdul);
      doboz.removeEventListener('pointerenter', belep);
      doboz.removeEventListener('pointerleave', kilep);
      elem.remove();
    },
  };
}
