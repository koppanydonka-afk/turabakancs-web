/* A szóvédjegy: a név, alatta a nyomvonal.

   A KORÁBBI JELRŐL: a „k” helyén egy bakancs állt, de a széles szár és a
   talp együtt egy L betűt adott ki — a név „TúrabaLancs”-nak olvasódott,
   a böngésző lapfülén is. Egy jel, amit félreolvasnak, nem jel.

   AMI HELYETTE VAN: a vonal, ahogy a térképen kinéz — üreges rajtpont,
   tömör célpont —, és balról jobbra EMELKEDIK a szó alatt. A név így nem
   egy címke a jel mellett, hanem maga a túra. A betűk végig betűk
   maradnak, tehát nincs mit félreolvasni.

   MIÉRT ÍGY VAN MEGÍRVA: a vonal a saját dobozának bal ALSÓ sarkából megy
   a jobb FELSŐ sarkába, a két pont pedig ugyanezekhez a sarkokhoz van
   kötve. Így nincs egyetlen kézzel belőtt eltolás sem: a jel bármekkora
   szövegméretnél a helyén marad.

   A vonal vízszintesen nyúlik a szó hosszához (a német és a magyar név
   nem egyforma széles), a vastagsága viszont nem torzulhat vele — ezt a
   `vector-effect="non-scaling-stroke"` intézi. */

export default function Vedjegy({ magassag = 28 }) {
  return (
    <span className="vedjegy__lockup" style={{ '--vj-magassag': `${magassag}px` }}>
      <span className="vedjegy__szo">Túrabakancs</span>

      <span className="vedjegy__ut" aria-hidden="true">
        <svg
          className="vedjegy__vonal"
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          focusable="false"
        >
          <path
            /* Nem egyenletes emelkedő: a 44–52 közti szakaszon visszaesik
               egy kicsit. Egy valódi nyomvonal sem megy végig felfelé, és
               ettől lesz nyomvonal ahelyett, hogy aláhúzás lenne. */
            d="M0 18.6C8 18.6 10.5 16.4 17.5 15.9C24.5 15.4 26.5 12.4 34 12C41 11.6 44 13.4 52 12.4C60 11.4 62 7.6 70.5 7.1C78 6.6 80 3.9 88 2.9C93 2.3 96.5 2 100 1.7"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* A két végpont: üreges rajt, tömör cél — ugyanaz, mint a térképen. */}
        <span className="vedjegy__rajt" />
        <span className="vedjegy__cel" />
      </span>
    </span>
  );
}
