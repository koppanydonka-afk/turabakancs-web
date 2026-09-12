/* 404.

   Korábban minden ismeretlen cím a kezdőlapra esett vissza. Ez kényelmesnek
   tűnik, de „soft 404”: a látogató nem érti, miért nem azt kapta, amit kért,
   a kereső pedig létező oldalként indexeli a hibás címeket. */

export default function NincsOldal() {
  return (
    <section className="oldal oldal--szoveg">
      <header className="oldal__fej">
        <h1 className="kalap">Nincs ilyen oldal</h1>
        <p className="oldal__bevezeto">
          Vagy elgépelted a címet, vagy olyan oldalra mutat, ami már nincs meg.
        </p>
      </header>

      <div className="szoveg">
        <p>Innen tudsz továbbmenni:</p>
        <ul>
          <li><a href="/">Kezdőlap</a></li>
          <li><a href="/tervezo">Útvonaltervező</a> — rajzolj egy túrát a térképre</li>
          <li><a href="/utvonalak">Kész útvonalak</a> — 18 példa, amit megnyithatsz</li>
        </ul>
      </div>
    </section>
  );
}
