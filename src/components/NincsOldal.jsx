/* 404.

   Korábban minden ismeretlen cím a kezdőlapra esett vissza. Ez kényelmesnek
   tűnik, de „soft 404”: a látogató nem érti, miért nem azt kapta, amit kért,
   a kereső pedig létező oldalként indexeli a hibás címeket. */

import { ut } from '../router.js';
import { sz } from '../nyelv/index.js';

export default function NincsOldal() {
  return (
    <section className="oldal oldal--szoveg">
      <header className="oldal__fej">
        <h1 className="kalap">{sz('nincs.cim')}</h1>
        <p className="oldal__bevezeto">{sz('nincs.magyarazat')}</p>
      </header>

      <div className="szoveg">
        <p>{sz('nincs.lead')}</p>
        <ul>
          <li><a href={ut('/')}>{sz('nincs.kezdolap')}</a></li>
          <li><a href={ut('/tervezo')}>{sz('nincs.tervezo')}</a> — {sz('nincs.tervezoLeiras')}</li>
          {/* Szám nélkül: a példák bővítése ne írja át ezt a mondatot. A
              darabszám korábban „18”-on ragadt, miközben már több volt. */}
          <li><a href={ut('/utvonalak')}>{sz('nincs.peldak')}</a> — {sz('nincs.peldakLeiras')}</li>
        </ul>
      </div>
    </section>
  );
}
