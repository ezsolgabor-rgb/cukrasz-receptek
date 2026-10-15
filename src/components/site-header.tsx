import Link from "next/link";

import { prisma } from "@/lib/db";
import { DarkModeToggle } from "./dark-mode-toggle";

export async function SiteHeader() {
  const shopName = await prisma.appSetting
    .findUnique({ where: { key: "shopName" } })
    .then((setting) => setting?.value ?? "Klau recepttár");

  return (
    <header className="sticky top-0 z-50 border-b border-sage-200 bg-white/80 backdrop-blur-md transition-colors dark:border-gray-800 dark:bg-gray-950/95 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-600 font-display text-lg text-sage-50">
            K
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl text-ink-900 dark:text-slate-100">
              {shopName}
            </span>
            <span className="block text-xs text-ink-400 dark:text-slate-400">Recepttár</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <DarkModeToggle />
          <Link href="/receptek" className="btn btn-ghost !px-2 !py-1.5 text-xs sm:!px-4 sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800">
            Receptek
          </Link>
          <Link
            href="/kategoriak/uj"
            className="btn btn-ghost !px-2 !py-1.5 text-xs sm:!px-4 sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800"
          >
            + Kategória
          </Link>
          <Link
            href="/beallitasok"
            className="btn btn-ghost !px-2 !py-1.5 text-xs sm:!px-4 sm:text-sm dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Beállítások
          </Link>
          <Link href="/receptek/uj" className="btn btn-primary !px-2 !py-1.5 text-xs sm:!px-4 sm:text-sm dark:bg-gray-800 dark:hover:bg-gray-700">
            + Új
          </Link>
        </nav>
      </div>
    </header>
  );
}