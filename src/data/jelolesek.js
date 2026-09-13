/* Jelöléstípusok.

   A színek fehér jelre mind 4,5:1 fölött vannak, és a térkép zöld-szürke
   csempéin is elkülönülnek egymástól. A rajzok egyszerű vonalas alakzatok,
   hogy 22 képpontos tűben is olvashatók maradjanak. */

export const JELOLES_TIPUSOK = [
  {
    id: 'kilato',
    nevKulcs: 'tipus.kilato',
    szin: '#1D4ED8',
    rajz: '<path d="M3 17 9 7l4 6 2.5-3L21 17z"/><circle cx="8" cy="5" r="1.6"/>',
  },
  {
    id: 'forras',
    nevKulcs: 'tipus.forras',
    szin: '#0E7490',
    rajz: '<path d="M12 3c3.6 4.6 5.4 7 5.4 9.4A5.4 5.4 0 0 1 6.6 12.4C6.6 10 8.4 7.6 12 3z"/>',
  },
  {
    id: 'pihen',
    nevKulcs: 'tipus.pihen',
    szin: '#4D7C0F',
    rajz: '<path d="M4 11h16M4 15h16M5.5 11v6M18.5 11v6M6.5 11V8h11v3"/>',
  },
  {
    id: 'parkolo',
    nevKulcs: 'tipus.parkolo',
    szin: '#475569',
    rajz: '<path d="M8.5 19V5h4.6a4.2 4.2 0 0 1 0 8.4H8.5"/>',
  },
  {
    id: 'vendeglatas',
    nevKulcs: 'tipus.vendeglatas',
    szin: '#B45309',
    rajz: '<path d="M6 3v6a2.5 2.5 0 0 0 5 0V3M8.5 11v10M18 3c-1.6 1-2.4 3-2.4 5.2 0 1.6.8 2.6 2.4 3V21"/>',
  },
  {
    id: 'latnivalo',
    nevKulcs: 'tipus.latnivalo',
    szin: '#7E22CE',
    rajz: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  },
  {
    id: 'veszely',
    nevKulcs: 'tipus.veszely',
    szin: '#B91C1C',
    rajz: '<path d="M12 3.6 21.4 20H2.6z"/><path d="M12 10v4.2M12 17.2h.01"/>',
  },
  {
    id: 'kozlekedes',
    nevKulcs: 'tipus.kozlekedes',
    szin: '#0F766E',
    rajz: '<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5V17H5zM5 11h14M8 20v-3M16 20v-3"/>',
  },
];

export const tipusSzerint = (id) =>
  JELOLES_TIPUSOK.find((t) => t.id === id) ?? JELOLES_TIPUSOK[0];

/* A térképre kerülő tű: kör + alatta csúcs, benne a típus rajza. */
export function tuHtml(tipusId) {
  const tipus = tipusSzerint(tipusId);
  return `
    <span class="tu" style="--tu-szin:${tipus.szin}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${tipus.rajz}</svg>
    </span>`;
}
