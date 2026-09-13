/* Kép egy látványossághoz — kérésre, a Wikimedia Commonsról.

   MIÉRT ÍGY: a látványosságok korábban tizenöt magyar hely voltak, a
   képekkel együtt letöltve a `public/latvany` mappába. Világszerte ez nem
   járható: több ezer kép kellene, egyenként licencadattal.

   Ezért a kép most kérésre jön, és CSAK akkor, ha a látogató rákoppint egy
   látványosságra. Amíg nem koppint, a böngészője egyetlen képet sem tölt
   le idegen szerverről — ugyanaz a szabály, mint eddig, csak most a
   koppintás a határ.

   LICENC — EZT NE VEDD KI: a Commons képei többnyire CC BY vagy CC BY-SA
   alatt állnak, ahol a szerző és a licenc megjelölése a felhasználás
   FELTÉTELE, nem udvariasság. Ezért kérjük le az `extmetadata` mezőt is, és
   ezért nem jelenítünk meg olyan képet, amihez nem kaptunk szerzőt. Ha
   nincs meg a név, inkább nincs kép. */

const WIKIDATA = 'https://www.wikidata.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';

/* Amit már megkérdeztünk, azt nem kérdezzük újra ebben a látogatásban.
   A Wikidata és a Commons közös, ingyenes szolgáltatás. */
const gyorsito = new Map();

/* A Commons a szerzőt HTML-ben adja vissza (link, formázás). Nekünk a
   puszta név kell — a felületre amúgy sem tehetünk idegen HTML-t. */
function szovegge(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function json(url, jel) {
  const megszakit = new AbortController();
  const ora = setTimeout(() => megszakit.abort(), 8000);
  try {
    const valasz = await fetch(url, { signal: megszakit.signal });
    if (!valasz.ok) throw new Error(`${jel}: ${valasz.status}`);
    return await valasz.json();
  } finally {
    clearTimeout(ora);
  }
}

/* A Wikidata-tétel képe (P18). A válasz fájlnév, nem URL. */
async function kepFajlneve(qid) {
  const p = new URLSearchParams({
    action: 'wbgetclaims',
    entity: qid,
    property: 'P18',
    format: 'json',
    origin: '*',
  });
  const adat = await json(`${WIKIDATA}?${p}`, 'wikidata');
  return adat?.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null;
}

/* A fájlhoz tartozó kép és licencadat. A `iiurlwidth` miatt a Commons
   kicsinyített változatot ad: a buborékba nem kell több. */
async function fajlAdatai(fajlnev) {
  const p = new URLSearchParams({
    action: 'query',
    titles: `File:${fajlnev}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '320',
    format: 'json',
    origin: '*',
  });
  const adat = await json(`${COMMONS}?${p}`, 'commons');
  const lapok = adat?.query?.pages ?? {};
  const elso = Object.values(lapok)[0];
  const info = elso?.imageinfo?.[0];
  if (!info) return null;

  const m = info.extmetadata ?? {};
  const szerzo = szovegge(m.Artist?.value);
  const licenc = szovegge(m.LicenseShortName?.value);

  /* Szerző nélkül nem tesszük ki: a megjelölés a licenc feltétele. */
  if (!szerzo) return null;

  return {
    kep: info.thumburl ?? info.url,
    szerzo,
    licenc: licenc || 'lásd a forrásnál',
    forras: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fajlnev)}`,
  };
}

/* Egy látványosság képe a Wikidata-azonosítójából.

   Hibát nem dob: ha nincs kép, nincs szerző, vagy nem válaszol a
   szolgáltatás, `null`-t ad — a buborékban akkor csak a név marad. */
export async function latvanyKepe(qid) {
  if (!qid || !/^Q\d+$/.test(qid)) return null;
  if (gyorsito.has(qid)) return gyorsito.get(qid);

  const igeret = (async () => {
    try {
      const fajlnev = await kepFajlneve(qid);
      if (!fajlnev) return null;
      return await fajlAdatai(fajlnev);
    } catch {
      return null;
    }
  })();

  gyorsito.set(qid, igeret);
  return igeret;
}
