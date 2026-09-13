import { useEffect } from 'react';
import { navigal, useMeta, useRoute } from './router.js';
import { useFeltunes } from './mozgas.js';
import Fejlec from './components/Fejlec.jsx';
import { sz } from './nyelv/index.js';
import Labjegyzet from './components/Labjegyzet.jsx';
import FooldalPage from './components/FooldalPage.jsx';
import TervezoPage from './components/TervezoPage.jsx';
import UtvonalakPage from './components/UtvonalakPage.jsx';
import UtvonalPage from './components/UtvonalPage.jsx';
import ImpresszumPage from './components/ImpresszumPage.jsx';
import NincsOldal from './components/NincsOldal.jsx';
import { peldaSzerint } from './data/peldak.js';

export default function App() {
  const { path } = useRoute();

  /* A „honnan hova” külön oldal megszűnt: ugyanazt csinálta, mint a tervező,
     csak rajzolás helyett beírásból. Beolvadt a tervező paneljébe. A régi
     címre érkezőket átirányítjuk, hogy a megosztott linkek ne törjenek el. */
  /* A két összevont oldal címe. A szerver is átirányítja őket (_redirects,
     .htaccess, vercel.json), ez az oldalon belüli navigációra való. */
  const ATIRANYIT = { '/honnan-hova': '/tervezo', '/rolad': '/impresszum' };
  useEffect(() => {
    const cel = ATIRANYIT[path];
    if (cel) navigal(cel, { replace: true });
  }, [path]);
  const utvonalId = path.match(/^\/utvonalak\/(.+)$/)?.[1];
  const pelda = utvonalId ? peldaSzerint(utvonalId) : null;

  const meta = (() => {
    if (utvonalId) {
      return pelda
        ? {
            title: `${pelda.nev} — Túrabakancs`,
            description: `${pelda.hol}. ${pelda.jegyzet}`,
          }
        : { title: 'Nincs ilyen útvonal — Túrabakancs', description: 'Ez a példa nem található.' };
    }
    const oldalak = {
      '/tervezo': [sz('meta.tervezoCim'), sz('meta.tervezoLeiras')],
      '/utvonalak': [sz('meta.peldakCim'), sz('meta.peldakLeiras')],
      '/impresszum': [sz('meta.impresszumCim'), sz('meta.impresszumLeiras')],
    };
    if (path !== '/' && !ATIRANYIT[path] && !oldalak[path]) {
      return { title: sz('meta.nincsCim'), description: sz('meta.nincsLeiras') };
    }
    const [title, description] = oldalak[path] ?? [sz('meta.fooldalCim'), sz('meta.fooldalLeiras')];
    return { title, description };
  })();

  useMeta(meta);
  useFeltunes(path);

  const oldal = () => {
    if (utvonalId) return <UtvonalPage id={utvonalId} />;
    if (path === '/utvonalak') return <UtvonalakPage />;
    if (path === '/impresszum') return <ImpresszumPage />;
    if (path === '/tervezo') return <TervezoPage />;
    if (path === '/') return <FooldalPage />;
    /* Amíg a fenti useEffect átirányít, ne villanjon fel a 404. */
    if (ATIRANYIT[path]) return null;
    return <NincsOldal />;
  };

  /* A tervező a teljes magasságot kapja, a szöveges oldalak nem. */
  const tervezoNezet = path === '/tervezo';

  return (
    <>
      <Fejlec />
      <main className={`fo${tervezoNezet ? ' fo--tervezo' : ''}`} key={path}>
        {/* A burkolat adja az oldalváltás áttűnését; a key miatt minden
            címváltásnál újra lejátszódik. A tervezőnél kimarad, mert ott
            a térkép újrarajzolása amúgy is mozgás. */}
        {tervezoNezet ? oldal() : <div className="oldalvaltas">{oldal()}</div>}
      </main>
      {!tervezoNezet && <Labjegyzet />}
    </>
  );
}
