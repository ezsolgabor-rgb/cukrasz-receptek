import Image from "next/image";
import Link from "next/link";

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  count: number;
  preview: string[];
  coverPhoto: string | null;
  firstSlug: string | null;
};

/**
 * A nyitólap „menüpontja”: egy kategória, előnézettel.
 * A receptek majd a kategória oldalán jelennek meg.
 */
export function CategoryCard({ category }: { category: CategorySummary }) {
  const { color } = category;

  return (
    <Link
      href={`/kategoriak/${category.slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-lift bg-white dark:bg-slate-800 dark:border dark:border-slate-700"
    >
      <div className="relative h-28 w-full overflow-hidden">
        {category.coverPhoto ? (
          <Image
            src={`/api/files/${encodeURIComponent(category.coverPhoto)}`}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center dark:bg-slate-700"
            style={{
              background: `radial-gradient(120% 120% at 15% 0%, ${color}33, ${color}0f 65%), linear-gradient(180deg, #fff, #eef3e7) dark:bg-slate-700`,
            }}
          >
            <span className="font-display text-6xl opacity-30" style={{ color }}>
              {category.name.charAt(0)}
            </span>
          </div>
        )}

        <span
          className="chip absolute right-3 top-3 bg-white/90"
          style={{ color }}
        >
          {category.count} recept
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-2xl leading-tight text-ink-900 dark:text-slate-100">
          {category.name}
        </h3>

        {category.preview.length > 0 ? (
          <ul className="mt-2 space-y-0.5 text-sm text-ink-400 dark:text-slate-400">
            {category.preview.map((name) => (
              <li key={name} className="truncate">
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-300">Még nincs benne recept</p>
        )}

        <span
          className="mt-auto pt-3 text-xs font-semibold"
          style={{ color }}
        >
          Megnyitás →
        </span>
      </div>
    </Link>
  );
}
