import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/app.css';
import App from './App.jsx';
import { temaAlkalmaz } from './data/tema.js';

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
