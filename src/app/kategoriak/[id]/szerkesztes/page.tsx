import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateCategory, deleteCategory } from "@/actions/category";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateCategory(id, formData);
  }

  async function handleDelete() {
    "use server";
    await deleteCategory(id);
  }

  return (
    <div className="min-h-dvh bg-sage-50/50 dark:bg-gray-950">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-8">
        <Link
          href="/"
          className="text-sm text-ink-400 hover:text-forest-600 dark:text-gray-400"
        >
          ← Vissza a főoldalra
        </Link>

        <h1 className="mt-4 font-display text-3xl text-ink-900 dark:text-slate-100">
          Kategória szerkesztése: {category.name}
        </h1>

        {/* Módosító űrlap */}
        <form action={handleUpdate} className="card mt-6 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300">
              Kategória neve
            </label>
            <input
              type="text"
              name="name"
              defaultValue={category.name}
              required
              className="mt-1 w-full rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-ink-900 shadow-sm focus:border-forest-600 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-gray-300">
              Szín jelölés
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                name="color"
                defaultValue={category.color ?? "#22c55e"}
                className="h-10 w-16 cursor-pointer rounded-lg border border-sage-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
              />
              <span className="text-sm text-ink-500 dark:text-gray-400">
                Válassz egy színt a kategóriához
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/" className="btn btn-ghost">
              Mégse
            </Link>
            <button type="submit" className="btn btn-primary">
              Módosítások mentése
            </button>
          </div>
        </form>

        {/* Törlő űrlap (külön blokkban a biztonság kedvéért) */}
        <div className="card mt-6 p-6 border-red-200 bg-red-50/50 dark:border-red-950 dark:bg-red-950/20">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-400">
            Veszélyes zóna
          </h2>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">
            Ha törlöd a kategóriát, azzal eltávolítod a rendszerből.
          </p>
          <form action={handleDelete} className="mt-4">
            <button
              type="submit"
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition"
              onClick={(e) => {
                if (!window.confirm("Biztosan törölni szeretnéd ezt a kategóriát?")) {
                  e.preventDefault();
                }
              }}
            >
              Kategória törlése
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}