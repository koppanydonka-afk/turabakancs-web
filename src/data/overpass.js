import { sz } from '../nyelv/index.js';
/* Overpass-lekérdezés, tartaléktükörrel.

   Az OpenStreetMap adatait az Overpass API adja, kulcs és fizetés nélkül.
   Cserébe közös, ingyenes erőforrás: nem kérdezünk magától, csak akkor, ha
   a felhasználó kér valamit.

   Miért van tartalék: a fő példány rendszeresen 504-gyel vagy 429-cel
   válaszol terhelés alatt. Egy gombra kötött funkciónál ez azt jelentené,
   hogy néha „nem sikerült” — holott az adat ott van, csak a kiszolgáló
   éppen nem ér rá. A tükrök ugyanazt az adatbázist szolgálják ki.

   A sorrend számít: a fő példányt terheljük elsőként, a tükör csak akkor
   kap kérést, ha az elsőnél tényleg nem jött össze. */

const PELDANYOK = [
  'https://overpass-api.de/api/interpreter',
  /* A kumi.systems a fő példány leggyorsabb nyilvános tükre; a
     private.coffee marad harmadiknak, mert lassabb ugyan, de akkor is
     válaszol, amikor a másik kettő tele van. Ezt a látványosság-rétegen
     mértük: a nehezebb lekérdezés rendszeresen kifogott a két korábbi
     példányon. */
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

export class OverpassHiba extends Error {}

/* Melyik példány mit felelt — hiba esetén ezt tesszük a `cause`-ba.
   Bare `catch {}`-szel minden hiba egyformán néz ki, és utólag nem lehet
   megmondani, a hálózat, az időkorlát vagy a kiszolgáló volt-e a baj. */
const reszletek = (vegpont, mi) => `${new URL(vegpont).host}: ${mi}`;

/* Ezekre a válaszokra érdemes tükröt próbálni: nem a kérdésünk rossz,
   hanem a kiszolgáló van tele. */
const UJRAPROBALHATO = new Set([429, 502, 503, 504]);

/* Időkorlát nélkül egy elakadt tükör örökre pörgetné a gombot. Az Overpass
   maga is kap `timeout:` értéket a lekérdezésben, de az csak a feldolgozásra
   vonatkozik — ha a kiszolgáló el sem kezdi, az nem segít. */
const VARAKOZAS_MS = 20000;

export async function overpass(lekerdezes, { cimke = 'overpass' } = {}) {
  let utolsoHiba = null;

  for (const vegpont of PELDANYOK) {
    const megszakito = new AbortController();
    const ora = setTimeout(() => megszakito.abort(), VARAKOZAS_MS);
    let valasz;
    try {
      valasz = await fetch(vegpont, {
        method: 'POST',
        /* Az Overpass elutasítja a névtelen hívót (406). A böngésző a saját
           azonosítóját küldi, ott ez a fejléc figyelmen kívül marad — a
           Node alatti futtatáshoz viszont kell. */
        headers: { 'User-Agent': `Turabakancs/0.1 (${cimke}; turabakancs-terkep)` },
        body: new URLSearchParams({ data: lekerdezes }),
        signal: megszakito.signal,
      });
    } catch (e) {
      utolsoHiba = new OverpassHiba(sz('hiba.osmNema'), {
        cause: reszletek(vegpont, e.name === 'AbortError' ? `időtúllépés ${VARAKOZAS_MS} ms után` : e.message),
      });
      continue;
    } finally {
      clearTimeout(ora);
    }

    if (valasz.ok) return valasz.json();

    if (UJRAPROBALHATO.has(valasz.status)) {
      utolsoHiba = new OverpassHiba(
        valasz.status === 429
          ? sz('hiba.tulterhelt')
          : sz('hiba.terheles'),
        { cause: reszletek(vegpont, `HTTP ${valasz.status}`) },
      );
      continue;
    }

    /* Minden más (400, 406…) a kérdésünkkel van, nem a kiszolgálóval —
       tükörrel sem lenne jobb. */
    throw new OverpassHiba(sz('hiba.keresesNemSikerult'));
  }

  throw utolsoHiba ?? new OverpassHiba(sz('hiba.keresesNemSikerult'));
}
