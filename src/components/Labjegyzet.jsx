/* Lábjegyzet. Az impresszum — benne a felelősséggel és az adatkezeléssel —
   itt van, apró betűvel, nem menüpontként: nem ott keresik. */

import { ut } from '../router.js';
import { sz } from '../nyelv/index.js';

export default function Labjegyzet({ tomor = false }) {
  /* A térkép mondatába egy hivatkozás kerül; a szótárban {osm} jelöli a
     helyét, hogy a szórend nyelvenként szabad maradjon. */
  const [elotte, utana] = sz('lab.terkep').split('{osm}');
  return (
    <footer className={`labjegyzet${tomor ? ' labjegyzet--tomor' : ''}`}>
      {!tomor && (
        <p>
          {elotte}
          <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
          {utana}
        </p>
      )}
      <p className="apro">
        {sz('lab.becsles')}{' '}
        <a href={ut('/impresszum')}>{sz('lab.impresszum')}</a>
      </p>
    </footer>
  );
}
