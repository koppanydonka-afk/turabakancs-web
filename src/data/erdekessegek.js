/* Érdekességek a főoldalra.

   A jelzésrendszer leírását nem fejből írtam: az OpenStreetMap jelzett
   útjaiból ellenőriztem, mi hova vezet. A háromszöggel jelölt utak neve
   csúcson vagy kilátónál végződik („Kis-Hárs-hegy, kilátó”, „Erzsébet-
   kilátó”), a körrel jelöltek ugyanoda érnek vissza, ahonnan indultak
   („Hűvösvölgy – Nagy-rét – Hűvösvölgy”), a sávos utak két település
   között futnak át, a keresztesek pedig két másik jelzést kötnek össze.

   Ha új tételt veszel fel, ugyanígy járj el: ellenőrizd, ne emlékezz. */

export const JELZESEK = [
  {
    id: 'sav',
    jel: 'sáv',
    alak: 'bar',
    cim: 'Sáv — átmenő fővonal',
    leiras:
      'A gerinc- és fővonalak jele. Két település vagy két nagy pont között visz át, ' +
      'nem tér vissza. Az Országos Kéktúra végig kék sáv.',
  },
  {
    id: 'haromszog',
    jel: 'háromszög',
    alak: 'triangle',
    cim: 'Háromszög — felvisz a csúcsra',
    leiras:
      'Rövid letérő egy hegytetőhöz vagy kilátóhoz. Ha háromszöget látsz, felfelé mész, ' +
      'és jó eséllyel kilátás lesz a végén.',
  },
  {
    id: 'kor',
    jel: 'kör',
    alak: 'circle',
    cim: 'Kör — visszaér oda, ahonnan indult',
    leiras:
      'Körtúra jele: ugyanoda érkezel, ahonnan elindultál. Autóval érkezőnek ez a legjobb, ' +
      'mert nem kell visszajutni a kocsihoz.',
  },
  {
    id: 'kereszt',
    jel: 'kereszt',
    alak: 'cross',
    cim: 'Kereszt — összeköt két utat',
    leiras:
      'Átkötő szakasz két másik jelzés között. Önmagában ritkán túra, de vele lehet ' +
      'rövidíteni vagy kört zárni két fővonalból.',
  },
];

/* A szín a rangot mondja meg, az alak a szerepet. */
export const SZINEK = [
  { id: 'kek', nev: 'Kék', szin: '#1565C0', leiras: 'Országos gerincvonalak, köztük a Kéktúra.' },
  { id: 'piros', nev: 'Piros', szin: '#D32F2F', leiras: 'Nagyobb, tájegységen átvezető utak.' },
  { id: 'zold', nev: 'Zöld', szin: '#2E7D32', leiras: 'Helyi utak, rövidebb szakaszok.' },
  { id: 'sarga', nev: 'Sárga', szin: '#C8A000', leiras: 'Helyi utak, jellemzően a legrövidebbek.' },
];
