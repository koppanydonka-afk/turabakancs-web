/* „Szerintünk” — a saját értékeléseink.

   ════════════════════════════════════════════════════════════════════
   EZEK VÁZLATOK. Írd át őket a saját véleményedre.
   ════════════════════════════════════════════════════════════════════

   Ami itt van, az nem mások értékeléseinek átlaga, és nem is lehet az:
   a Google, a TripAdvisor és a túraoldalak véleményei a szerzőiké, azokat
   nem másoljuk át. Ez a szerkesztőség — vagyis a te — véleményed.

   A vázlatokat közismert tényekből írtam (a Normafa busszal és Libegővel
   is elérhető és hétvégén tömeg van; a Belső-tó körül lapos az út; a
   Rám-szakadékban létrák vannak). Ami ennél személyesebb — hogy milyen
   volt ott lenni —, azt csak te tudod megírni. Járd végig, és javítsd.

   A részpontok 1–5 skálán:
     kilatas      — mennyit ad a szem
     jarhatosag   — mennyire kényelmes a láb alatt
     megkozelites — mennyire könnyű odajutni
     nyugalom     — mennyire nincs tömeg
   Az összesített csillag NEM a részpontok átlaga: az a te ítéleted. */

export const ERTEKELESEK = {
  'normafa-erzsebet-kilato': {
    csillag: 4,
    verdikt: 'A legkönnyebben elérhető komoly kilátás az országban — cserébe soha nem vagy egyedül.',
    reszek: { kilatas: 5, jarhatosag: 5, megkozelites: 5, nyugalom: 2 },
    mellette: [
      'Városi busszal és a Libegővel is odajutsz, autó nélkül.',
      'Széles, sima utak: edzettség nélkül is megy.',
      'Tiszta időben a kilátóból ellátni a Pilisig.',
    ],
    ellene: [
      'Hétvégén és ünnepnapokon tömeg van, a parkolók megtelnek.',
      'Rövid: önmagában nem tölt ki egy napot.',
    ],
  },

  'dobogoko-ram-domos': {
    csillag: 5,
    verdikt: 'A Pilis nagy klasszikusa. Ha egyetlen napod van a hegyekben, ez legyen az.',
    reszek: { kilatas: 5, jarhatosag: 2, megkozelites: 3, nyugalom: 3 },
    mellette: [
      'Gerinctől a Dunáig: egy nap alatt teljesen más tájak.',
      'A szakadék létrás szakasza élmény, nem csak közlekedés.',
      'Dömösről busszal és hajóval is haza lehet jutni.',
    ],
    ellene: [
      'Eső után és fagyban a létrák csúsznak — ilyenkor ne ezt válaszd.',
      'Kisgyerekkel nem vállalható.',
      'A rajt és a cél távol van egymástól: autóval körülményes.',
    ],
  },

  'tihany-belso-to': {
    csillag: 4,
    verdikt: 'Lapos, rövid, szép — az a túra, amit mindenki bír, a nagyszülőtől a babakocsiig.',
    reszek: { kilatas: 4, jarhatosag: 5, megkozelites: 4, nyugalom: 2 },
    mellette: [
      'Szinte teljesen sík: 11 méter emelkedő az egész kör.',
      'Az apátság és a levendulás pár száz méterre van az úttól.',
      'Rövid, tehát marad idő fürdésre is.',
    ],
    ellene: [
      'Nyáron Tihany zsúfolt, és a parkolás drága.',
      'Nem igazi túra: aki kihívást keres, csalódni fog.',
    ],
  },

  'szent-gyorgy-hegy': {
    csillag: 4,
    verdikt: 'Rövid, de nem könnyű. A bazaltorgonák megérik az izzadságot.',
    reszek: { kilatas: 5, jarhatosag: 3, megkozelites: 3, nyugalom: 4 },
    mellette: [
      'A bazaltoszlopok máshol nem látszanak így az országban.',
      'Fentről a Badacsony és a Balaton is odalátszik.',
      'Kevesebben járják, mint a Badacsonyt.',
    ],
    ellene: [
      'Két kilométeren 300 méter emelkedő: meredekebb, mint amilyennek látszik.',
      'Nyáron alig van árnyék — vizet vigyél.',
      'Tömegközlekedéssel körülményes.',
    ],
  },

  'holloko': {
    csillag: 3,
    verdikt: 'Nem túra, hanem séta egy múzeumfaluban. Így viszont megéri.',
    reszek: { kilatas: 4, jarhatosag: 4, megkozelites: 3, nyugalom: 3 },
    mellette: [
      'Az Ófalu maga a látnivaló, a vár csak ráadás.',
      'Negyedóra alatt fent vagy: gyerekkel is belefér.',
    ],
    ellene: [
      'Kétszáz méter — ezért önmagában messziről odautazni sok.',
      'Autó nélkül nehezen megközelíthető.',
    ],
  },

  'kekesteto': {
    csillag: 4,
    verdikt: 'Az ország teteje, két és fél kilométeren. A legjobb arány emelkedő és élmény közt.',
    reszek: { kilatas: 5, jarhatosag: 4, megkozelites: 4, nyugalom: 2 },
    mellette: [
      'Rövid úton 316 méter emelkedő: érzed, hogy megdolgoztál érte.',
      'Fent kilátó, és tiszta időben a Magas-Tátra is látszik.',
      'Mátraházáig busz megy, onnan gyalog.',
    ],
    ellene: [
      'A csúcson út, adótorony és büfé van — nem vadon.',
      'Télen jeges, és a sípálya környéke nyáron felásott.',
    ],
  },

  'csovanyos': {
    csillag: 5,
    verdikt: 'Duna-parttól a Börzsöny tetejéig. Egész napos, igazi túra — és vonattal odajutsz Budapestről.',
    reszek: { kilatas: 5, jarhatosag: 3, megkozelites: 5, nyugalom: 5 },
    mellette: [
      'Kismarosig vonat visz, autó nélkül is megy.',
      '954 méter emelkedő: ez már nem séta, hanem teljesítmény.',
      'A Börzsöny üresebb, mint a Pilis — sokszor senkivel nem találkozol.',
    ],
    ellene: [
      '17 kilométer: korán indulj, különben sötétben érsz vissza.',
      'Hosszú szakaszokon nincs forrás, vizet vigyél.',
      'Rossz időben a felső szakasz ködös és hideg.',
    ],
  },

  'szalajka': {
    csillag: 3,
    verdikt: 'Szép, de népszerű. A völgy híre nagyobb, mint a nyugalma.',
    reszek: { kilatas: 3, jarhatosag: 4, megkozelites: 5, nyugalom: 1 },
    mellette: [
      'Erdei kisvasút jár a völgyben: oda gyalog, vissza vonattal is lehet.',
      'A Fátyol-vízesés önmagában megér egy utat.',
    ],
    ellene: [
      'Hétvégén és nyáron zsúfolt, végig büfék és árusok.',
      'A gyalogúton mérve 227 méter emelkedő — nem az a sétány, aminek hírlik.',
    ],
  },
};

export const ertekelesSzerint = (id) => ERTEKELESEK[id] ?? null;

export const RESZ_NEVEK = {
  kilatas: 'Kilátás',
  jarhatosag: 'Járhatóság',
  megkozelites: 'Megközelítés',
  nyugalom: 'Nyugalom',
};
