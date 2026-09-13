/* Napnyugta és napkelte.

   Kizárólag számolás, semmilyen szolgáltatás nem kell hozzá — ezért működik
   offline is, a völgyben, ahol nincs térerő. Túrán ez a legfontosabb adat a
   táv után.

   Pontosság: az Open-Meteo adataihoz mérve (Budapest, 2026 nyara–ősze,
   9 mintanap) a napkelte átlag +0,8 perc, a napnyugta +1,9 perc, a legnagyobb
   eltérés +3 perc. Ez a képlet határa, nem hiba.

   A napnyugtánál az eltérés a derűlátó irányba mutat: pár perccel későbbre
   teszi a sötétedést, mint ahogy valóban bekövetkezik. Ezért számol az
   ajánló külön ráhagyással — sose a puszta napnyugta-időpontra tervezz. */

const fok = (x) => (x * Math.PI) / 180;
const ivbol = (x) => (x * 180) / Math.PI;

/* A naptári naphoz tartozó napszám a 2000-es epochától.

   Eddig a futás pillanatából számoltunk, `Math.floor`-ral. A Julián-nap
   viszont délben fordul, nem éjfélkor — ezért 12:00 UTC-kor (nyáron nálunk
   14:00-kor) átugrott a következő napra. Két látható hibát okozott:

   - Délután a MÁSNAPI napkeltét és napnyugtát mutattuk „Ma” alatt.
   - Reggel a visszaadott időpont a TEGNAPI naphoz tartozott, így a
     „mennyi világos van még” negatívra jött ki: napkelte után azt írtuk
     ki, hogy a nap már lement.

   Most a helyi naptári nap delejéből indulunk, mert a felhasználónak a „ma”
   a saját naptári napját jelenti — nem a Julián-nap fordulóját. */
function napSzam(datum, lng) {
  const del = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), 12, 0, 0, 0);
  const julianDel = del.getTime() / 86400000 + 2440587.5;
  return Math.round(julianDel - 2451545 - 0.0009 - lng / 360) + 0.0008;
}

/* Az esemény időpontja UTC-ben, ezredmásodpercben.
   lesz: +1 napnyugta, -1 napkelte. */
function esemeny(datum, lat, lng, lesz) {
  const n = napSzam(datum, lng);
  const kozelit = n - lng / 360;
  const M = (357.5291 + 0.98560028 * kozelit) % 360;               // középanomália
  const C = 1.9148 * Math.sin(fok(M)) + 0.02 * Math.sin(fok(2 * M)) + 0.0003 * Math.sin(fok(3 * M));
  const L = (M + C + 180 + 102.9372) % 360;                         // ekliptikai hossz
  const delel = 2451545 + kozelit + 0.0053 * Math.sin(fok(M)) - 0.0069 * Math.sin(fok(2 * L));
  const dekl = Math.asin(Math.sin(fok(L)) * Math.sin(fok(23.44))); // deklináció

  /* −0,833° a Nap korongjának és a légköri fénytörésnek a szokásos értéke. */
  const cosOra =
    (Math.sin(fok(-0.833)) - Math.sin(fok(lat)) * Math.sin(dekl)) /
    (Math.cos(fok(lat)) * Math.cos(dekl));

  if (cosOra > 1) return null;   // a Nap fel sem kel
  if (cosOra < -1) return null;  // nem is nyugszik le

  const oraszog = ivbol(Math.acos(cosOra));
  const julian = delel + (lesz * oraszog) / 360;
  return (julian - 2440587.5) * 86400000;
}

export function napnyugta(datum, lat, lng) {
  const ms = esemeny(datum, lat, lng, 1);
  return ms === null ? null : new Date(ms);
}

export function napkelte(datum, lat, lng) {
  const ms = esemeny(datum, lat, lng, -1);
  return ms === null ? null : new Date(ms);
}

export const oraPerc = (d) =>
  d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

/* Mennyi világos idő maradt mostantól, percben. */
export function vilagosMeg(lat, lng, most = new Date()) {
  const ny = napnyugta(most, lat, lng);
  if (!ny) return null;
  return Math.round((ny.getTime() - most.getTime()) / 60000);
}
