# Klau recepttár

Saját receptek egy helyen: hozzávalók, lépések, fotók – és ami a kézzel írt
füzetekből hiányzik: **számolható adagok**.

Tortáknál **szeletre** számolunk, mert úgy rendelik – a tepsis süteményeknél
pedig tepsiire vagy adagra.

Az alkalmazás a saját gépeden fut, az adatok is itt maradnak. Böngészőből
használod, és ugyanazon a Wi-Fi-n a telefonról is eléred a konyhában.

> **Egyfelhasználós.** Nincs belépés és jelszó – a gép, amin fut, maga a
> védelem. Ezért sem kell internetre kötni.

---

## Indítás

1. Kattints duplán a **`start.bat`** fájlra.
2. Megnyílik egy fekete ablak, ami kiírja a címeket:
   - **Ezen a gépen:** `http://localhost:3000`
   - **Telefonról:** `http://192.168.1.123:3000` (a hálózati címed)
3. Nyisd meg böngészőben az első címet.
4. Leállítás: a fekete ablakban `Ctrl + C`, vagy egyszerűen zárd be az ablakot.

> Az első indítás tovább tart (telepítés, adatbázis létrehozása). Utána pár
> másodperc.
>
> A telefonos eléréshez a gépnek be kell kapcsolva lennie, és ugyanazon a
> Wi-Fi-n kell lennie, mint a telefonnak. Ha a router új címet ad a gépnek,
> a fekete ablakban mindig látod az aktuálisat.

---

## Hogyan használod

### Hogyan épül fel a tár

A nyitólap a **kategóriáké** – ezek a „menüpontok”: Torták, Sütemények,
Krémesek, Kelt tészták stb. Egy kategóriára kattintva jönnek elő a benne lévő
receptek, ott címkékre is szűrhetsz (ünnepi, gyors, rendelésre…).

Külön szekciója van az **Alapoknak**: krémek, piskóták, tészták. Ezeket egyedül
is megcsinálhatod, de több recept épül rájuk – így egy anyagot csak egyszer kell
javítani.

Ha nem jut eszedbe a név, használd a **keresőt**. Az ékezetre és kis/nagybetűre
nem érzékeny, és a hozzávalókra is keres: a „liszt” kiadja mindazt, amiben liszt
van, a „malna” a málnásat.

### Új recept felvétele

1. Felül a **+ Új recept** gomb.
2. Alapadatok: név, kategória, leírás, címkék.
3. **Alapadag** – tortánál a *szeletszámot* írd be (pl. 12 szelet, 18 cm-es
   forma). A „Pontosítás” mezőbe kerül a forma mérete.
4. **Hozzávalók**, részekre bontva (Tészta, Krém, Máz). Ha egy sor mennyiségét
   üresen hagyod, „ízlés szerint” lesz belőle. Amit **nem** szabad felszorozni
   (csipet só, tepsi kenése, díszítés), annál vedd ki a *skálázható* pipát.
5. **Elkészítés** – egy lépés = egy bekezdés. Az időt és a hőfokot külön mezőbe
   írd, mert a receptlapon így tudjuk kiemelni.
6. **Recept mentése**.

### Szelet-számítás a receptlapon

A receptlap tetején a `−  12  +` léptetővel állítod, mennyit szeretnél sütni.
Minden hozzávaló azonnal átvált, és kiírja azt is, hányszoros mennyiségről van
szó. A köröcskékkel **kipipálhatod**, ami már a tálban van, a „Kipipáltak
elrejtése” gombbal pedig eltüntetheted őket, hogy csak a hátralévők látszódjanak.

Tortánál a léptető alatt megjelennek a **tortaformák** is (18 cm · 12 szelet,
22 cm · 16 szelet …). Egy kattintással a kívánt szeletszámra áll minden. A
forma–szelet megfeleltetés kiinduló érték, és a beállításokban lesz pontosítható.

### Fotók

A receptlap alján a **Fotó kiválasztása** gombbal töltesz fel. Telefonról is
mehet – a nagy képet a böngésző maga kicsinyíti (hosszabbik oldal 1800 pixel),
így gyors marad a receptlap és nem hízik meg a tár.

- Az **első fotó lesz a borító**, és a borító megjelenik a recept kártyáján a
  listában is.
- A **Borító** gombbal bármelyik kép borítóvá tehető.
- Az **„eredeti lap”** pipával jelölheted azt a fotót, ami a kézzel írt
  eredetiről készült – így később össze tudod vetni a gépelt szöveggel.
- A **képaláírás** a kép alatti mezőben szerkeszthető.
- A **Törlés** a fájlt is eltávolítja a lemezről.

> iPhone-os HEIC fotót a böngésző nem tud átalakítani; ilyenkor a feltöltés az
> eredeti fájllal történik. Ha gondot okoz, a telefonon állítsd a fényképezőt
> „Legjobb kompatibilitás” módba (JPG).

### Keresés és szűrés

Az **Összes recept** oldalon (a fejlécben) egyszerre szűrhetsz kategóriára,
címkére és kedvencekre, fölötte pedig keresőmező van. A találatok száma mindig
látszik, és a felajánlott címkék mindig az aktuális találatokhoz igazodnak.

### Beállítások

A fejléc **Beállítások** gombja alatt öt fül van – mindegyik kód írása nélkül
szerkeszthető:

| Fül | Mit állítasz itt |
|---|---|
| **Kategóriák** | Név, szín, sorrend |
| **Mértékegységek** | Jel, megnevezés, fajta, váltószám, aktív/inaktív |
| **Tortaformák** | Átmérő → szeletszám |
| **Hozzávaló-törzs** | Allergén, beszerzés, ár, alapértelmezett egység |
| **Beállítások** | Műhely neve, pénznem, kerekítés, fotóméret |

A mentés gomb mindig a teljes listát menti, és utána kiírja, ha valamit nem
sikerült (pl. olyan kategóriát nem lehet törölni, amiben még van recept).

### Módosítás, törlés, nyomtatás

- **Módosítás:** a receptlapon a *Szerkesztés* gomb.
- **Törlés:** a szerkesztő alján. Ha a receptet másik recept használja
  hozzávalóként, a törlést megtagadja – így nem marad hiányos recept.
- **Nyomtatás:** a receptlapon a *Nyomtatás* gomb. A gombok és a fejléc nem
  kerülnek a papírra.

---

## Az adataid

Minden adat két helyen van, ezeket érdemes időnként lementeni (pendrive-ra,
felhőbe):

| Mi | Hol |
|---|---|
| Az összes recept, hozzávaló, beállítás | `prisma/dev.db` |
| A feltöltött fotók | `data/uploads/` |

Ez a kettő együtt a teljes receptkönyved. Másik gépre költözéskor elég ezt a
kettőt átmásolni.

---

## Miből épül fel

| Réteg | Technológia | Miért |
|---|---|---|
| Felület | Next.js 16 + TypeScript + Tailwind CSS 4 | Gyors, modern, jól formálható design |
| Szerver | Next.js szerveroldal (ugyanaz az app) | Egy folyamat, nincs külön telepítendő szerver |
| Adatbázis | SQLite (Prisma 7) | Nulla telepítés, egyetlen fájl |
| Fotók | Helyi `data/uploads` mappa | Nem kell felhő |

### Fontos, hogy később felhőbe is vihető legyen

Az adatbázis-elérést egyetlen helyen konfiguráljuk (`.env`), és a Prisma
driver-adaptert használ. Ha egyszer szeretnéd bárhonnan elérni (nem csak
otthon), akkor PostgreSQL-re és felhő-alapú fotótárhelyre váltunk – a logika
nem változik, csak ez a réteg.

---

## A „konfigurálható backend” – mit jelent ez gyakorlatban

Ezeket az alkalmazáson belül fogod szerkeszteni, kód írása nélkül:

- **Kategóriák** – név, szín, sorrend
- **Mértékegységek** – g, kg, db, csomag, tepsi, adag, szelet, tk, ek …
- **Átváltások** – pl. *1 csomag instant élesztő = 7 g*, *1 ek = 15 ml*
- **Hozzávaló-törzsadat** – allergének, beszerzési ár, hol veszed, tárolás
- **Beállítások** – műhely neve, alap sütési hőfok, kerekítés módja

---

## Állapot

### Kész és használható

- **Recept felvétele és szerkesztése** a felületen, ellenőrzött mentéssel
- **Receptlap** – szeletre / tepsiire / adagra számoló kalkulátor, kipipálható
  hozzávalókkal és nyomtatható nézettel
- Hozzávalók **csoportosítása** (Tészta / Krém / Máz / Díszítéshez)
- „Nem skálázódik” jelző azokra a sorokra, amiket nem szabad felszorozni
- **Szelet-alapú torták** – a 12 szeletes receptből egy mozdulattal lesz 16
  szeletes
- Allergén-jelzés a receptkártyákon és a receptlapon
- A mentett hozzávalók **automatikusan a törzsadathoz kapcsolódnak** név
  alapján – így az allergén (és később az ár) magától megjelenik
- **Fotófeltöltés** – borító, képaláírás, „eredeti lap” jelzés, törlés
- **Tortaforma-felajánlás** – 18 cm · 12 szelet, 22 cm · 16 szelet …
- **Kategóriák mint menüpontok** – a nyitólap a kategóriáké, a receptek a
  kategória oldalán, címke-szűrővel
- **Alapok szekció** – krémek, piskóták, tészták külön helyen
- **Keresés** – ékezet- és kis/nagybetű-független, hozzávalóra és címkére is
- **Beállítások felülete** – kategóriák, mértékegységek, tortaformák,
  hozzávaló-törzs és alapértékek, kód nélkül
- Kategóriaszínek, címkék, kedvenc jelölés
- Design rendszer: zsályazöld–erdőzöld paletta, serif címsorok, szaggatott
  elválasztók, +/− léptető, kipipálható körök
- Mintaadatok: 7 kategória, 15 mértékegység, 26 hozzávaló-törzsadat,
  4 valódi recept (krémes, beigli, somlói galuska, csokoládés-málnás torta)

### Következik

- **Bevásárlólista** több receptből összevonva, kategóriánként csoportosítva
- **Alaprecept beépítése** más receptekbe – a krém legyen hivatkozás, ne
  beírt szöveg (az adatmodell már tudja, a felület még nem)
- **Anyagköltség** – recept- és bevásárlólista-szinten
- **Telefonra kitehető app** és offline működés
- **Vagányabb design** – külön körben, mert ez több mint színcsere
- **Adag-emlékeztető** – jegyezze meg, miből mennyit szoktál sütni

---

## Hol van a lényeg a kódban

- `prisma/schema.prisma` – az adatmodell
- `src/lib/recipe-queries.ts` – a lista, a keresés és a kategória-összesítők
- `src/lib/recipe-repository.ts` – a recept mentésének teljes logikája
- `src/lib/photo-repository.ts` – a fotók kezelése
- `src/lib/settings-data.ts` – a beállítások tábláinak betöltése
- `src/app/beallitasok/actions.ts` – a beállítások mentése
- `src/components/recipe-form.tsx` – a receptszerkesztő
- `src/components/recipe-ingredients.tsx` – a szelet-kalkulátor
- `src/components/settings/*` – a beállítások felülete
- `src/app/globals.css` – a design tokenek (színek, betűk, gombok)

---

## Fejlesztői parancsok

```bash
npm run dev        # fejlesztői szerver (http://localhost:3000)
npm run build      # éles build
npm run start      # éles szerver
npm run db:push    # adatmodell -> adatbázis szinkronizálás
npm run db:seed    # mintaadatok újratöltése (FIGYELEM: törli a meglévőket)
npm run db:studio  # grafikus adatbázis-böngésző
```
