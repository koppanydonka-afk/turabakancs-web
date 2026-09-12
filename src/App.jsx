import { useMeta, useRoute } from './router.js';
import Fejlec from './components/Fejlec.jsx';
import Labjegyzet from './components/Labjegyzet.jsx';
import FooldalPage from './components/FooldalPage.jsx';
import TervezoPage from './components/TervezoPage.jsx';
import HonnanHovaPage from './components/HonnanHovaPage.jsx';
import UtvonalakPage from './components/UtvonalakPage.jsx';
import UtvonalPage from './components/UtvonalPage.jsx';
import RoladPage from './components/RoladPage.jsx';
import ImpresszumPage from './components/ImpresszumPage.jsx';
import { peldaSzerint } from './data/peldak.js';

export default function App() {
  const { path } = useRoute();
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
      '/honnan-hova': [
        'Honnan hova — Túrabakancs',
        'Írd be a két helyet, és megmondjuk a távot, az emelkedőt és a menetidőt. Térkép nélkül is.',
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

  const oldal = () => {
    if (utvonalId) return <UtvonalPage id={utvonalId} />;
    if (path === '/utvonalak') return <UtvonalakPage />;
    if (path === '/rolad') return <RoladPage />;
    if (path === '/impresszum') return <ImpresszumPage />;
    if (path === '/tervezo') return <TervezoPage />;
    if (path === '/honnan-hova') return <HonnanHovaPage />;
    return <FooldalPage />;
  };

  /* A tervező a teljes magasságot kapja, a szöveges oldalak nem. */
  const tervezoNezet = path === '/tervezo';

  return (
    <>
      <Fejlec />
      <main className={`fo${tervezoNezet ? ' fo--tervezo' : ''}`} key={path}>
        {oldal()}
      </main>
      {!tervezoNezet && <Labjegyzet />}
    </>
  );
}
