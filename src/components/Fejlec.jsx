import { useEffect, useState } from 'react';
import IdoFok from './IdoFok.jsx';
import Vedjegy from './Vedjegy.jsx';
import { temaValt, useTema } from '../data/tema.js';
import { ut, useRoute } from '../router.js';
import { sz } from '../nyelv/index.js';

/* Fejléc: hamburger balra, szóvédjegy középen, jobbra a hőmérséklet és a
   sötét mód.

   A tervező vezérlői egy ideig itt ültek, de a helyük a térkép bal szélén
   van, ott, ahol a munka történik. A fejléc minden oldalon ugyanaz.

   Az impresszum szándékosan nincs a menüben — az oldal alján,
   apró betűvel van a helye, ahogy az ilyesmit keresni szokás. */

const MENU = [
  { cim: '/', kulcs: 'fooldal' },
  { cim: '/tervezo', kulcs: 'tervezo' },
  { cim: '/utvonalak', kulcs: 'peldak' },
];

export default function Fejlec() {
  const { path } = useRoute();
  const [nyitva, setNyitva] = useState(false);
  useTema();

  /* Útvonalváltáskor csukódjon be magától. */
  useEffect(() => setNyitva(false), [path]);

  /* Escape zárja, és nyitva ne görögjön a háttér. */
  useEffect(() => {
    if (!nyitva) return undefined;
    const kezel = (e) => e.key === 'Escape' && setNyitva(false);
    document.addEventListener('keydown', kezel);
    document.body.classList.add('nincs-gorgetes');
    return () => {
      document.removeEventListener('keydown', kezel);
      document.body.classList.remove('nincs-gorgetes');
    };
  }, [nyitva]);

  return (
    <>
      <header className="fejlec">
        <button
          className="hamburger"
          onClick={() => setNyitva((v) => !v)}
          aria-expanded={nyitva}
          aria-controls="fomenu"
          aria-label={nyitva ? sz('fejlec.menuZar') : sz('fejlec.menuNyit')}
        >
          <span className={`hamburger__vonalak${nyitva ? ' hamburger__vonalak--x' : ''}`} aria-hidden="true">
            <i /><i /><i />
          </span>
        </button>

        <a className="vedjegy" href={ut('/')} aria-label={sz('fejlec.kezdolap')}>
          <Vedjegy magassag={26} />
        </a>

        <div className="fejlec__jobb">
          {/* Hány fok van most — ennyi az időjárás, panel és részletek nélkül. */}
          <IdoFok />

          <button className="tema-gomb" onClick={temaValt} aria-label={sz('fejlec.sotetMod')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      {nyitva && (
        <div className="menu-fatyol" onClick={() => setNyitva(false)} aria-hidden="true" />
      )}

      <nav id="fomenu" className={`fomenu${nyitva ? ' fomenu--nyitva' : ''}`} aria-label={sz('fejlec.foMenu')}>
        {MENU.map((elem) => (
          <a
            key={elem.cim}
            href={ut(elem.cim)}
            className={`fomenu__elem${path === elem.cim ? ' fomenu__elem--aktiv' : ''}`}
            aria-current={path === elem.cim ? 'page' : undefined}
          >
            <span className="fomenu__nev">{sz(`menu.${elem.kulcs}`)}</span>
            <span className="fomenu__leiras">{sz(`menu.${elem.kulcs}Leiras`)}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
