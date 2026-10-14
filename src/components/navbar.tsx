import Link from "next/link";
import { HomeIcon, BookOpenIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-sage-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link 
            href="/" 
            className="flex items-center gap-1 text-lg font-medium text-forest-700 hover:text-forest-900 transition-colors"
            title="Főoldal"
          >
            <HomeIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">Főoldal</span>
          </Link>
          <Link
            href="/receptek"
            className="flex items-center gap-1 text-lg font-medium text-forest-700 hover:text-forest-900 transition-colors"
            title="Receptek"
          >
            <BookOpenIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">Receptek</span>
          </Link>
          <Link
            href="/bevasarlolista"
            className="flex items-center gap-1 text-lg font-medium text-forest-700 hover:text-forest-900 transition-colors"
            title="Bevásárlólista"
          >
            <ShoppingCartIcon className="h-5 w-5 sm:hidden" />
            <span className="hidden sm:inline">Bevásárlólista</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
