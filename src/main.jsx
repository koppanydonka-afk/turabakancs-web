import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/app.css';
import App from './App.jsx';
import { temaAlkalmaz } from './data/tema.js';
import { ALAP_NYELV, bongeszoNyelve, nyelvesUt, utbolNyelv } from './nyelv/nyelvek.js';
import { nyelvetBetolt } from './nyelv/index.js';

temaAlkalmaz();

/* Jelezzük, hogy fut a JavaScript. A görgetéses feltűnés rejtett
   kezdőállapota ehhez az osztályhoz van kötve: JS nélkül a tartalom
   egyszerűen látszik, nem tűnik el. */
document.documentElement.classList.add('mozgas');

/* Offline működés. Csak élesben regisztráljuk: fejlesztés közben a service
   worker eltárolná a régi kódot, és órákig azt hinnéd, nem hat a javításod. */
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Ha nem sikerül, az oldal ettől még teljesen működik. */
    });
  });
}

/* Melyik nyelven fut ez a lap, és át kell-e irányítani.

   NINCS NYELVVÁLTÓ: a látogató a böngészője nyelvén kapja az oldalt. Ez
   azonban csak akkor dönthet, ha a cím maga nem mond mást — ha valaki egy
   /en/ linket kapott, azt tiszteletben tartjuk, akkor is, ha a böngészője
   németül beszél. Ezért az átirányítás CSAK az előtag nélküli (magyar)
   címekről indul, és csak egyszer, a betöltéskor.

   `replaceState`, nem új navigáció: így a Vissza gomb nem pattog a két
   cím között. */
function nyelvetValaszt() {
  const { nyelv, ut } = utbolNyelv(window.location.pathname.replace(/\/+$/, '') || '/');
  if (nyelv !== ALAP_NYELV) return nyelv;

  const kivant = bongeszoNyelve();
  if (!kivant || kivant === ALAP_NYELV) return ALAP_NYELV;

  window.history.replaceState({}, '', nyelvesUt(kivant, ut) + window.location.search);
  return kivant;
}

/* A szótár megvárása előbbre való a megjelenítésnél: fél másodperc magyar
   szöveg egy német oldalon rosszabb, mint fél másodperc üres hely. Az
   előrenderelt HTML addig is ott van a lapon, a helyes nyelven. */
nyelvetBetolt(nyelvetValaszt()).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
