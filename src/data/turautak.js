/* Jelzett turistautak az OpenStreetMapből.

   „Népszerű útvonalat" nem tudunk mutatni: ahhoz azt kellene figyelnünk, ki
   merre jár — pont azt az adatgyűjtést, amit ez az oldal nem csinál. Helyette
   azt mutatjuk, ami valóban ott van a terepen: a hivatalosan jelzett
   turistautakat, a magyar jelzésrendszerrel együtt (piros sáv, kék kör,
   zöld háromszög, Országos Kéktúra szakaszai).

   Az adat az Overpass API-ból jön, kulcs nélkül. Csak gombnyomásra kérdez,
   mert az Overpass közös, ingyenes szolgáltatás — nem terheljük fölöslegesen. */

const VEGPONT = 'https://overpass-api.de/api/interpreter';

/* Az osmc:symbol alakja: háttér:alapszín:jel — ebből a középső és a jel
   számít nekünk, abból áll össze a magyar turistajelzés. */
const SZINEK = {
  red: '#D32F2F', blue: '#1565C0', green: '#2E7D32',
  yellow: '#C8A000', black: '#333333', white: '#FFFFFF',
};
const ALAKOK = {
  bar: 'sáv', cross: 'kereszt', circle: 'kör', triangle: 'háromszög',
  square: 'négyzet', dot: 'pont', L: 'L', rectangle: 'négyszög',
};

export function jelzest(osmc) {
  if (!osmc) return null;
  const reszek = osmc.split(':');
  const szin = reszek[0]?.split('_')[0];
  const jel = reszek[2] || '';
  const [jelSzin, alak] = jel.split('_');
  return {
    szin: SZINEK[jelSzin] || SZINEK[szin] || '#555',
    alak: ALAKOK[alak] || 'jelzés',
    nev: `${{ red: 'piros', blue: 'kék', green: 'zöld', yellow: 'sárga', black: 'fekete' }[jelSzin || szin] ?? ''} ${ALAKOK[alak] || ''}`.trim(),
  };
}

async function kerdez(lekerdezes) {
  /* Az Overpass elutasítja a névtelen hívót (406). A böngésző a saját
     azonosítóját küldi, ezért ott ez a fejléc figyelmen kívül marad — a
     kiszolgáló oldali teszteléshez viszont kell, hogy ugyanez a modul
     Node alatt is fusson. */
  const valasz = await fetch(VEGPONT, {
    method: 'POST',
    headers: { 'User-Agent': 'Turabakancs/0.1 (turautak; turabakancs-terkep)' },
    body: new URLSearchParams({ data: lekerdezes }),
  });
  if (!valasz.ok) {
    throw new Error(
      valasz.status === 429
        ? 'Az OpenStreetMap keresője most túlterhelt. Próbáld pár másodperc múlva.'
        : 'Nem sikerült lekérni a turistautakat.',
    );
  }
  return valasz.json();
}

/* A térképen épp látható terület jelzett útjai. */
export async function kozeliUtak(hatarok) {
  const { del, nyugat, eszak, kelet } = hatarok;
  const adat = await kerdez(
    `[out:json][timeout:25];relation["route"="hiking"](${del},${nyugat},${eszak},${kelet});out tags center;`,
  );

  return (adat.elements ?? [])
    .filter((e) => e.tags?.name)
    .map((e) => ({
      id: e.id,
      nev: e.tags.name,
      jelzes: jelzest(e.tags['osmc:symbol']),
      ref: e.tags.ref ?? null,
      kozep: e.center ? [e.center.lat, e.center.lon] : null,
      tavsag: e.tags.distance ? `${e.tags.distance} km` : null,
    }))
    .sort((a, b) => a.nev.localeCompare(b.nev, 'hu'));
}

/* Egy kiválasztott út vonala. A relációban a szakaszok nem mindig egy
   irányba néznek, ezért a végpontok alapján fűzzük őket össze — enélkül a
   vonal oda-vissza ugrálna. */
export async function utVonala(id) {
  const adat = await kerdez(`[out:json][timeout:30];relation(${id});out geom;`);
  const rel = adat.elements?.[0];
  if (!rel) throw new Error('Ez az útvonal nem érhető el.');

  const szakaszok = (rel.members ?? [])
    .filter((m) => m.type === 'way' && Array.isArray(m.geometry) && m.geometry.length > 1)
    .map((m) => m.geometry.map((g) => [g.lat, g.lon]));

  if (szakaszok.length === 0) throw new Error('Ennek az útvonalnak nincs megrajzolt nyomvonala.');

  const kesz = szakaszok.shift();
  while (szakaszok.length) {
    const vege = kesz[kesz.length - 1];
    let legjobb = 0;
    let legkisebb = Infinity;
    let fordit = false;

    szakaszok.forEach((sz, i) => {
      const eleje = (sz[0][0] - vege[0]) ** 2 + (sz[0][1] - vege[1]) ** 2;
      const hatulja = (sz[sz.length - 1][0] - vege[0]) ** 2 + (sz[sz.length - 1][1] - vege[1]) ** 2;
      if (eleje < legkisebb) { legkisebb = eleje; legjobb = i; fordit = false; }
      if (hatulja < legkisebb) { legkisebb = hatulja; legjobb = i; fordit = true; }
    });

    const kovetkezo = szakaszok.splice(legjobb, 1)[0];
    kesz.push(...(fordit ? kovetkezo.reverse() : kovetkezo));
  }

  return kesz;
}

/* Hosszú túraútnál a pontszám ezresekben van; a linkbe és a szerkesztőbe
   ennyi nem fér el értelmesen, ezért ritkítunk. */
export function ritkit(pontok, max = 300) {
  if (pontok.length <= max) return pontok;
  const lepes = pontok.length / max;
  const ki = [];
  for (let i = 0; i < max; i += 1) ki.push(pontok[Math.floor(i * lepes)]);
  ki.push(pontok[pontok.length - 1]);
  return ki;
}
