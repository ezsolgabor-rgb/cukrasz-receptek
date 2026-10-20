import Link from "next/link";
import {
  HomeIcon,
  BookOpenIcon,
  ShoppingCartIcon,
  FolderIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-sage-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Bal oldal: Márkanév + Menüpontok */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-bold text-ink-900 hover:text-forest-700 transition-colors"
          >
            <span>📖</span>
            <span>Gábor receptkönyve</span>
          </Link>

          <div className="h-5 w-px bg-sage-200 hidden md:block" />

          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors"
            title="Főoldal"
          >
            <HomeIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">Főoldal</span>
          </Link>
          <Link
            href="/receptek"
            className="flex items-center gap-1 text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors"
            title="Receptek"
          >
            <BookOpenIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">Receptek</span>
          </Link>
          <Link
            href="/kategoriak"
            className="flex items-center gap-1 text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors"
            title="Kategóriák"
          >
            <FolderIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">Kategóriák</span>
          </Link>
          <Link
            href="/bevasarlolista"
            className="flex items-center gap-1 text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors"
            title="Bevásárlólista"
          >
            <ShoppingCartIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">Bevásárlólista</span>
          </Link>
        </div>

        {/* Jobb oldal: Új recept gomb */}
        <div className="flex items-center gap-2">
          <Link
            href="/receptek/uj"
            className="flex items-center gap-1.5 rounded-xl bg-forest-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forest-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">Új recept</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}