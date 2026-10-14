import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-sage-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link 
            href="/receptek" 
            className="text-lg font-medium text-forest-700 hover:text-forest-900 transition-colors"
          >
            Receptek
          </Link>
          <Link
            href="/bevasarlolista"
            className="text-lg font-medium text-forest-700 hover:text-forest-900 transition-colors"
          >
            Bevásárlólista
          </Link>
        </div>
      </div>
    </nav>
  );
}
