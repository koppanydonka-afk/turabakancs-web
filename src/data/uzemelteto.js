/* Az üzemeltető adatai — ez az egyetlen hely, ahol szerkeszteni kell.

   Az `email` szándékosan üres: még nincs olyan postafiók, amit ide be
   lehetne írni. Amíg üres, az impresszum kiírja, hogy nincs elérhetőség
   — nem tesz úgy, mintha lenne.

   Az itt szereplő cím MEGJELENIK a nyilvános impresszum oldalon, és ez
   visszafordíthatatlan: a levélszemét-gyűjtő robotok begyűjtik. Ezért:

   - NE a személyes címedet írd ide, hanem egy erre a célra készültet.
   - Csak olyat írj be, ami TÉNYLEG a tiéd. Ha a cím máshoz tartozik, a
     neked szánt levelek hozzá mennek, ő pedig kéretlen postát kap.

   Ha megvan a fiók, elég ezt az egy sort átírni — az impresszum és a
   lábjegyzet magától követi. */

export const UZEMELTETO = {
  nev: 'Donka Koppány',
  email: '',
  varos: '',
};

export const vanElerhetoseg = () => Boolean(UZEMELTETO.email);
