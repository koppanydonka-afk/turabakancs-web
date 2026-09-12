/* Offline működés.

   Egy túraeszköz, ami a völgyben nem indul el, félkész. Ez a service worker
   eltárolja az oldalt és a már megnézett térképszeleteket, hogy jel nélkül is
   megnyíljon, amit korábban láttál.

   Amit NEM csinál: nem tölt le előre térképet. Az OpenStreetMap csempéinek
   tömeges letöltése tilos, és jogos okból — közösségi, ingyenes szolgáltatás.
   Csak azt tartjuk meg, amit a böngésződ amúgy is lekért, amikor nézted. */

const VERZIO = 'v5';
const VAZ = `turabakancs-vaz-${VERZIO}`;
const CSEMPE = `turabakancs-csempe-${VERZIO}`;
const CSEMPE_MAX = 600;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VAZ).then((c) => c.addAll(['/', '/tervezo', '/ikon.svg', '/manifest.json'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((kulcsok) =>
      Promise.all(
        kulcsok
          .filter((k) => k.startsWith('turabakancs-') && !k.endsWith(VERZIO))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

/* A csempetár nem nőhet a végtelenségig: a legrégebbieket dobjuk el. */
async function csempetNyirbal() {
  const c = await caches.open(CSEMPE);
  const kulcsok = await c.keys();
  if (kulcsok.length <= CSEMPE_MAX) return;
  for (const k of kulcsok.slice(0, kulcsok.length - CSEMPE_MAX)) await c.delete(k);
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  /* Térképcsempe: előbb a tárból, mert a hegyen ez a lényeg. */
  if (/tile\.openstreetmap\.org$/.test(url.hostname)) {
    e.respondWith(
      caches.open(CSEMPE).then(async (c) => {
        const tarolt = await c.match(request);
        if (tarolt) return tarolt;
        try {
          const valasz = await fetch(request);
          /* A csempék más eredetről, no-cors módban jönnek, ezért a válasz
             „átlátszatlan”: a status 0 és az .ok hamis, akkor is, ha a kép
             rendben megérkezett. Ezt külön kell engedni, különben soha
             semmit nem tárolnánk el. */
          if (valasz.ok || valasz.type === 'opaque') {
            c.put(request, valasz.clone());
            csempetNyirbal();
          }
          return valasz;
        } catch {
          /* Nincs jel és nincs eltárolva: üres válasz, hogy a térkép ne
             boruljon fel egyetlen hiányzó szelettől. */
          return new Response('', { status: 504, statusText: 'nincs kapcsolat' });
        }
      }),
    );
    return;
  }

  /* Más idegen forrás (útvonalkereső, időjárás, Overpass) nem kerül tárba:
     ezek friss adatok, elavultan rosszabbak a semminél. */
  if (url.origin !== self.location.origin) return;

  /* Oldalbetöltés: hálózat először, hogy a frissítés azonnal lássék;
     ha nincs kapcsolat, a tárolt oldal jön. */
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((valasz) => {
          caches.open(VAZ).then((c) => c.put(request, valasz.clone()));
          return valasz;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/tervezo')) ?? caches.match('/')),
    );
    return;
  }

  /* Saját fájlok (kód, stílus, képek): tárból gyorsan, közben frissítjük. */
  e.respondWith(
    caches.open(VAZ).then(async (c) => {
      const tarolt = await c.match(request);
      const halozat = fetch(request)
        .then((valasz) => {
          if (valasz.ok) c.put(request, valasz.clone());
          return valasz;
        })
        .catch(() => tarolt);
      return tarolt ?? halozat;
    }),
  );
});
