/* Az üzemeltető adatai — ez az egyetlen hely, ahol szerkeszteni kell.

   ════════════════════════════════════════════════════════════════════
   AZ E-MAIL-CÍM SZÁNDÉKOSAN ÜRES. Neked kell beírnod.
   ════════════════════════════════════════════════════════════════════

   Nem tettem be magamtól a személyes címedet, mert a nyilvános oldalra
   kiírt e-mail visszafordíthatatlan: a levélszemét-gyűjtő robotok percek
   alatt begyűjtik, és utána nem lehet visszavonni.

   Amit érdemes megfontolni:
   - NE a személyes címedet írd ide. Készíts egy külön címet erre
     (például kapcsolat@turabakancs.com, ha később e-mailt is kötsz a
     domainhez, vagy egy ingyenes fiókot csak erre a célra).
   - Amíg üres, az impresszum oldal kiírja, hogy hiányzik — nem tesz
     úgy, mintha lenne elérhetőség.

   A név kitöltve maradhat: az a git-előzményben és a domain
   nyilvántartásában amúgy is szerepel. */

export const UZEMELTETO = {
  nev: 'Donka Koppány',
  email: '',
  varos: '',
};

export const vanElerhetoseg = () => Boolean(UZEMELTETO.email);
