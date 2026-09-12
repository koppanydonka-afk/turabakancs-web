import { useEffect, useState } from 'react';

/* Valódi útvonalak (/utvonalak/normafa), nem hash — így indexelhető és
   megosztható. A tárhelynek minden címet az index.html-re kell irányítania;
   ezt a public/_redirects és a vercel.json intézi. */

function tisztit(utvonal) {
  const p = utvonal || '/';
  return p.length > 1 ? p.replace(/\/+$/, '') || '/' : p;
}

const olvas = () => ({
  path: tisztit(window.location.pathname),
  params: new URLSearchParams(window.location.search),
});

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

  event.preventDefault();
  if (href !== window.location.pathname + window.location.search) navigal(href);
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
    tag('meta[property="og:locale"]', 'hu_HU');
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
  }, [title, description, kep]);
}
