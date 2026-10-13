/**
 * Indító szkript – ezt hívja a start.bat.
 * Gondoskodik arról, hogy minden a helyén legyen (csomagok, adatbázis),
 * kiírja a telefonos elérési címet, majd elindítja a szervert.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);

const isWindows = process.platform === "win32";
// Windows alatt a PowerShell szkriptfuttatás le lehet tiltva, ezért
// a .cmd változatot hívjuk (npm.cmd, npx.cmd).
const npmBin = isWindows ? "npm.cmd" : "npm";
const npxBin = isWindows ? "npx.cmd" : "npx";

function run(command, args, label) {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: isWindows,
  });
  if (result.status !== 0) {
    console.error(`\nHIBA: ${label} nem sikerült.`);
    process.exit(result.status ?? 1);
  }
}

function lanAddresses() {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
}

// 1) Függőségek
if (!existsSync("node_modules")) {
  run(npmBin, ["install"], "Csomagok telepítése (egyszeri, eltarthat pár percig)");
}

// 2) Adatbázis
if (!existsSync(path.join("prisma", "dev.db"))) {
  run(npxBin, ["prisma", "db", "push"], "Adatbázis létrehozása");
  if (existsSync(path.join("prisma", "seed.mts"))) {
    run("node", [path.join("prisma", "seed.mts")], "Mintaadatok betöltése");
  }
}

// 3) Fotók mappája
mkdirSync(path.join("data", "uploads"), { recursive: true });

// 4) Elérési címek
const port = process.env.PORT ?? "3000";
console.log("\n" + "=".repeat(58));
console.log("  CUKRÁSZMŰHELY – Recepttár");
console.log("=".repeat(58));
console.log(`  Ezen a gépen:   http://localhost:${port}`);
for (const address of lanAddresses()) {
  console.log(`  Telefonról:     http://${address}:${port}`);
}
console.log("\n  A szerver leállítása: Ctrl + C, vagy az ablak bezárása.");
console.log("=".repeat(58) + "\n");

// 5) Szerver indítása
const child = spawn(npmBin, ["run", "dev"], {
  stdio: "inherit",
  shell: isWindows,
});

child.on("exit", (code) => process.exit(code ?? 0));
