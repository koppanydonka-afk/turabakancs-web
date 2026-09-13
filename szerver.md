# Szerverbeállítás

Az oldal **minden címe valódi fájlként áll elő** a build során: a `dist` mappában
ott van a `tervezo/index.html`, a `utvonalak/tihany-belso-to/index.html` és a
többi, összesen 22 cím. Ezért a kiszolgálónak nincs sok dolga.

Korábban itt az állt, hogy minden nem létező útvonalat az `index.html`-re kell
terelni. **Ez már nem igaz, és nem is volt jó.** Attól minden elgépelt cím a
kezdőlapot kapta, 200-as státusszal — „soft 404”, amit a kereső létező oldalként
indexel. A Cloudflare ráadásul el is utasítja ezt a szabályt, mert önmagát hívná
körbe.

Három dolog kell:

1. **Mappa-index kiszolgálása**: a `/tervezo/` a `tervezo/index.html`-t adja.
2. **404**: ami tényleg nincs meg, az a `404.html`-t kapja, **404-es státusszal**.
3. **Az `index.html`, `sw.js` és `manifest.json` ne legyen hosszan gyorsítótárazva**,
   különben a látogató a frissítés után is a régi oldalt kapja. A többi fájl neve
   tartalmaz egy azonosítót, ami változáskor módosul — azokat nyugodtan lehet
   sokáig tárolni.

## Cloudflare Workers (ez fut most élesben)

A `wrangler.jsonc` írja le. Nincs kézi teendő: a GitHubra pusholt commitot a
Cloudflare magától megépíti és kiteszi.

```jsonc
"assets": {
  "directory": "./dist/",
  "not_found_handling": "404-page",
  "html_handling": "auto-trailing-slash"
}
```

A `not_found_handling` nélkül a Worker „single page application” módban megy, és
visszatér a soft 404. A `html_handling` adja a `/tervezo` → `/tervezo/` alakot,
ami a canonical címekkel és a sitemappel egyezik.

Helyben ugyanezt a motort futtatja `npm run eles`.

## Apache (a legtöbb magyar tárhely)

A `public/.htaccess` készen van, a build a `dist` mappába másolja. Az átirányítások
és az `ErrorDocument 404 /404.html` benne vannak.

FTP-nél kapcsold be a rejtett fájlok mutatását, különben a `.htaccess` kimarad.

## Netlify / Vercel

A `public/_redirects` (Netlify) és a `vercel.json` (Vercel) a helyén van. Mindkettő
magától kiszolgálja a `404.html`-t a nem létező címekre.

## Caddy

```
turabakancs.com {
    root * /var/www/turabakancs
    encode gzip zstd

    @statikus path *.js *.css *.woff2 *.jpg *.png *.svg
    header @statikus Cache-Control "public, max-age=31536000, immutable"

    @friss path /index.html /sw.js /manifest.json
    header @friss Cache-Control "no-cache, must-revalidate"

    try_files {path} {path}/index.html
    file_server

    handle_errors {
        rewrite * /404.html
        file_server
    }
}
```

## nginx

```
server {
    server_name turabakancs.com;
    root /var/www/turabakancs;
    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;

    location ~* \.(js|css|woff2|jpg|png|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location ~* ^/(index\.html|sw\.js|manifest\.json)$ {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location / {
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;
    location = /404.html { internal; }
}
```

## Átirányítások

Két régi cím él tovább, mert megszűnt oldalakra mutat. Ezeket **három helyen** kell
egyszerre karbantartani, különben platformonként másképp viselkednek:

| hol | mi |
| --- | --- |
| `public/_redirects` | Cloudflare, Netlify |
| `vercel.json` | Vercel |
| `public/.htaccess` | Apache |

```
/honnan-hova  →  /tervezo/      301
/rolad        →  /impresszum/   301
```

A célcím **perjeles**. Perjel nélkül a kiszolgáló még egyszer átirányítana, és
minden régi link két ugrásból érne célba.

## HTTPS kötelező

Az offline működés (service worker) **csak HTTPS-en indul el**. A Cloudflare
magától kiállítja a tanúsítványt, tehát ez megvan.
