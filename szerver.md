# Szerverbeállítás

Az oldal egyetlen `index.html`-ből épül fel, és maga dönti el, mit mutat. Ezért
**minden nem létező útvonalat az index.html-re kell irányítani** — enélkül a
`turabakancs.com/utvonalak/tihany-belso-to` 404-et adna.

Két dolog mindig kell:

1. **Átirányítás** az index.html-re, ha a kért fájl nem létezik.
2. **Az `index.html`, `sw.js` és `manifest.json` ne legyen hosszan gyorsítótárazva**,
   különben a látogató a frissítés után is a régi oldalt kapja. A többi fájl neve
   tartalmaz egy azonosítót, ami változáskor módosul — azokat nyugodtan lehet
   sokáig tárolni.

## Apache (a legtöbb magyar tárhely)

A `public/.htaccess` már készen van, a build automatikusan a `dist` mappába másolja.
Nincs más teendő: töltsd fel a `dist` tartalmát.

## Caddy

```
turabakancs.com {
    root * /var/www/turabakancs
    encode gzip zstd

    @statikus path *.js *.css *.woff2 *.jpg *.png *.svg
    header @statikus Cache-Control "public, max-age=31536000, immutable"

    @friss path /index.html /sw.js /manifest.json
    header @friss Cache-Control "no-cache, must-revalidate"

    try_files {path} /index.html
    file_server
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
        try_files $uri $uri/ /index.html;
    }
}
```

## Netlify / Vercel / Cloudflare Pages

Semmit nem kell csinálni: a `public/_redirects` (Netlify, Cloudflare) és a
`vercel.json` (Vercel) már a helyén van.

## HTTPS kötelező

Az offline működés (service worker) **csak HTTPS-en indul el**. A turabakancs.com
már HTTPS-en válaszol, tehát ez megvan.
