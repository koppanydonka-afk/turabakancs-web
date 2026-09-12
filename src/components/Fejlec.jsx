import { useEffect, useState } from 'react';
import Vedjegy from './Vedjegy.jsx';
import { temaValt, useTema } from '../data/tema.js';
import { useRoute } from '../router.js';

/* Fejléc: hamburger balra, szóvédjegy középen, sötét mód jobbra.

   A „Mit tudunk rólad” szándékosan nincs a menüben — az oldal alján,
   apró betűvel van a helye, ahogy az ilyesmit keresni szokás. */

const MENU = [
  { cim: '/', nev: 'Főoldal', leiras: 'Jelzések, példák és vélemények' },
  { cim: '/tervezo', nev: 'Tervező', leiras: 'Írd be a két helyet, vagy rajzolj a térképre' },
  { cim: '/utvonalak', nev: 'Példák', leiras: 'Nyolc kész vonal, amiből kiindulhatsz' },
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
          aria-label={nyitva ? 'Menü bezárása' : 'Menü megnyitása'}
        >
          <span className={`hamburger__vonalak${nyitva ? ' hamburger__vonalak--x' : ''}`} aria-hidden="true">
            <i /><i /><i />
          </span>
        </button>

        <a className="vedjegy" href="/" aria-label="Túrabakancs — kezdőlap">
          <Vedjegy magassag={26} />
        </a>

        <button className="tema-gomb" onClick={temaValt} aria-label="Sötét mód váltása">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4z" fill="currentColor" />
          </svg>
        </button>
      </header>

      {nyitva && (
        <div className="menu-fatyol" onClick={() => setNyitva(false)} aria-hidden="true" />
      )}

      <nav id="fomenu" className={`fomenu${nyitva ? ' fomenu--nyitva' : ''}`} aria-label="Fő menü">
        {MENU.map((elem) => (
          <a
            key={elem.cim}
            href={elem.cim}
            className={`fomenu__elem${path === elem.cim ? ' fomenu__elem--aktiv' : ''}`}
            aria-current={path === elem.cim ? 'page' : undefined}
          >
            <span className="fomenu__nev">{elem.nev}</span>
            <span className="fomenu__leiras">{elem.leiras}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
