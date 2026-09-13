/* Magyar — ez a forrásnyelv.

   Minden más nyelv ennek a kulcsaira felel. Ha itt új kulcs kerül be, a
   többi fájlban is meg kell jelennie; a hiányzót a `nyelv/index.js`
   magyarral pótolja, hogy soha ne üres doboz legyen a felületen.

   A kapcsos zárójeles helyek ({km}, {perc}) behelyettesítődnek. A
   sorrendjük nyelvenként más lehet — ezért nevesítettek, nem sorszámozottak. */

export default {
  /* ---- Fejléc, menü ---- */
  'fejlec.kezdolap': 'Túrabakancs — kezdőlap',
  'fejlec.menuNyit': 'Menü megnyitása',
  'fejlec.menuZar': 'Menü bezárása',
  'fejlec.foMenu': 'Fő menü',
  'fejlec.sotetMod': 'Sötét mód váltása',
  'fejlec.fok': 'Most {fok} fok — {ido}',
  'fejlec.jelenleg': 'Jelenleg',

  'menu.fooldal': 'Főoldal',
  'menu.fooldalLeiras': 'Jelzések, példák és vélemények',
  'menu.tervezo': 'Tervező',
  'menu.tervezoLeiras': 'Írd be a két helyet, vagy rajzolj a térképre',
  'menu.peldak': 'Példák',
  'menu.peldakLeiras': 'Kész vonalak, amikből kiindulhatsz',

  /* ---- Lábjegyzet ---- */
  'lab.terkep': 'A térképet az {osm} közreműködői készítik, és ők is adják hozzá a csempéket.',
  'lab.becsles': 'A távolság és a menetidő becslés — a terepen a jelzett turistautak a mérvadók.',
  'lab.impresszum': 'Impresszum és adatkezelés',

  /* ---- Főoldal ---- */
  'fooldal.cim': 'Túrabakancs — túraútvonal-tervező térkép',
  'fooldal.lead': 'Térkép, amire rajzolhatsz. Kész túrák, amikből kiindulhatsz. Menetidő, ami az emelkedővel is számol.',
  'fooldal.tervezek': 'Tervezek egy túrát',
  'fooldal.peldak': 'Nézek példákat',
  'fooldal.ma': 'Ma',
  'fooldal.napkelte': 'napkelte',
  'fooldal.napnyugta': 'napnyugta',
  'fooldal.vilagosMeg': 'világos még',
  'fooldal.lement': 'lement',
  'fooldal.vanMeg': 'világos van még',
  'fooldal.marLement': 'a nap már lement',
  'fooldal.napAlap': 'Budapestre. A tervező a saját útvonalad kezdőpontjára számol.',
  'fooldal.jelzesCim': 'Mit jelent a festék a fán?',
  'fooldal.jelzesLead': 'A magyar turistajelzés két dolgot mond meg egyszerre. A szín azt, mekkora út, az alak pedig azt, mire való.',
  'fooldal.jelzesSzin': 'szín',
  'fooldal.jelzesAlak': 'alak',
  'fooldal.jelzesApro': 'Ezt nem fejből írtuk: az OpenStreetMap jelzett útjaiból ellenőriztük, mi hova vezet. A háromszöggel jelöltek neve csúcsnál vagy kilátónál végződik, a körrel jelöltek ugyanoda érnek vissza, ahonnan indultak.',
  'fooldal.keszVonal': 'Kezdd egy kész vonallal',
  'fooldal.keszVonalLead': 'Nyisd meg, húzd arrébb a pontjait, tedd rá a sajátodat.',
  'fooldal.szerintunk': 'szerintünk',
  'fooldal.osszesPelda': 'Az összes példa →',

  /* ---- Példák oldal ---- */
  'peldak.kicsi': 'Példák',
  'peldak.cim': 'Kész vonalak, amikből kiindulhatsz.',
  'peldak.bevezeto': 'Nyisd meg bármelyiket, húzd arrébb a pontjait, tegyél rá saját jelöléseket — és már a tiéd.',
  'peldak.tajegyseg': 'Tájegység',
  'peldak.mindegyik': 'Mindegyik',
  'peldak.hossz': 'Hossz',
  'peldak.nehezseg': 'Nehézség',
  'peldak.torold': 'töröld mindet',
  'peldak.szurokTorol': 'szűrők törlése',
  'peldak.utvonal': 'útvonal',
  'peldak.megnezem': 'Megnézem',
  'peldak.gyalogut': 'A vonalak a tényleges gyalogutakon futnak',
  'peldak.gyalogutUtan': ', nem két pont közé húzott egyenesen — a táv és az emelkedő ezért igaz. A terepen ettől még a jelzett turistautak és a hivatalos térképek a mérvadók.',
  'peldak.darab': '{db} vonal',

  /* ---- Egy útvonal oldala ---- */
  'utvonal.nincs': 'Ez az útvonal nincs meg.',
  'utvonal.tobbi': 'Itt a többi példa.',
  'utvonal.hossz': 'Hossz',
  'utvonal.sik': 'Sík terepre számolva; emelkedőn több.',
  'utvonal.jelolesek': 'Jelölések',
  'utvonal.kozelito': 'Hozzávetőleges vonalvezetés, nem felmért turistaút.',
  'utvonal.megnyitas': 'Megnyitás a tervezőben',
  'utvonal.gpx': 'GPX letöltése',

  /* ---- Tervező: eszközrúd ---- */
  'tervezo.honnanHova': 'Honnan hova?',
  'tervezo.adatok': 'Az útvonal adatai',
  'tervezo.adatokCimke': 'Az útvonal adatai — {km}, {ido}',
  'tervezo.eszkozok': 'Mentés, kész útvonalak, GPX',
  'tervezo.vissza': 'Egy lépés vissza',
  'tervezo.retegek': 'Mit mutasson a térkép',
  'tervezo.ujraKeres': 'Keresés ezen a területen',

  /* ---- Tervező: honnan hova ---- */
  'hh.honnan': 'Honnan',
  'hh.hova': 'Hova — ha üresen hagyod, csak odaugrunk',
  'hh.honnanHely': 'Hely neve vagy koordináta',
  'hh.hovaHely': 'Például: Dobogókő',
  'hh.innen': 'Innen indulok',
  'hh.odaugras': 'Odaugrás',
  'hh.szamolom': 'Számolom…',
  'hh.utvonalat': 'Útvonalat kérek',
  'hh.keres': 'Keresem…',
  'hh.nincsHelyzet': 'Nem kaptam meg a helyzetedet. Írd be a kiindulópontot kézzel.',

  /* ---- Tervező: adatok ---- */
  'ido.perc': '{p} perc',
  'ido.oraPerc': '{o} óra {p} perc',
  'ido.rovidPerc': '{p} perc',
  'ido.rovidOra': '{o} ó {p} p',
  'adat.hossz': 'hossz',
  'adat.emelkedo': 'emelkedő',
  'adat.lejto': 'lejtő',
  'adat.nehezseg': 'nehézség',
  'adat.tempo': 'Haladási tempó',
  'adat.tengerszint': '{also}–{felso} m tengerszint felett',
  'adat.nev': 'Például: vasárnapi kör',

  /* ---- Tervező: térkép ---- */
  'terkep.igazit': 'Ráigazítom a vonalat a valódi gyalogutakra…',
  'terkep.masodik': 'Jelöld be a második pontot — a vonal magától az ösvényre kerül.',
  'terkep.keszUt': 'Kész útvonal. Érints a térképre, ha újat kezdenél.',
  'terkep.sug': 'Érintsd a térképet a pontokért. A pontok húzhatók; rájuk koppintva törlődnek.',
  'terkep.keszVonal': 'Kész — a vonal a tényleges gyalogutakon fut.',
  'terkep.jelolesTorol': 'Jelölés törlése',
  'terkep.tobbVan': 'ennél több van itt — nagyíts rá',
  'terkep.keresem': 'keresem…',
  'terkep.nagyits': 'nagyíts rá',
  'terkep.hiba': 'nem sikerült',
  'terkep.nincsAdat': 'nincs adat',

  /* ---- Rétegek ---- */
  'reteg.viz': 'Ivóvíz, forrás',
  'reteg.menedek': 'Menedék, esőbeálló',
  'reteg.kozlekedes': 'Megálló, állomás',
  'reteg.parkolo': 'Parkoló',
  'reteg.kilato': 'Kilátó',
  'reteg.vendeglatas': 'Büfé, kocsma',
  'reteg.latvany': 'Látványosság',

  /* ---- Nincs ilyen oldal ---- */
  'nincs.cim': 'Nincs ilyen oldal',
  'nincs.magyarazat': 'Vagy elgépelted a címet, vagy olyan oldalra mutat, ami már nincs meg.',
  'nincs.lead': 'Innen tudsz továbbmenni:',
  'nincs.kezdolap': 'Kezdőlap',
  'nincs.tervezo': 'Útvonaltervező',
  'nincs.tervezoLeiras': 'rajzolj egy túrát a térképre',
  'nincs.peldak': 'Kész útvonalak',
  'nincs.peldakLeiras': 'példák, amiket megnyithatsz',

  /* ---- Oldalcímek és leírások (a lap fejlécében, keresőben) ---- */
  'meta.fooldalCim': 'Túrabakancs — túraútvonalak, jelzések, vélemények',
  'meta.fooldalLeiras': 'Útvonaltervező térkép, a magyar turistajelzések magyarázata és név nélküli vélemények.',
  'meta.tervezoCim': 'Tervező — Túrabakancs',
  'meta.tervezoLeiras': 'Rajzolj útvonalat a térképre, tegyél ki jelöléseket, oszd meg egy linkkel.',
  'meta.peldakCim': 'Példa útvonalak — Túrabakancs',
  'meta.peldakLeiras': 'Kész túraútvonalak a térképen, amiket megnyithatsz és továbbrajzolhatsz.',
  'meta.impresszumCim': 'Impresszum és adatkezelés — Túrabakancs',
  'meta.impresszumLeiras': 'Mire jó az oldal és mire nem. Nincs fiók, nincs süti, nincs mérőkód; amit rajzolsz, a böngésződben marad.',
  'meta.nincsCim': 'Nincs ilyen oldal — Túrabakancs',
  'meta.nincsLeiras': 'Ez a cím nem létezik.',
};
