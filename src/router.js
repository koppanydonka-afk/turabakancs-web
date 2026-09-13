import { useEffect, useState } from 'react';
import { ALAP_NYELV, NYELVEK, nyelvesUt, utbolNyelv } from './nyelv/nyelvek.js';
import { nyelv as aktivNyelv } from './nyelv/index.js';

/* Valódi útvonalak (/utvonalak/normafa), nem hash — így indexelhető és
   megosztható. A tárhelynek minden címet az index.html-re kell irányítania.

   A cím elején állhat egy nyelvkód (/en/utvonalak). Az alkalmazás ezt nem
   látja: a `path` mindig a nyelv NÉLKÜLI útvonal, a nyelvet külön adjuk.
   Így egyetlen komponensnek sem kell tudnia róla. */

function tisztit(utvonal) {
  const p = utvonal || '/';
  return p.length > 1 ? p.replace(/\/+$/, '') || '/' : p;
}

const olvas = () => {
  const { nyelv, ut } = utbolNyelv(tisztit(window.location.pathname));
  return { path: ut, nyelv, params: new URLSearchParams(window.location.search) };
};

/* Belső cím a JELENLEGI nyelven. Erre kell ráengedni minden hivatkozást,
   különben a német olvasó egy kattintással a magyar oldalra kerülne. */
export const ut = (cim) => nyelvesUt(aktivNyelv(), cim);

export function navigal(url, { replace = false } = {}) {
  if (replace) window.history.replaceState({}, '', url);
  else window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/* Belső hivatkozások elkapása, hogy ne töltsön újra az egész oldal.
   Az új lapon nyitást és a külső linkeket érintetlenül hagyjuk. */
function belsoKattintas(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target.closest('a');
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

  const href = link.getAttribute('href');
  if (!href || !href.startsWith('/')) return;

  /* Biztonsági háló: ha egy hivatkozásról lemaradt a nyelvi előtag, itt
     kerül rá. Enélkül egyetlen elfelejtett `href` kidobná az olvasót a
     saját nyelvéből — és a főoldal rögtön vissza is irányítaná. */
  const cel = utbolNyelv(href).nyelv === aktivNyelv() ? href : ut(href);

  event.preventDefault();
  if (cel !== window.location.pathname + window.location.search) navigal(cel);
  else window.scrollTo(0, 0);
}

export function useRoute() {
  const [route, setRoute] = useState(olvas);

  useEffect(() => {
    const valtozas = () => setRoute(olvas());
    window.addEventListener('popstate', valtozas);
    document.addEventListener('click', belsoKattintas);
    return () => {
      window.removeEventListener('popstate', valtozas);
      document.removeEventListener('click', belsoKattintas);
    };
  }, []);

  return route;
}

export function useMeta({ title, description, kep = '/megoszto.jpg' }) {
  useEffect(() => {
    document.title = title;

    const tag = (valaszto, ertek) => {
      if (!ertek) return;
      let el = document.head.querySelector(valaszto);
      if (!el) {
        const [, nev, azonosito] = valaszto.match(/meta\[(\w+)="([^"]+)"\]/);
        el = document.createElement('meta');
        el.setAttribute(nev, azonosito);
        document.head.appendChild(el);
      }
      el.setAttribute('content', ertek);
    };

    tag('meta[name="description"]', description);
    tag('meta[property="og:title"]', title);
    tag('meta[property="og:description"]', description);
    tag('meta[property="og:type"]', 'website');
    tag('meta[property="og:url"]', window.location.href);
    tag('meta[property="og:site_name"]', 'Túrabakancs');
    tag('meta[property="og:locale"]', NYELVEK[aktivNyelv()]?.locale ?? 'hu_HU');
    /* A megosztási kép csak abszolút címmel jelenik meg a Facebookon. */
    tag('meta[property="og:image"]', new URL(kep, window.location.origin).href);
    tag('meta[property="og:image:width"]', '1200');
    tag('meta[property="og:image:height"]', '630');
    tag('meta[name="twitter:card"]', 'summary_large_image');
    tag('meta[name="twitter:image"]', new URL(kep, window.location.origin).href);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + window.location.pathname;

    /* Nyelvi társak. Ettől tudja a kereső, hogy a kilenc cím ugyanannak az
       oldalnak a változata, és nem egymás másolatai — enélkül nyolc nyelv
       „duplikált tartalomként" eshetne ki az indexből. */
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    const { ut: csupasz } = utbolNyelv(tisztit(window.location.pathname));
    for (const kod of [...Object.keys(NYELVEK), 'x-default']) {
      const el = document.createElement('link');
      el.rel = 'alternate';
      el.hreflang = kod;
      el.href =
        window.location.origin + nyelvesUt(kod === 'x-default' ? ALAP_NYELV : kod, csupasz);
      document.head.appendChild(el);
    }
  }, [title, description, kep]);
}
