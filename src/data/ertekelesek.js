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
      'Szinte teljesen sík: a négy és fél kilométeren 61 méter emelkedő az egész.',
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
      'Négy kilométeren 359 méter emelkedő: meredekebb, mint amilyennek a magasságából látszik.',
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
      'Négyszáz méter az egész — ezért önmagában messziről odautazni sok.',
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

  'visegrad-fellegvar': {
    csillag: 4,
    verdikt: 'A legjobb kilátás a legrövidebb úton. Fél óra kapaszkodás, és a Dunakanyar ott van előtted.',
    reszek: { kilatas: 5, jarhatosag: 4, megkozelites: 5, nyugalom: 2 },
    mellette: [
      'Hajóval és busszal is odajutsz Budapestről.',
      'Másfél kilométeren 285 méter emelkedő: rövid, de érzed.',
      'A vár maga is látnivaló, nem csak a kilátás.',
    ],
    ellene: [
      'Hétvégén tömeg van, a váron belül sorban állás.',
      'Gyerekkel a kapaszkodó hosszabbnak tűnik, mint amilyen.',
    ],
  },

  'pilis-teto': {
    csillag: 4,
    verdikt: 'A Pilis teteje, közepes erőfeszítéssel. Jó első "igazi" hegyi túra.',
    reszek: { kilatas: 4, jarhatosag: 4, megkozelites: 3, nyugalom: 4 },
    mellette: [
      '429 méter emelkedő négy és fél kilométeren: fél nap alatt kényelmesen kijön.',
      'A Pilis legmagasabb pontja, 756 méter.',
      'Kevesebben járják, mint a Dobogókőt.',
    ],
    ellene: [
      'Pilisszentkeresztig tömegközlekedéssel körülményes.',
      'A csúcsról a kilátást fák takarják, nem körpanoráma.',
    ],
  },

  'harmashatarhegy': {
    csillag: 4,
    verdikt: 'Városi túra villamossal. Ha van két szabad órád Budapesten, ez az.',
    reszek: { kilatas: 5, jarhatosag: 4, megkozelites: 5, nyugalom: 2 },
    mellette: [
      'A rajtig villamos visz, autó teljesen fölösleges.',
      'Fentről Budapest és a Duna is látszik.',
      '3,6 kilométer, 309 méter emelkedő: délutánba belefér.',
    ],
    ellene: [
      'Végig a városban vagy, nem vadonban — sok a sétáló és a kutyás.',
      'A sárkányrepülő-starthely környéke hétvégén zsúfolt.',
    ],
  },

  'nagy-hideg-hegy': {
    csillag: 5,
    verdikt: 'A Börzsöny csendes fele. Aki egyedül akar lenni egy hegyen, ide jöjjön.',
    reszek: { kilatas: 5, jarhatosag: 3, megkozelites: 2, nyugalom: 5 },
    mellette: [
      '726 méter emelkedő: ez már teljesítmény, nem séta.',
      'Az ország egyik legkevésbé látogatott hegyvidéke.',
      'A gerincről nagy kilátások nyílnak.',
    ],
    ellene: [
      'Nagybörzsönyig tömegközlekedéssel hosszú az út.',
      '8,7 kilométer odafelé — a visszautat is számold bele.',
      'Rossz időben a felső szakasz hideg és ködös.',
    ],
  },

  'badacsony': {
    csillag: 4,
    verdikt: 'Szőlők, bazalt és a Balaton. Rövid, de nem könnyű — és a végén bor.',
    reszek: { kilatas: 5, jarhatosag: 4, megkozelites: 5, nyugalom: 2 },
    mellette: [
      'Vonattal odajutsz, a rajt a állomástól pár perc.',
      'Végig a Balatonra látsz vissza.',
      '266 méter emelkedő három kilométeren: megérezhető, de rövid.',
    ],
    ellene: [
      'Nyáron zsúfolt, és a hegyoldal tele van vendéglátással.',
      'Kevés az árnyék a szőlők közt.',
    ],
  },

  'irott-ko': {
    csillag: 5,
    verdikt: 'A Dunántúl teteje, és a Kéktúra rajtköve. Egész napos, de megéri.',
    reszek: { kilatas: 5, jarhatosag: 4, megkozelites: 4, nyugalom: 4 },
    mellette: [
      '882 méter: a Dunántúl legmagasabb pontja.',
      'Itt indul az Országos Kéktúra — ennek külön súlya van.',
      'Kőszeg maga is megér egy napot, a túra előtt vagy után.',
    ],
    ellene: [
      'Majdnem 11 kilométer és 692 méter emelkedő: nem délutáni program.',
      'A csúcs a határon van, a kilátó fele Ausztriában.',
      'Vizet vigyél, útközben kevés a forrás.',
    ],
  },

  'misina': {
    csillag: 4,
    verdikt: 'A városból egyenesen fel a hegyre. Pécs egyik legjobb tulajdonsága.',
    reszek: { kilatas: 5, jarhatosag: 4, megkozelites: 5, nyugalom: 3 },
    mellette: [
      'A belvárosból indul: nem kell külön odautazni.',
      '401 méter emelkedő három és fél kilométeren — sűrű, de rövid.',
      'Fentről egész Pécs és a Dráva-síkság odalátszik.',
    ],
    ellene: [
      'A tévétorony környéke nem vadon: út, parkoló, büfé.',
      'Meredek szakaszok, kevés pihenővel.',
    ],
  },

  'regeci-var': {
    csillag: 4,
    verdikt: 'Várrom a Zemplénben, tömeg nélkül. Aki csendet keres, itt megtalálja.',
    reszek: { kilatas: 4, jarhatosag: 4, megkozelites: 2, nyugalom: 5 },
    mellette: [
      'Két és fél kilométer, 254 méter emelkedő: fél délután.',
      'Ritkán járják, gyakran egyedül vagy a romnál.',
      'A Zemplén erdői körben, minden irányban.',
    ],
    ellene: [
      'Regécig autó nélkül nehéz eljutni.',
      'A vár rom, nem helyreállított látványosság.',
    ],
  },

  'aggtelek-josvafo': {
    csillag: 4,
    verdikt: 'A barlang fölött, a felszínen. Külön élmény, ha alatta már jártál.',
    reszek: { kilatas: 3, jarhatosag: 4, megkozelites: 3, nyugalom: 4 },
    mellette: [
      'A Baradla két bejáratát köti össze — jó kombináció barlangtúrával.',
      'Karsztos fennsík, töbrökkel: máshol nem látsz ilyet az országban.',
      '5,2 kilométer, 272 méter emelkedő — közepes nap.',
    ],
    ellene: [
      'A rajt és a cél távol van egymástól, autóval körülményes.',
      'Maga a felszíni táj kevésbé látványos, mint a barlang.',
    ],
  },

  'ram-szakadek': {
    csillag: 5,
    verdikt: 'A rövid változat: egyenesen a szakadékhoz, a Duna partjáról. Létrák, sziklák, izgalom.',
    reszek: { kilatas: 4, jarhatosag: 2, megkozelites: 5, nyugalom: 3 },
    mellette: [
      'Dömösig busz és hajó is megy Budapestről.',
      'A létrás szakasz élmény, nem csak közlekedés.',
      '3,7 kilométer: fél nap alatt kényelmesen megvan.',
    ],
    ellene: [
      'Eső után és fagyban a létrák csúsznak — ilyenkor ne indulj el.',
      'Kisgyerekkel nem vállalható.',
      '450 méter emelkedő rövid úton: meredek.',
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
