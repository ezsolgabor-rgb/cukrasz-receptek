import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-sage-200/80 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        
        {/* Bal oldal: Logó / Főcím */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-600 text-white shadow-sm font-bold">
            🧁
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink-900 dark:text-slate-100">
            Cukrász Receptkezelő
          </span>
        </Link>

        {/* Jobb oldal: Navigációs elemek és a ThemeToggle kapcsoló */}
        <div className="flex items-center gap-3">
          <Link
            href="/kategoriak/uj"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-sage-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-sage-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            + Új kategória
          </Link>
          
          <Link
            href="/bevasarlolista"
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-forest-700 transition"
          >
            🛒 Bevásárlólista
          </Link>

          {/* Itt hívjuk meg a működő sötét/világos mód váltót */}
          <ThemeToggle />
        </div>

      </div>
    </header>
  )
}