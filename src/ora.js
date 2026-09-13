/* „Most” — ami tényleg most van.

   A főoldal napkelte/napnyugta adata eddig egyszer, rendereléskor
   számolódott. Aki nyitva hagyta a lapot, az másnap is a tegnapi időket
   látta, a „mennyi világos van még” visszaszámláló pedig megállt ott, ahol
   a lap betöltődött.

   Ugyanez volt a helyzet a tervező tanácsaival: a „ma 19:05-kor sötétedik”
   is befagyott.

   Két dolog kell hozzá:

   - percenkénti frissítés, mert a visszaszámláló percben mér;
   - frissítés akkor is, amikor a lap újra láthatóvá válik. Ez a gyakoribb
     eset: valaki félreteszi a fület, és másnap tér vissza rá. Ilyenkor az
     időzítő is aludhatott (a böngészők fékezik a háttérben futó lapokat),
     tehát nem elég rá hagyatkozni. */

import { useEffect, useState } from 'react';

export function useMost(idokozMs = 60000) {
  const [most, setMost] = useState(() => new Date());

  useEffect(() => {
    const frissit = () => setMost(new Date());

    /* Az első ütés a következő egész percre essen, különben az óra
       fél perccel csúszva váltana. */
    let ismetlo;
    const kesleltetes = idokozMs - (Date.now() % idokozMs);
    const elso = setTimeout(() => {
      frissit();
      ismetlo = setInterval(frissit, idokozMs);
    }, kesleltetes);

    const ujraLathato = () => {
      if (!document.hidden) frissit();
    };
    document.addEventListener('visibilitychange', ujraLathato);
    window.addEventListener('focus', frissit);

    return () => {
      clearTimeout(elso);
      clearInterval(ismetlo);
      document.removeEventListener('visibilitychange', ujraLathato);
      window.removeEventListener('focus', frissit);
    };
  }, [idokozMs]);

  return most;
}
