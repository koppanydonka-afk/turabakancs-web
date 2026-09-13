import { useEffect, useRef, useState } from 'react';
import { kodSzerint, mostaniFok } from '../data/idojaras.js';
import { useIdoHely } from '../data/idoHely.js';
import { sz } from '../nyelv/index.js';

/* Hőmérséklet a fejlécben, a sötét mód mellett.

   Az időjárás eddig a térképen ült, saját ablakkal és öt nappal. Tervezés
   közben ebből egyetlen dolog kell folyamatosan — hány fok van most —, a
   többi csak elvette a helyet a térképtől.

   Helyet a tervező ad neki. Ahol nincs hely, ott nincs hőmérséklet sem:
   nem találunk ki egy várost a látogató helyett, és nem is kérdezzük meg,
   hol van. */

/* Negyedóra. A hőmérséklet ennél gyorsabban nem mozdul, az Open-Meteo meg
   ingyenes és kulcs nélküli — nem verjük percenként. */
const FRISSITES = 15 * 60 * 1000;

export default function IdoFok() {
  const hely = useIdoHely();
  const [ido, setIdo] = useState(null);
  /* Az első lekérdezés ne várjon: betöltéskor a fok másfél másodperccel
     később ugrott be, és ez látszott is. A késleltetés csak arra kell,
     hogy rajzolás közben ne kérdezzünk minden kattintásnál. */
  const voltMar = useRef(false);
  const kulcs = hely ? `${hely[0]},${hely[1]}` : null;

  useEffect(() => {
    if (!hely) {
      setIdo(null);
      return undefined;
    }
    let ervenyes = true;
    let utoljara = 0;

    const lekerdez = () => {
      if (document.hidden) return;
      utoljara = Date.now();
      mostaniFok(hely)
        .then((m) => ervenyes && setIdo(m))
        /* Hiba esetén nincs szám és nincs hibaüzenet sem: a fejlécben egy
           piros felirat többet zavarna, mint amennyit ér. */
        .catch(() => ervenyes && setIdo(null));
    };

    /* Betöltéskor azonnal, utána másfél másodperc késleltetéssel:
       rajzolás közben a kezdőpont többször változik egymás után —
       kattintáskor, majd amikor a vonal ösvényre kerül —, így egy
       rajzolásból egy kérdés lesz. */
    const keses = voltMar.current ? 1500 : 0;
    voltMar.current = true;
    const ora = setTimeout(lekerdez, keses);
    const ismetlo = setInterval(lekerdez, FRISSITES);

    /* A háttérbe tett fülön az időzítőt fékezi a böngésző, ezért
       visszatéréskor is megnézzük, nem állt-e meg a szám. */
    const haRegi = () => {
      if (!document.hidden && Date.now() - utoljara > FRISSITES) lekerdez();
    };
    document.addEventListener('visibilitychange', haRegi);

    return () => {
      ervenyes = false;
      clearTimeout(ora);
      clearInterval(ismetlo);
      document.removeEventListener('visibilitychange', haRegi);
    };
    /* A kulcs a kerekített koordináta: száz méteren belüli elmozdulásra
       nem kérdezünk újra. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kulcs]);

  if (!ido) return null;

  return (
    <span className="ido-fok" title={sz('fejlec.fok', { fok: ido.fok, ido: kodSzerint(ido.kod).szo })}>
      <span className="csak-olvasonak">{sz('fejlec.jelenleg')} </span>{ido.fok}°
    </span>
  );
}
