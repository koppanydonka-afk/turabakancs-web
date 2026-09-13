import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/* Oldal-specifikus vezérlők a fejléc sávjában.

   A tervező vezérlői eddig a térképen lebegtek. Most a fejlécbe kerülnek,
   a fok és a sötét mód mellé — de a tervező oldal rendeli őket, nem a
   fejléc: a fejléc minden oldalon ugyanaz marad, csak van benne egy hely,
   ahova az oldal betehet valamit.

   Előállításkor (szerveroldalon) nincs DOM, ezért az első renderelés üres;
   a vezérlők a böngészőben kerülnek a helyükre. A kész HTML-ben így nem is
   látszanak — ami helyes: JavaScript nélkül nincs is mit vezérelni. */

export default function FejlecEszkozok({ children }) {
  const [hely, setHely] = useState(null);

  useEffect(() => {
    setHely(document.getElementById('fejlec-eszkozok'));
  }, []);

  return hely ? createPortal(children, hely) : null;
}
