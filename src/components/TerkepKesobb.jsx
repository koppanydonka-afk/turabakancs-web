import { Suspense, lazy, useEffect } from 'react';
import { stilustKer } from '../data/terkepForras.js';

/* A térkép külön csomagban.

   A MapLibre és a hozzá tartozó stílus a teljes kód jelentős része —
   nagyobb, mint a korábbi Leaflet volt —, a főoldalnak, a példák
   listájának és a szöveges oldalaknak viszont semmi szükségük rá. Ez a
   burkolat csak akkor tölti le, amikor tényleg megjelenik térkép.

   Amíg tölt, a helye megmarad — nem ugrál az elrendezés. */

const Terkep = lazy(() => import('./Terkep.jsx'));

export default function TerkepKesobb(props) {
  /* A stíluslapot már most elkérjük, hogy a térkép kódjával PÁRHUZAMOSAN
     töltsön, ne utána (lásd terkepForras.js). Ez a burkolat a fő kódban
     van, tehát azonnal fut; a térkép darabja még csak ezután érkezik. */
  useEffect(() => { stilustKer(); }, []);

  return (
    <Suspense
      fallback={
        <div className="terkep terkep--tolt">
          <span className="tolt">
            <span className="tolt__pörgo" aria-hidden="true" />
            Térkép betöltése…
          </span>
        </div>
      }
    >
      <Terkep {...props} />
    </Suspense>
  );
}
