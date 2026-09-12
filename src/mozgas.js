/* Feltűnés görgetéskor.

   A szekciók halványan, kissé lentről úsznak be, amikor a képernyőre érnek.
   Ennek egyetlen komoly kockázata van: ha a figyelő valamiért nem indul el,
   a tartalom LÁTHATATLAN MARAD. Ezért van benne biztonsági háló — másfél
   másodperc után mindent megmutatunk, történjék bármi.

   A `prefers-reduced-motion` beállítást a CSS kezeli: ott a kezdőállapot
   eleve látható. */

import { useEffect } from 'react';

const BIZTONSAGI_IDO = 1500;

export function useFeltunes(kulcs) {
  useEffect(() => {
    const elemek = Array.from(document.querySelectorAll('[data-feltun]'));
    if (elemek.length === 0) return undefined;

    const megmutat = (el) => {
      el.dataset.feltun = 'kesz';
    };

    /* Ami már eleve látszik, azt azonnal megmutatjuk — ne ússzon be az,
       ami a képernyő tetején van betöltéskor. */
    const lathato = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.92 && r.bottom > 0;
    };

    elemek.filter(lathato).forEach(megmutat);

    const varakozok = elemek.filter((el) => el.dataset.feltun !== 'kesz');
    if (varakozok.length === 0) return undefined;

    let figyelo = null;
    if ('IntersectionObserver' in window) {
      figyelo = new IntersectionObserver(
        (bejegyzesek) => {
          for (const b of bejegyzesek) {
            if (b.isIntersecting) {
              megmutat(b.target);
              figyelo.unobserve(b.target);
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      varakozok.forEach((el) => figyelo.observe(el));
    }

    /* Biztonsági háló: ha a figyelő nem létezik vagy nem lép működésbe,
       a tartalom akkor sem maradhat rejtve. */
    const ora = setTimeout(() => {
      document.querySelectorAll('[data-feltun]:not([data-feltun="kesz"])').forEach(megmutat);
    }, BIZTONSAGI_IDO);

    return () => {
      clearTimeout(ora);
      figyelo?.disconnect();
    };
  }, [kulcs]);
}
