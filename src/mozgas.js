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
    const lathato = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.92;

    elemek.filter(lathato).forEach(megmutat);

    const varakozok = elemek.filter((el) => el.dataset.feltun !== 'kesz');
    if (varakozok.length === 0) return undefined;

    /* A háló csak akkor kapcsol be, ha a figyelő NEM ad életjelet. Eddig
       feltétel nélkül mindent megmutatott másfél másodperc után — vagyis a
       görgetésre feltűnés ennyi ideig élt, azután a képernyőn kívüli lapok
       is „készen” álltak. A körablakos állomásoknál ez különösen látszott:
       mire odaértél, már rég kinyíltak. */
    let eletjel = false;
    let figyelo = null;

    if ('IntersectionObserver' in window) {
      /* A figyelő bejegyzéseit NEM olvassuk ki egyenként. Egy ugrás —
         horgonyra kattintás, a böngésző visszaállította görgetés, vagy egy
         `scrollTo` — átviheti az elemet a képernyő alól a képernyő fölé
         egyetlen képkocka alatt; a metszés ilyenkor „nem”-ből „nem”-be
         megy, és arra a figyelő nem szól. Enélkül az a lap SOHA nem jelent
         volna meg. Ezért ha bármi mozdul, mindet megnézzük. */
      const nezd = () => {
        eletjel = true;
        for (const el of varakozok) {
          if (el.dataset.feltun === 'kesz') continue;
          if (!lathato(el)) continue;
          megmutat(el);
          figyelo.unobserve(el);
        }
      };
      figyelo = new IntersectionObserver(nezd, { rootMargin: '0px 0px -8% 0px' });
      varakozok.forEach((el) => figyelo.observe(el));
    }

    /* Biztonsági háló: ha a figyelő nem létezik vagy nem lép működésbe,
       a tartalom akkor sem maradhat rejtve. */
    const ora = setTimeout(() => {
      if (eletjel) return;
      document.querySelectorAll('[data-feltun]:not([data-feltun="kesz"])').forEach(megmutat);
    }, BIZTONSAGI_IDO);

    return () => {
      clearTimeout(ora);
      figyelo?.disconnect();
    };
  }, [kulcs]);
}

/* Eltűnés görgetéskor.

   Ami kifutott a képernyő tetején, elhalványul — és visszafelé görgetve
   újra előjön. Nem görgetésfigyelővel: az minden képkockán dolgozna. Egy
   metszésfigyelő elég, mert csak egy pillanat érdekes: amikor az elem alja
   a küszöb fölé ér.

   A figyelő bejegyzéseit viszont NEM olvassuk ki egyenként. Egy ugrás —
   horgonyra kattintás, visszaállított görgetés, vagy egy `scrollTo` —
   átviheti az elemet a képernyő alól a képernyő fölé EGYETLEN képkocka
   alatt; a metszés ilyenkor „nem"-ből „nem"-be megy, és arra a figyelő nem
   szól. Ezért ha bármelyik elem mozdul, MINDET újraszámoljuk a helyéből.
   Ez ritkán fut, és csak akkor, ha tényleg történt valami. */
const KUSZOB_ARANY = 0.12;

export function useElTunes(kulcs) {
  useEffect(() => {
    const elemek = Array.from(document.querySelectorAll('[data-tunik]'));
    if (elemek.length === 0 || !('IntersectionObserver' in window)) return undefined;

    const frissit = () => {
      const hatar = window.innerHeight * KUSZOB_ARANY;
      for (const el of elemek) {
        const uj = el.getBoundingClientRect().bottom <= hatar ? 'el' : '';
        if (el.dataset.tunik !== uj) el.dataset.tunik = uj;
      }
    };

    const figyelo = new IntersectionObserver(frissit, {
      rootMargin: `-${KUSZOB_ARANY * 100}% 0px 0px 0px`,
      threshold: 0,
    });
    elemek.forEach((el) => figyelo.observe(el));
    window.addEventListener('resize', frissit);
    return () => {
      figyelo.disconnect();
      window.removeEventListener('resize', frissit);
    };
  }, [kulcs]);
}
