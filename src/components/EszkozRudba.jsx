import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/* A rétegikonok a térkép eszközrúdjába.

   A rudat a tervező rendeli (ő tudja, mi van még rajta), a rétegikonokat
   viszont a térkép — nála van a hozzájuk tartozó állapot és a lekérdezés.
   A kettő nem szülő-gyerek, ezért a térkép ide portálozza a magáét.

   Előállításkor (szerveroldalon) nincs DOM, ezért az első renderelés üres;
   az ikonok a böngészőben kerülnek a helyükre. A kész HTML-ben nincsenek
   benne — ami helyes: JavaScript nélkül nincs is mit kapcsolgatni. */

export default function EszkozRudba({ children }) {
  const [hely, setHely] = useState(null);

  useEffect(() => {
    setHely(document.getElementById('terkep-eszkozok'));
  }, []);

  return hely ? createPortal(children, hely) : null;
}
