import { useEffect } from 'react';
import { navigal, useMeta, useRoute } from './router.js';
import { useFeltunes } from './mozgas.js';
import Fejlec from './components/Fejlec.jsx';
import Labjegyzet from './components/Labjegyzet.jsx';
import FooldalPage from './components/FooldalPage.jsx';
import TervezoPage from './components/TervezoPage.jsx';
import UtvonalakPage from './components/UtvonalakPage.jsx';
import UtvonalPage from './components/UtvonalPage.jsx';
import RoladPage from './components/RoladPage.jsx';
import ImpresszumPage from './components/ImpresszumPage.jsx';
import { peldaSzerint } from './data/peldak.js';

export default function App() {
  const { path } = useRoute();

  /* A „honnan hova” külön oldal megszűnt: ugyanazt csinálta, mint a tervező,
     csak rajzolás helyett beírásból. Beolvadt a tervező paneljébe. A régi
     címre érkezőket átirányítjuk, hogy a megosztott linkek ne törjenek el. */
  useEffect(() => {
    if (path === '/honnan-hova') navigal('/tervezo', { replace: true });
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
      '/tervezo': [
        'Tervező — Túrabakancs',
        'Rajzolj útvonalat a térképre, tegyél ki jelöléseket, oszd meg egy linkkel.',
      ],
      '/utvonalak': [
        'Példa útvonalak — Túrabakancs',
        'Nyolc kész vonal a térképen, amit megnyithatsz és továbbrajzolhatsz.',
      ],
      '/impresszum': [
        'Impresszum — Túrabakancs',
        'Ki üzemelteti az oldalt, és mire jó. Ingyenes, nem kereskedelmi eszköz.',
      ],
      '/rolad': [
        'Mit tudunk rólad — Túrabakancs',
        'Nincs fiók, nincs süti, nincs mérőkód. Amit rajzolsz, a böngésződben marad.',
      ],
    };
    const [title, description] = oldalak[path] ?? [
      'Túrabakancs — túraútvonalak, jelzések, vélemények',
      'Útvonaltervező térkép, a magyar turistajelzések magyarázata és név nélküli vélemények. Fiók nélkül, adatgyűjtés nélkül.',
    ];
    return { title, description };
  })();

  useMeta(meta);
  useFeltunes(path);

  const oldal = () => {
    if (utvonalId) return <UtvonalPage id={utvonalId} />;
    if (path === '/utvonalak') return <UtvonalakPage />;
    if (path === '/rolad') return <RoladPage />;
    if (path === '/impresszum') return <ImpresszumPage />;
    if (path === '/tervezo') return <TervezoPage />;
    return <FooldalPage />;
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
