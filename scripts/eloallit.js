/* Előrenderelés.

   Az oldal JavaScriptből épül fel. A Google ezt futtatja, de lassabban és
   bizonytalanabbul indexeli — a közösségi robotok (Facebook, Messenger,
   WhatsApp) pedig EGYÁLTALÁN NEM futtatnak JavaScriptet. Emiatt eddig minden
   cím megosztásakor a főoldal szövege jelent meg, akkor is, ha valaki egy
   konkrét útvonalat küldött el.

   Ez a szkript a build után minden címhez készít egy külön index.html-t,
   benne a saját címével, leírásával és megosztási kártyájával, plusz a
   tartalom statikus változatával. A React ezt betöltéskor lecseréli az
   igazira; a robot viszont már olvasható szöveget kap.

   Futtatás: a `npm run build` automatikusan meghívja. */

import fs from 'node:fs/promises';
import path from 'node:path';
import { peldaUtvonalak } from '../src/data/peldak.js';
import { ertekelesSzerint } from '../src/data/ertekelesek.js';
import { hossz, ido, kmSzoveg } from '../src/data/utvonalak.js';
import { ALAP_NYELV, NYELVEK, nyelvesUt } from '../src/nyelv/nyelvek.js';
import hu from '../src/nyelv/hu.js';
import en from '../src/nyelv/en.js';
import de from '../src/nyelv/de.js';
import sk from '../src/nyelv/sk.js';
import ro from '../src/nyelv/ro.js';
import pl from '../src/nyelv/pl.js';
import cs from '../src/nyelv/cs.js';
import fr from '../src/nyelv/fr.js';
import es from '../src/nyelv/es.js';

const SZOTARAK = { hu, en, de, sk, ro, pl, cs, fr, es };

/* Szövegkereső egy nyelvhez. Hiányzó kulcsnál magyar — ugyanaz a szabály,
   mint a böngészőben. */
const szotarhoz = (kod) => (kulcs, ertekek) => {
  const alap = SZOTARAK[kod]?.[kulcs] ?? hu[kulcs] ?? kulcs;
  return ertekek
    ? alap.replace(/\{(\w+)\}/g, (egesz, nev) => (nev in ertekek ? String(ertekek[nev]) : egesz))
    : alap;
};

const ALAP = 'https://turabakancs.com';
const DIST = path.resolve('dist');

/* A Netlify a perjel nélküli címet 301-gyel átirányítja a perjelesre, tehát
   a valódi cím az utóbbi. A canonical és a sitemap ezt kövesse, különben
   minden hivatkozásunk egy fölösleges átirányításon megy át. */
const teljesCim = (ut) => `${ALAP}${ut === '/' ? '/' : `${ut}/`}`;

const biztos = (sz) =>
  String(sz ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ---- Az egyes címek tartalma ---- */

function oldalak(sz) {
  const lista = [
    {
      ut: '/',
      cim: sz('meta.fooldalCim'),
      leiras: sz('meta.fooldalLeiras'),
      tartalom: `
        <h1>${biztos(sz('fooldal.cim'))}</h1>
        <p>${biztos(sz('fooldal.lead'))}</p>
        <h2>${biztos(sz('fooldal.jelzesCim'))}</h2>
        <p>${biztos(sz('fooldal.jelzesLead'))}</p>`,
    },
    {
      ut: '/tervezo',
      cim: sz('meta.tervezoCim'),
      leiras: sz('meta.tervezoLeiras'),
      tartalom: `
        <h1>${biztos(sz('nincs.tervezo'))}</h1>
        <p>${biztos(sz('meta.tervezoLeiras'))}</p>`,
    },
    {
      ut: '/utvonalak',
      cim: sz('meta.peldakCim'),
      leiras: sz('meta.peldakLeiras'),
      tartalom: `
        <h1>${biztos(sz('peldak.cim'))}</h1>
        <p>${biztos(sz('peldak.bevezeto'))}</p>
        <ul>${peldaUtvonalak
          .map((p) => `<li><a href="/utvonalak/${p.id}">${biztos(p.nev)}</a> — ${biztos(p.hol)}</li>`)
          .join('')}</ul>`,
    },
    {
      ut: '/impresszum',
      cim: sz('meta.impresszumCim'),
      leiras: sz('meta.impresszumLeiras'),
      tartalom: `
        <h1>Impresszum és adatkezelés</h1>
        <h2>Felelősség</h2>
        <p>A távolság, az emelkedő és a menetidő számított becslés, nem garancia. A terepen
           a jelzett turistautak, a hivatalos térképek és a saját döntésed a mérvadó.</p>
        <h2>Adatkezelés</h2>
        <p>Nincs fiók, nincs süti, nincs mérőkód. Amit rajzolsz, a böngésződben marad.</p>`,
    },
  ];

  for (const p of peldaUtvonalak) {
    const km = hossz(p.pontok);
    const e = ertekelesSzerint(p.id);
    lista.push({
      ut: `/utvonalak/${p.id}`,
      cim: `${p.nev} — Túrabakancs`,
      /* A túra neve, helye és jegyzete magyar: ezek magyar helyek magyar
         nevei és a hozzájuk írt leírás. A keret (címkék, gombok) fordítva
         van, a tartalom nem — fordítatlan helynevekkel senki nem járna
         jobban. */
      leiras: `${p.hol}. ${kmSzoveg(km)}, ${ido(km)}. ${p.jegyzet}`.slice(0, 300),
      /* A keresők ebből értik meg, hogy ez egy konkrét túraútvonal. */
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: p.nev,
        description: p.jegyzet,
        url: teljesCim(`/utvonalak/${p.id}`),
        geo: {
          '@type': 'GeoCoordinates',
          latitude: p.pontok[0][0],
          longitude: p.pontok[0][1],
        },
        /* Egyetlen szerkesztőségi vélemény, NEM több értékelés átlaga.
           Ezért `review` és nem `aggregateRating`: utóbbi azt állítaná, hogy
           sok ember pontozta, ami nem igaz — és a Google bünteti az ilyet. */
        ...(e
          ? {
              review: {
                '@type': 'Review',
                reviewRating: {
                  '@type': 'Rating',
                  ratingValue: e.csillag,
                  bestRating: 5,
                  worstRating: 1,
                },
                author: { '@type': 'Organization', name: 'Túrabakancs' },
                reviewBody: e.verdikt,
              },
            }
          : {}),
      },
      tartalom: `
        <h1>${biztos(p.nev)}</h1>
        <p><strong>${biztos(p.hol)}</strong> · ${kmSzoveg(km)} · ${ido(km)}${
          e ? ` · ${e.csillag}/5` : ''
        }</p>
        <p>${biztos(p.jegyzet)}</p>
        ${e ? `<p><em>${biztos(sz('fooldal.szerintunk'))}:</em> ${biztos(e.verdikt)}</p>` : ''}
        ${
          e
            ? `<h2>Ami mellette szól</h2><ul>${e.mellette
                .map((m) => `<li>${biztos(m)}</li>`)
                .join('')}</ul>
               <h2>Amire számíts</h2><ul>${e.ellene
                 .map((x) => `<li>${biztos(x)}</li>`)
                 .join('')}</ul>`
            : ''
        }
        <p><a href="/utvonalak">${biztos(sz('peldak.kicsi'))}</a></p>`,
    });
  }

  return lista;
}

/* ---- A sablon kitöltése ---- */

/* ---- Térképes oldalak előkészítése ----

   A tervező és a példaoldalak betöltése soros lánc volt: fő kód → térkép
   darabja → stíluslap → csempék. Élesben mérve a térkép darabja csak
   451 ms-nál indult el, a stíluslap 614-nél.

   Az alábbi két sor ezt bontja meg, de CSAK azokon az oldalakon, ahol
   tényleg lesz térkép — a kezdőlapnak és a szöveges oldalaknak semmi
   szükségük rá, ott csak felesleges kapcsolat és letöltés lenne.

   A csempék gazdájához előre nyitunk kapcsolatot (DNS + TLS), a térkép
   darabját pedig a fő kóddal egy időben kezdjük tölteni. */
const CSEMPE_GAZDA = 'https://tiles.openfreemap.org';
const terkepesOldal = (ut) => ut === '/tervezo' || /^\/utvonalak\/.+/.test(ut);

/* A darab neve a build hasheléséből jön, tehát minden kiadásnál más. */
async function terkepDarabjai() {
  const konyvtar = path.join(DIST, 'assets');
  const fajlok = await fs.readdir(konyvtar).catch(() => []);
  const keres = (minta) => fajlok.find((f) => minta.test(f));
  return {
    js: keres(/^Terkep-.*\.js$/),
    css: keres(/^Terkep-.*\.css$/),
  };
}

function keszit(sablon, oldal, kod = ALAP_NYELV, darabok = {}) {
  let html = sablon;

  /* A lap nyelve. Enélkül a képernyőolvasó magyarul próbálná felolvasni a
     német szöveget, a kereső pedig magyar oldalnak venné. */
  html = html.replace('<html lang="hu">', `<html lang="${kod}">`);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${biztos(oldal.cim)}</title>`);

  const meta = (nev, ertek, tulajdonsag = true) => {
    const minta = new RegExp(
      `<meta ${tulajdonsag ? 'property' : 'name'}="${nev}" content="[^"]*"\\s*/?>`,
    );
    const uj = `<meta ${tulajdonsag ? 'property' : 'name'}="${nev}" content="${biztos(ertek)}" />`;
    html = minta.test(html) ? html.replace(minta, uj) : html.replace('</head>', `    ${uj}\n  </head>`);
  };

  meta('description', oldal.leiras, false);
  meta('og:title', oldal.cim);
  meta('og:description', oldal.leiras);
  if (!oldal.nincsIndex) meta('og:url', teljesCim(nyelvesUt(kod, oldal.ut)));
  meta('og:locale', NYELVEK[kod]?.locale ?? 'hu_HU');
  meta('twitter:title', oldal.cim, false);
  meta('twitter:description', oldal.leiras, false);

  if (terkepesOldal(oldal.ut)) {
    const elore = [
      `    <link rel="preconnect" href="${CSEMPE_GAZDA}" crossorigin />`,
      /* A stíluslap címe állandó (a sötét változatot magunk festjük), ezért
         nem kell megvárni vele sem a térkép kódját, sem a React
         indulását: a kérés mehet a HTML-lel egyszerre. A térkép ugyanezt
         az egy kérést használja majd (terkepForras.js). */
      `    <link rel="preload" as="fetch" crossorigin href="${CSEMPE_GAZDA}/styles/liberty" />`,
      darabok.js ? `    <link rel="modulepreload" href="/assets/${darabok.js}" />` : null,
      darabok.css ? `    <link rel="preload" as="style" href="/assets/${darabok.css}" />` : null,
    ].filter(Boolean).join('\n');
    html = html.replace('</head>', `${elore}\n  </head>`);
  }

  html = html.replace(
    '</head>',
    (oldal.nincsIndex
      ? '    <meta name="robots" content="noindex" />\n'
      : `    <link rel="canonical" href="${teljesCim(nyelvesUt(kod, oldal.ut))}" />\n` +
        /* Nyelvi társak: a kereső ettől tudja, hogy a kilenc cím ugyanannak
           az oldalnak a változata, nem egymás másolata. */
        Object.keys(NYELVEK)
          .map(
            (k) =>
              `    <link rel="alternate" hreflang="${k}" href="${teljesCim(nyelvesUt(k, oldal.ut))}" />\n`,
          )
          .join('') +
        `    <link rel="alternate" hreflang="x-default" href="${teljesCim(oldal.ut)}" />\n`) +
      (oldal.jsonLd
        ? `    <script type="application/ld+json">${JSON.stringify(oldal.jsonLd)}</script>\n`
        : '') +
      '  </head>',
  );

  /* A statikus tartalom a gyökérelembe kerül. A React betöltéskor lecseréli;
     a robot viszont enélkül üres oldalt látna. */
  /* A statikus tartalom belső hivatkozásaira rákerül a nyelvi előtag.

     A böngészőben ezt a router intézi, de a robotok — és a JavaScript
     nélkül böngészők — ezt a HTML-t olvassák. Előtag nélkül a spanyol
     oldalról egy kattintással a magyarra jutnának, és a kereső is úgy
     látná, hogy minden nyelv a magyar oldalra mutat. */
  const tartalom = oldal.tartalom.replace(
    /href="(\/[^"]*)"/g,
    (egesz, cim) => `href="${nyelvesUt(kod, cim)}"`,
  );

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><div class="elorenderelt">${tartalom}</div></div>`,
  );

  return html;
}

/* ---- Futtatás ---- */

const sablon = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
const darabok = await terkepDarabjai();

/* Minden cím MINDEN nyelven. Ez nem kényelmi kérdés: a Cloudflare a
   statikus fájlokat szolgálja ki, tehát ami nincs legyártva, az élesben
   404. A böngésző nyelve szerinti átirányítás egyenesen a hibaoldalra
   vinné a német olvasót, ha a /de/tervezo/index.html nem létezne. */
const nyelviListak = Object.keys(NYELVEK).map((kod) => ({ kod, lista: oldalak(szotarhoz(kod)) }));

let fajlok = 0;
for (const { kod, lista } of nyelviListak) {
  for (const oldal of lista) {
    const cim = nyelvesUt(kod, oldal.ut);
    const konyvtar = cim === '/' ? DIST : path.join(DIST, cim);
    await fs.mkdir(konyvtar, { recursive: true });
    await fs.writeFile(path.join(konyvtar, 'index.html'), keszit(sablon, oldal, kod, darabok));
    fajlok += 1;
  }
}

const lista = nyelviListak[0].lista;

/* A 404-oldal külön áll: nincs sitemapben, nincs canonicalja, és noindex.

   Korábban a „/*  /index.html  200” szabály fogta el az ismeretlen címeket,
   és a kezdőlapot adta vissza 200-as státusszal. A Cloudflare Pages ezt a
   szabályt nem engedi (önmagát hívná körbe), és amúgy sem volt jó: „soft
   404” volt, amit a kereső létező oldalként indexel.

   Ezt a fájlt a Cloudflare Pages és a Netlify is magától kiszolgálja minden
   nem létező címre, valódi 404-es státusszal. */
await fs.writeFile(
  path.join(DIST, '404.html'),
  keszit(sablon, {
    ut: '/404',
    /* Egyetlen 404-oldal van, mert a kiszolgáló egyet tud kiszolgálni
       minden ismeretlen címre — a nyelvét nem tudja kitalálni. Magyarul
       áll ki, de a React betöltés után átírja a látogató nyelvére. */
    cim: 'Nincs ilyen oldal — Túrabakancs',
    leiras: 'Ez a cím nem létezik. A tervezőből vagy a kész útvonalakból indulhatsz tovább.',
    nincsIndex: true,
    tartalom: `
      <h1>Nincs ilyen oldal</h1>
      <p>Vagy elgépelted a címet, vagy olyan oldalra mutat, ami már nincs meg.</p>
      <ul>
        <li><a href="/">Kezdőlap</a></li>
        <li><a href="/tervezo/">Útvonaltervező</a></li>
        <li><a href="/utvonalak/">Kész útvonalak</a></li>
      </ul>`,
  }),
);

/* A sitemap ugyanebből a listából készül, mint az oldalak — így nem tud
   szétcsúszni a kettő, ha új cím kerül be. */
const ma = new Date().toISOString().slice(0, 10);
const sulyok = { '/': '1.0', '/tervezo': '0.9', '/utvonalak': '0.8', '/impresszum': '0.3' };
/* A sitemapben minden nyelv szerepel, és minden bejegyzés felsorolja a
   társait (xhtml:link). Enélkül a kereső a nyolc fordítást könnyen
   ugyanannak az oldalnak a másolataként kezelné. */
const tarsak = (ut) =>
  Object.keys(NYELVEK)
    .map(
      (k) =>
        `    <xhtml:link rel="alternate" hreflang="${k}" href="${teljesCim(nyelvesUt(k, ut))}" />`,
    )
    .join('\n') +
  `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${teljesCim(ut)}" />`;

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
  ' xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  Object.keys(NYELVEK)
    .flatMap((kod) =>
      lista.map(
        (o) =>
          `  <url>\n    <loc>${teljesCim(nyelvesUt(kod, o.ut))}</loc>\n` +
          `    <lastmod>${ma}</lastmod>\n` +
          `    <priority>${sulyok[o.ut] ?? '0.7'}</priority>\n${tarsak(o.ut)}\n  </url>`,
      ),
    )
    .join('\n') +
  '\n</urlset>\n';
await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap);

console.log(
  `Előrenderelve: ${lista.length} cím × ${Object.keys(NYELVEK).length} nyelv = ${fajlok} fájl, sitemap frissítve`,
);
