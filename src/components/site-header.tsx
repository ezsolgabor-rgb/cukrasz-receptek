import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-sage-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-ink-900">
          <span>📖</span>
          <span>Gábor receptkönyve</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/kategoriak"
            className="text-sm font-medium text-ink-600 hover:text-forest-600"
          >
            Kategóriák
          </Link>
          <Link
            href="/bevasarlolista"
            className="text-sm font-medium text-ink-600 hover:text-forest-600"
          >
            🛒 Bevásárlólista
          </Link>
          <Link
            href="/receptek/uj"
            className="btn btn-primary text-sm"
          >
            + Új recept
          </Link>
        </nav>
      </div>
    </header>
  );
}