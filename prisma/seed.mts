import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../generated/prisma/client.ts";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

// ---------------------------------------------------------------------------
// Segédtípusok
// ---------------------------------------------------------------------------

type IngredientSeed = {
  name: string;
  quantity: number | null;
  unit: string | null;
  group?: string;
  note?: string;
  scalable?: boolean;
};

type StepSeed = {
  text: string;
  durationMinutes?: number;
  temperatureC?: number;
  note?: string;
};

// ---------------------------------------------------------------------------
// Mértékegységek – ezek az admin felületen bővíthetők lesznek.
// A `dimension` + `factorToBase` adja az automatikus átváltást a Fázis 4-ben.
// ---------------------------------------------------------------------------

const units = [
  { code: "g", name: "gramm", dimension: "mass", factorToBase: 1, decimals: 0, sortOrder: 10 },
  { code: "dkg", name: "dekagramm", dimension: "mass", factorToBase: 10, decimals: 1, sortOrder: 15 },
  { code: "kg", name: "kilogramm", dimension: "mass", factorToBase: 1000, decimals: 3, sortOrder: 20 },
  { code: "ml", name: "milliliter", dimension: "volume", factorToBase: 1, decimals: 0, sortOrder: 30 },
  { code: "dl", name: "deciliter", dimension: "volume", factorToBase: 100, decimals: 2, sortOrder: 35 },
  { code: "l", name: "liter", dimension: "volume", factorToBase: 1000, decimals: 3, sortOrder: 40 },
  { code: "tk", name: "teáskanál", dimension: "volume", factorToBase: 5, decimals: 1, sortOrder: 50 },
  { code: "ek", name: "evőkanál", dimension: "volume", factorToBase: 15, decimals: 1, sortOrder: 55 },
  { code: "db", name: "darab", dimension: "count", factorToBase: 1, decimals: 0, sortOrder: 60 },
  // Tortáknál a rendelés alapja a szelet, ezért ez külön mértékegység.
  { code: "szelet", name: "szelet", dimension: "count", factorToBase: 1, decimals: 0, sortOrder: 65 },
  { code: "csomag", name: "csomag", dimension: "count", factorToBase: 1, decimals: 1, sortOrder: 70 },
  { code: "lap", name: "lap", dimension: "count", factorToBase: 1, decimals: 0, sortOrder: 75 },
  { code: "tepsi", name: "tepsi", dimension: "count", factorToBase: 1, decimals: 1, sortOrder: 80 },
  { code: "adag", name: "adag", dimension: "count", factorToBase: 1, decimals: 1, sortOrder: 85 },
  { code: "rúd", name: "rúd", dimension: "count", factorToBase: 1, decimals: 1, sortOrder: 90 },
];

const categories = [
  { name: "Torták", slug: "tortak", color: "#8E3B5A", icon: "cake", sortOrder: 10 },
  { name: "Sütemények", slug: "sutemenyek", color: "#C97B3C", icon: "cookie", sortOrder: 20 },
  { name: "Krémesek", slug: "kremesek", color: "#D9A65A", icon: "layers", sortOrder: 30 },
  { name: "Kelt tészták", slug: "kelt-tesztak", color: "#A8763F", icon: "croissant", sortOrder: 40 },
  { name: "Bonbonok és csokoládé", slug: "bonbonok", color: "#7A5B45", icon: "candy", sortOrder: 50 },
  { name: "Fagylalt és sorbet", slug: "fagylalt", color: "#6E8A5F", icon: "ice-cream", sortOrder: 60 },
  { name: "Alapreceptek", slug: "alapreceptek", color: "#7A8570", icon: "flask", sortOrder: 70 },
];

const settings = [
  { key: "shopName", value: "Klau recepttár", label: "Műhely neve", group: "general" },
  { key: "currency", value: "Ft", label: "Pénznem", group: "general" },
  { key: "defaultYieldUnit", value: "adag", label: "Alapértelmezett adag-mértékegység", group: "recipe" },
  { key: "defaultBakeTemperature", value: "180", label: "Alap sütési hőmérséklet (°C)", group: "recipe" },
  { key: "maxPhotoSizeMb", value: "12", label: "Feltölthető fotó max. mérete (MB)", group: "photos" },
  { key: "roundingMode", value: "cook", label: "Kerekítés átváltáskor (cook = konyhai)", group: "recipe" },
  { key: "baseCategorySlug", value: "alapreceptek", label: "Az „Alapok” kategória webcíme", group: "recipe" },
];

// ---------------------------------------------------------------------------
// Tortaforma -> szeletszám.
// KIINDULÓ ÉRTÉKEK: ezt Klauval egyeztetve kell pontosítani, és a
// beállítások felületén (Fázis 5) lesz szerkeszthető.
// ---------------------------------------------------------------------------

const cakeSizes = [
  { diameterCm: 14, slices: 8, note: null },
  { diameterCm: 16, slices: 10, note: null },
  { diameterCm: 18, slices: 12, note: "A leggyakoribb tortaforma" },
  { diameterCm: 20, slices: 14, note: null },
  { diameterCm: 22, slices: 16, note: null },
  { diameterCm: 24, slices: 20, note: null },
  { diameterCm: 26, slices: 24, note: null },
  { diameterCm: 28, slices: 28, note: null },
  { diameterCm: 30, slices: 32, note: null },
];

// ---------------------------------------------------------------------------
// Hozzávaló-törzsadat (anyagkészlet). Az ár és az allergén ide kerül.
// ---------------------------------------------------------------------------

const ingredientMasters = [
  { name: "Finomliszt", unit: "g", allergenNote: "glutén (búza)" },
  { name: "Rétesliszt", unit: "g", allergenNote: "glutén (búza)" },
  { name: "Vaj", unit: "g", allergenNote: "tej" },
  { name: "Tojás", unit: "db", allergenNote: "tojás" },
  { name: "Tojássárgája", unit: "db", allergenNote: "tojás" },
  { name: "Tej", unit: "ml", allergenNote: "tej" },
  { name: "Tejszín", unit: "ml", allergenNote: "tej" },
  { name: "Tejföl", unit: "g", allergenNote: "tej" },
  { name: "Kristálycukor", unit: "g", allergenNote: null },
  { name: "Porcukor", unit: "g", allergenNote: null },
  { name: "Vaníliás cukor", unit: "csomag", allergenNote: null },
  { name: "Vaníliarúd", unit: "db", allergenNote: null },
  { name: "Kakaópor", unit: "g", allergenNote: null },
  { name: "Étcsokoládé", unit: "g", allergenNote: "tej (nyomokban)" },
  { name: "Darált mák", unit: "g", allergenNote: "mák" },
  { name: "Darált dió", unit: "g", allergenNote: "olajos mag (dió)" },
  { name: "Mazsola", unit: "g", allergenNote: null },
  { name: "Friss élesztő", unit: "g", allergenNote: null },
  { name: "Rum", unit: "ml", allergenNote: null },
  { name: "Leveles tészta", unit: "g", allergenNote: "glutén, tej" },
  { name: "Lapzselatin", unit: "lap", allergenNote: null },
  { name: "Vaníliás pudingpor", unit: "g", allergenNote: "glutén, tej" },
  { name: "Málna", unit: "g", allergenNote: null },
  { name: "Citromhéj", unit: "db", allergenNote: null },
  { name: "Só", unit: "g", allergenNote: null },
];

// ---------------------------------------------------------------------------
// Receptek
// ---------------------------------------------------------------------------

const recipes = [
  {
    name: "Klasszikus krémes",
    slug: "klasszikus-kremes",
    description:
      "Nagymama-klasszikus: ropogós leveles lapok között selymes vaníliakrém, keményre vert tejszínnel könnyítve.",
    category: "kremesek",
    baseYieldQty: 1,
    baseYieldUnit: "tepsi",
    yieldNote: "1 tepsi 30×40 cm, kb. 12 szelet",
    prepMinutes: 40,
    bakeMinutes: 18,
    bakeTemperatureC: 200,
    difficulty: 3,
    source: "nagymama füzete, 1978",
    notes:
      "A krém akkor jó állású, ha a habverő nyomát megtartja. Ha a zselatin nem olvad el teljesen, szűrd át a krémet, különben csomós lesz.",
    tags: ["Klasszikus", "Vendégváró"],
    ingredients: [
      { name: "Leveles tészta", quantity: 550, unit: "g", group: "Tészta", note: "vagy házi vajastészta, 6 vékony lap" },
      { name: "Porcukor", quantity: null, unit: null, group: "Tészta", note: "a tetejére szóráshoz", scalable: false },

      { name: "Tej", quantity: 1, unit: "l", group: "Krém" },
      { name: "Tojássárgája", quantity: 8, unit: "db", group: "Krém" },
      { name: "Kristálycukor", quantity: 250, unit: "g", group: "Krém" },
      { name: "Finomliszt", quantity: 80, unit: "g", group: "Krém", note: "átszitálva" },
      { name: "Vaníliarúd", quantity: 2, unit: "db", group: "Krém", note: "kikapart mag" },
      { name: "Lapzselatin", quantity: 8, unit: "lap", group: "Krém", note: "hideg vízbe áztatva" },
      { name: "Tejszín", quantity: 500, unit: "ml", group: "Krém", note: "legalább 30%-os, jól hűtve" },
      { name: "Porcukor", quantity: 30, unit: "g", group: "Krém", note: "a tejszínhez" },
    ] as IngredientSeed[],
    steps: [
      { text: "A leveles tésztát két egyenlő lapra vágjuk, és szúróvillával sűrűn megszurkáljuk, hogy sütés közben ne púposodjon fel." },
      { text: "Sütőpapírral bélelt tepsin, egyenként aranyszínűre sütjük.", durationMinutes: 18, temperatureC: 200 },
      { text: "A lapokat rácson teljesen kihűtjük – melegen nem szabad összeállítani." },
      { text: "A tejet a kikapart vaníliával és a hüvelyével felforraljuk, majd lefedve 10 percet állni hagyjuk, hogy átvegye az aromát." },
      { text: "A tojássárgáját a cukorral és a liszttel simára keverjük, majd a meleg tejet fokozatosan, vékony sugárban hozzáöntve állandó keverés mellett besűrítjük." },
      { text: "Lehúzzuk a tűzről, belekeverjük a kicsavart zselatinlapokat, és még forrón, 2-3 percig keverjük, amíg teljesen elolvadnak." },
      { text: "A krémet folpackkal letakarjuk úgy, hogy a fólia a krém felületére simuljon, és langyosra hűtjük." },
      { text: "A jól behűtött tejszínt a porcukorral kemény habbá verjük, majd lazán, spatulával a kihűlt krémbe forgatjuk." },
      { text: "A tésztalapot keretbe tesszük, ráöntjük a krémet, elegyengetjük, és befedjük a második lappal. Enyhén lenyomjuk." },
      { text: "Legalább 4 órára, de jobb egy egész éjszakára hűtőbe tesszük, hogy a lapok megpuhuljanak.", durationMinutes: 240 },
      { text: "Szeletelés előtt porcukorral megszórjuk, és meleg vízbe mártott, szárazra törölt késsel vágjuk.", note: "forró víz + tiszta törlés minden vágás előtt" },
    ] as StepSeed[],
  },

  {
    name: "Beigli",
    slug: "beigli",
    description:
      "Vajas, leveles kelt tészta mákos és diós töltelékkel. A tészta egy éjszakát pihen, attól lesz igazán omlós.",
    category: "kelt-tesztak",
    baseYieldQty: 4,
    baseYieldUnit: "rúd",
    yieldNote: "4 rúd, kb. 40 cm hosszú",
    prepMinutes: 90,
    bakeMinutes: 35,
    bakeTemperatureC: 180,
    difficulty: 4,
    source: "édesapám receptje",
    notes:
      "A töltelék ne legyen híg: ha folyik, a beigli szétnyílik sütés közben. A tésztát sütés előtt 20 percre hűtőbe tesszük, akkor szépen megtartja a formáját.",
    tags: ["Karácsonyi", "Ünnepi"],
    ingredients: [
      { name: "Finomliszt", quantity: 1000, unit: "g", group: "Tészta" },
      { name: "Vaj", quantity: 400, unit: "g", group: "Tészta", note: "szobahőmérsékletű" },
      { name: "Porcukor", quantity: 200, unit: "g", group: "Tészta" },
      { name: "Tojássárgája", quantity: 4, unit: "db", group: "Tészta" },
      { name: "Tejföl", quantity: 200, unit: "g", group: "Tészta", note: "20%-os" },
      { name: "Friss élesztő", quantity: 42, unit: "g", group: "Tészta", note: "1 kocka" },
      { name: "Tej", quantity: 150, unit: "ml", group: "Tészta", note: "langyos" },
      { name: "Só", quantity: 5, unit: "g", group: "Tészta" },

      { name: "Darált mák", quantity: 500, unit: "g", group: "Mákos töltelék" },
      { name: "Kristálycukor", quantity: 200, unit: "g", group: "Mákos töltelék" },
      { name: "Tej", quantity: 300, unit: "ml", group: "Mákos töltelék" },
      { name: "Mazsola", quantity: 100, unit: "g", group: "Mákos töltelék" },
      { name: "Citromhéj", quantity: 1, unit: "db", group: "Mákos töltelék", note: "reszelt, kezeletlen héj" },

      { name: "Darált dió", quantity: 500, unit: "g", group: "Diós töltelék" },
      { name: "Kristálycukor", quantity: 200, unit: "g", group: "Diós töltelék" },
      { name: "Tej", quantity: 300, unit: "ml", group: "Diós töltelék" },
      { name: "Vaníliás cukor", quantity: 2, unit: "csomag", group: "Diós töltelék" },
      { name: "Rum", quantity: 30, unit: "ml", group: "Diós töltelék" },

      { name: "Tojás", quantity: 2, unit: "db", group: "Kenéshez", note: "a tetejére", scalable: false },
    ] as IngredientSeed[],
    steps: [
      { text: "A langyos tejben egy kiskanál cukorral felfuttatjuk az élesztőt, kb. 10 perc alatt.", durationMinutes: 10 },
      { text: "A lisztet a vajjal elmorzsoljuk, majd hozzáadjuk a porcukrot, a sót, a tojássárgájákat, a tejfölt és a felfuttatott élesztőt." },
      { text: "Sima, rugalmas tésztát dagasztunk, majd letakarva egy éjszakára a hűtőbe tesszük.", durationMinutes: 12 * 60 },
      { text: "A mákot és a diót külön-külön a cukorral, a forró tejjel felöntve összefőzzük, majd hűlni hagyjuk." },
      { text: "A tésztát négy részre osztjuk, és egyenként kb. 30×40 cm-es téglalappá nyújtjuk." },
      { text: "A tölteléket a lap szélein 2 cm-t hagyva eligazítjuk, majd a két hosszabbik oldalt behajtva feltekerjük." },
      { text: "A rudakat sütőpapíros tepsire tesszük, megkenjük a felvert tojással, és 20 percet pihentetjük.", durationMinutes: 20 },
      { text: "180 °C-on aranybarnára sütjük. Ha sütés közben felpúposodik, a tetején szurkáljuk meg.", durationMinutes: 35, temperatureC: 180 },
      { text: "A megsült beiglit rácsra tesszük, és teljesen kihűtjük, csak utána szeleteljük." },
    ] as StepSeed[],
  },

  {
    name: "Somlói galuska",
    slug: "somloi-galuska",
    description:
      "Háromféle piskóta, vaníliakrém, rumos csokoládéöntet és tejszínhab – pohárban rétegezve.",
    category: "sutemenyek",
    baseYieldQty: 8,
    baseYieldUnit: "adag",
    yieldNote: "8 pohár (kb. 2,5 dl-es)",
    prepMinutes: 60,
    bakeMinutes: 25,
    bakeTemperatureC: 180,
    difficulty: 3,
    source: "saját, 2019",
    notes:
      "A piskótát előző nap is megsütheted – szárazon sokkal jobban szívja a szirupot, és nem esik szét a pohárban.",
    tags: ["Klasszikus", "Vendégváró"],
    ingredients: [
      { name: "Tojás", quantity: 8, unit: "db", group: "Piskóta" },
      { name: "Kristálycukor", quantity: 200, unit: "g", group: "Piskóta" },
      { name: "Finomliszt", quantity: 200, unit: "g", group: "Piskóta" },
      { name: "Kakaópor", quantity: 40, unit: "g", group: "Piskóta" },
      { name: "Vaj", quantity: 100, unit: "g", group: "Piskóta", note: "olvasztva, a tepsihez" },

      { name: "Tej", quantity: 700, unit: "ml", group: "Vaníliakrém" },
      { name: "Tojássárgája", quantity: 6, unit: "db", group: "Vaníliakrém" },
      { name: "Kristálycukor", quantity: 150, unit: "g", group: "Vaníliakrém" },
      { name: "Vaníliás pudingpor", quantity: 80, unit: "g", group: "Vaníliakrém" },
      { name: "Vaj", quantity: 100, unit: "g", group: "Vaníliakrém", note: "szobahőmérsékletű, a krém végén" },

      { name: "Étcsokoládé", quantity: 200, unit: "g", group: "Öntet" },
      { name: "Tejszín", quantity: 200, unit: "ml", group: "Öntet" },
      { name: "Rum", quantity: 50, unit: "ml", group: "Öntet" },
      { name: "Darált dió", quantity: 100, unit: "g", group: "Rétegekhez", note: "durvára vágva" },
      { name: "Mazsola", quantity: 100, unit: "g", group: "Rétegekhez", note: "rumban áztatva" },
      { name: "Tejszín", quantity: 500, unit: "ml", group: "Tálaláshoz", note: "kemény habbá verve", scalable: false },
    ] as IngredientSeed[],
    steps: [
      { text: "A tojásokat szétválasztjuk, a fehérjét a cukor felével kemény habbá verjük." },
      { text: "A sárgájákat a maradék cukorral kihabosítjuk, majd a habbal és a liszttel-kakaóval laza mozdulatokkal összeforgatjuk." },
      { text: "Két tepsiben (világos és kakaós) vékony lapot sütünk.", durationMinutes: 25, temperatureC: 180 },
      { text: "A pudingport a tojássárgájával és egy kis tejjel csomómentesre keverjük, a maradék tejet a cukorral felforraljuk, majd összefőzzük." },
      { text: "A krémhez langyos állapotban hozzákeverjük a szobahőmérsékletű vajat, ettől lesz selymes." },
      { text: "A csokoládét a tejszínnel megolvasztjuk, majd a rummal ízesítjük." },
      { text: "A piskótákat ujjnyi kockákra vágjuk, és a poharakban felváltva rétegezzük a krémmel, a dióval és a mazsolával." },
      { text: "A tetejére csokoládéöntet kerül, és legalább 2 órát hűtjük.", durationMinutes: 120 },
      { text: "Tálalás előtt tejszínhabbal és reszelt csokoládéval díszítjük." },
    ] as StepSeed[],
  },

  // Torta – itt nem „adagra”, hanem SZELETRE számolunk, mert így rendelik.
  {
    name: "Csokoládés-málnás torta",
    slug: "csokis-malnas-torta",
    description:
      "Kakaós piskóta, savanykás málnazselé és fényes étcsokoládé-ganache – 18 cm-es formában.",
    category: "tortak",
    baseYieldQty: 12,
    baseYieldUnit: "szelet",
    yieldNote: "18 cm-es forma, 12 szelet",
    prepMinutes: 90,
    bakeMinutes: 35,
    bakeTemperatureC: 175,
    difficulty: 4,
    source: "saját, 2021",
    notes:
      "A szeletszám a forma méretéhez kötődik (18 cm = 12 szelet). Ha 16 szeletesre rendelik, a kalkulátor minden hozzávalót 1,33-szorosára vált – a sütési időt viszont ne növeld, csak a hőfokot tartsd. A zselét érdemes egy nappal előbb megfőzni, akkor szépen szeletelhető.",
    tags: ["Torta", "Ünnepi", "Rendelésre"],
    ingredients: [
      { name: "Tojás", quantity: 4, unit: "db", group: "Piskóta" },
      { name: "Kristálycukor", quantity: 120, unit: "g", group: "Piskóta" },
      { name: "Finomliszt", quantity: 100, unit: "g", group: "Piskóta", note: "átszitálva" },
      { name: "Kakaópor", quantity: 25, unit: "g", group: "Piskóta" },
      { name: "Vaj", quantity: 40, unit: "g", group: "Piskóta", note: "olvasztva" },

      { name: "Málna", quantity: 300, unit: "g", group: "Málnazselé", note: "friss vagy fagyasztott" },
      { name: "Kristálycukor", quantity: 60, unit: "g", group: "Málnazselé" },
      { name: "Lapzselatin", quantity: 4, unit: "lap", group: "Málnazselé", note: "hideg vízbe áztatva" },

      { name: "Étcsokoládé", quantity: 300, unit: "g", group: "Ganache", note: "70%-os, felaprítva" },
      { name: "Tejszín", quantity: 300, unit: "ml", group: "Ganache", note: "legalább 30%-os" },
      { name: "Vaj", quantity: 40, unit: "g", group: "Ganache", note: "szobahőmérsékletű" },

      { name: "Málna", quantity: 150, unit: "g", group: "Díszítéshez", note: "friss, a tálalás előtt", scalable: false },
      { name: "Csokoládéforgács", quantity: 30, unit: "g", group: "Díszítéshez", scalable: false },
    ] as IngredientSeed[],
    steps: [
      { text: "A sütőt előmelegítjük, a 18 cm-es formát az alján sütőpapírral kibéleljük, az oldalát nem vajazzuk.", temperatureC: 175 },
      { text: "A tojásokat a cukorral kb. 8 perc alatt világos, sűrű krémmé habosítjuk.", durationMinutes: 8 },
      { text: "A lisztet és a kakaót átszitálva, spatulával lazán a masszába forgatjuk, végül az olvasztott vajat is belecsorgatjuk." },
      { text: "A formába simítjuk, és tűpróbáig sütjük.", durationMinutes: 35, temperatureC: 175 },
      { text: "A piskótát rácsra borítjuk, teljesen kihűtjük, majd folpackba csomagolva legalább 2 órát hűtjük.", durationMinutes: 120, note: "hűtve sokkal szebben szeletelhető" },
      { text: "A málnát a cukorral felfőzzük, szitán átszűrjük, majd a beáztatott, kicsavart zselatinnal elkeverjük." },
      { text: "A zselét 16 cm-es formába öntjük, és dermedni hagyjuk.", durationMinutes: 180 },
      { text: "A ganache-hoz a tejszínt felforraljuk, a felaprított csokoládéra öntjük, 1 percet állni hagyjuk, majd simára keverjük, végül a vajjal fényesítjük." },
      { text: "A kihűlt piskótát három lapra vágjuk. A lapokat vékony ganache-sal kenjük, a középső rétegre kerül a málnazselé." },
      { text: "A tortát körben és a tetején is ganache-sal vonjuk, majd legalább 4 órát hűtjük.", durationMinutes: 240 },
      { text: "Szeletelés előtt forró vízbe mártott, szárazra törölt késsel vágjuk. A tetejét friss málnával díszítjük.", note: "először negyedeld, utána szeletelj hármat – így lesz 12 egyforma szelet" },
    ] as StepSeed[],
  },
];

// ---------------------------------------------------------------------------
// Feltöltés
// ---------------------------------------------------------------------------

async function main() {
  // Védőháló: ha már van valódi recept az adatbázisban, ne töröljük ki
  // véletlenül. Csak kifejezett kéréssel (--force) folytatjuk.
  const force = process.argv.includes("--force");
  const existingRecipes = await prisma.recipe.count();
  if (existingRecipes > 0 && !force) {
    console.log(
      `Az adatbázisban már ${existingRecipes} recept van – a mintaadatok betöltése mindent törölne.`,
    );
    console.log("Ha mégis ezt szeretnéd:  node prisma/seed.mts --force");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("Meglévő adatok törlése…");
  await prisma.unitConversion.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipeStep.deleteMany();
  await prisma.recipePhoto.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.category.deleteMany();
  await prisma.ingredientMaster.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.appSetting.deleteMany();

  console.log("Beállítások…");
  for (const s of settings) {
    await prisma.appSetting.create({ data: s });
  }

  console.log("Tortaformák…");
  // Upsert: a formákat nem töröljük, csak frissítjük – így a pontosítások
  // nem vesznek el, ha valaki újrafuttatja a mintabetöltést.
  for (const [index, size] of cakeSizes.entries()) {
    await prisma.cakeSize.upsert({
      where: { diameterCm: size.diameterCm },
      update: { slices: size.slices, note: size.note, sortOrder: index * 10 },
      create: { ...size, sortOrder: index * 10 },
    });
  }

  console.log("Mértékegységek…");
  const unitId = new Map<string, string>();
  for (const u of units) {
    const created = await prisma.unit.create({ data: u });
    unitId.set(u.code, created.id);
  }

  console.log("Kategóriák…");
  const categoryId = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    categoryId.set(c.slug, created.id);
  }

  console.log("Hozzávaló-törzs…");
  const masterId = new Map<string, string>();
  for (const m of ingredientMasters) {
    const created = await prisma.ingredientMaster.create({
      data: {
        name: m.name,
        allergenNote: m.allergenNote,
        defaultUnitId: unitId.get(m.unit) ?? null,
      },
    });
    masterId.set(m.name.toLowerCase(), created.id);
  }

  console.log("Átváltások…");
  // Kontextusfüggő példa: 1 csomag instant élesztő = 7 g.
  const instantYeast = await prisma.ingredientMaster.create({
    data: { name: "Instant élesztő", defaultUnitId: unitId.get("g") ?? null },
  });
  masterId.set("instant élesztő", instantYeast.id);
  await prisma.unitConversion.create({
    data: {
      fromUnitId: unitId.get("csomag")!,
      toUnitId: unitId.get("g")!,
      factor: 7,
      ingredientId: instantYeast.id,
      note: "1 csomag instant élesztő = 7 g",
    },
  });

  console.log("Receptek…");
  for (const r of recipes) {
    const tagIds: string[] = [];
    for (const tagName of r.tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      tagIds.push(tag.id);
    }

    await prisma.recipe.create({
      data: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        source: r.source,
        notes: r.notes,
        baseYieldQty: r.baseYieldQty,
        baseYieldUnitId: unitId.get(r.baseYieldUnit)!,
        yieldNote: r.yieldNote,
        prepMinutes: r.prepMinutes,
        bakeMinutes: r.bakeMinutes,
        bakeTemperatureC: r.bakeTemperatureC,
        difficulty: r.difficulty,
        categoryId: categoryId.get(r.category) ?? null,
        tags: { connect: tagIds.map((id) => ({ id })) },
        ingredients: {
          create: r.ingredients.map((l, index) => ({
            sortOrder: index,
            groupName: l.group ?? null,
            name: l.name,
            quantity: l.quantity,
            unitId: l.unit ? (unitId.get(l.unit) ?? null) : null,
            note: l.note ?? null,
            scalable: l.scalable ?? true,
            // Ha van azonos nevű törzsadat, összekötjük (ár, allergén miatt).
            ingredientMasterId: masterId.get(l.name.toLowerCase()) ?? null,
          })),
        },
        steps: {
          create: r.steps.map((s, index) => ({
            sortOrder: index,
            text: s.text,
            durationMinutes: s.durationMinutes ?? null,
            temperatureC: s.temperatureC ?? null,
            note: s.note ?? null,
          })),
        },
      },
    });
  }

  const counts = {
    recept: await prisma.recipe.count(),
    hoZZavaloSor: await prisma.recipeIngredient.count(),
    lepes: await prisma.recipeStep.count(),
    mertekegyseg: await prisma.unit.count(),
    kategoria: await prisma.category.count(),
    torzsadat: await prisma.ingredientMaster.count(),
  };
  console.log("Kész:", counts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
