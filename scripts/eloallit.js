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

function oldalak() {
  const lista = [
    {
      ut: '/',
      cim: 'Túrabakancs — túraútvonalak, jelzések, vélemények',
      leiras:
        'Útvonaltervező térkép, a magyar turistajelzések magyarázata és kész túraútvonalak. Fiók nélkül, adatgyűjtés nélkül.',
      tartalom: `
        <h1>Nézd meg, mit mutat egy weboldal.</h1>
        <p>Rajzolj útvonalat a térképre, tegyél ki jelöléseket, és oszd meg egy linkkel.
           Fiók nincs, süti nincs, adatot nem gyűjtünk.</p>
        <h2>Mit jelent a festék a fán?</h2>
        <p>A magyar turistajelzés két dolgot mond meg egyszerre. A szín azt, mekkora út,
           az alak pedig azt, mire való.</p>`,
    },
    {
      ut: '/tervezo',
      cim: 'Tervező — Túrabakancs',
      leiras:
        'Írd be, honnan hova mész, vagy rajzolj a térképre. Táv, emelkedő, menetidő, időjárás és GPX.',
      tartalom: `
        <h1>Útvonaltervező</h1>
        <p>Írd be, honnan hova szeretnél menni — vagy rajzolj a térképre. Megmutatja a
           hosszát, az emelkedőt és a becsült menetidőt, és letöltheted GPX-ben.</p>
        <p>A kiindulópontodhoz feldobja a legközelebbi kész túrákat is.</p>`,
    },
    {
      ut: '/utvonalak',
      cim: 'Példa útvonalak — Túrabakancs',
      leiras: `${peldaUtvonalak.length} kész túraútvonal a térképen, amit megnyithatsz és továbbrajzolhatsz.`,
      tartalom: `
        <h1>${peldaUtvonalak.length} vonal, amiből kiindulhatsz.</h1>
        <ul>${peldaUtvonalak
          .map((p) => `<li><a href="/utvonalak/${p.id}">${biztos(p.nev)}</a> — ${biztos(p.hol)}</li>`)
          .join('')}</ul>`,
    },
    {
      ut: '/impresszum',
      cim: 'Impresszum és adatkezelés — Túrabakancs',
      leiras:
        'Mire jó a Túrabakancs és mire nem. Nincs fiók, nincs süti, nincs mérőkód; a terepen a saját döntésed a mérvadó.',
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
      leiras: `${p.hol}. ${kmSzoveg(km)}, ${ido(km)} gyalog. ${p.jegyzet}`.slice(0, 300),
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
        <p><strong>${biztos(p.hol)}</strong> · ${kmSzoveg(km)} · ${ido(km)} gyalog${
          e ? ` · ${e.csillag}/5 csillag` : ''
        }</p>
        <p>${biztos(p.jegyzet)}</p>
        ${e ? `<p><em>Szerintünk:</em> ${biztos(e.verdikt)}</p>` : ''}
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
        <p><a href="/utvonalak">Vissza a példákhoz</a></p>`,
    });
  }

  return lista;
}

/* ---- A sablon kitöltése ---- */

function keszit(sablon, oldal) {
  let html = sablon;

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
  if (!oldal.nincsIndex) meta('og:url', teljesCim(oldal.ut));
  meta('twitter:title', oldal.cim, false);
  meta('twitter:description', oldal.leiras, false);

  html = html.replace(
    '</head>',
    (oldal.nincsIndex
      ? '    <meta name="robots" content="noindex" />\n'
      : `    <link rel="canonical" href="${teljesCim(oldal.ut)}" />\n`) +
      (oldal.jsonLd
        ? `    <script type="application/ld+json">${JSON.stringify(oldal.jsonLd)}</script>\n`
        : '') +
      '  </head>',
  );

  /* A statikus tartalom a gyökérelembe kerül. A React betöltéskor lecseréli;
     a robot viszont enélkül üres oldalt látna. */
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><div class="elorenderelt">${oldal.tartalom}</div></div>`,
  );

  return html;
}

/* ---- Futtatás ---- */

const sablon = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');
const lista = oldalak();

for (const oldal of lista) {
  const konyvtar = oldal.ut === '/' ? DIST : path.join(DIST, oldal.ut);
  await fs.mkdir(konyvtar, { recursive: true });
  await fs.writeFile(path.join(konyvtar, 'index.html'), keszit(sablon, oldal));
}

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
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  lista
    .map(
      (o) =>
        `  <url>\n    <loc>${teljesCim(o.ut)}</loc>\n    <lastmod>${ma}</lastmod>\n` +
        `    <priority>${sulyok[o.ut] ?? '0.7'}</priority>\n  </url>`,
    )
    .join('\n') +
  '\n</urlset>\n';
await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap);

console.log(`Előrenderelve: ${lista.length} cím, sitemap frissítve`);
for (const o of lista) console.log(`  ${teljesCim(o.ut)}`);
