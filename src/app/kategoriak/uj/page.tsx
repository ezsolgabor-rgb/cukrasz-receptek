import { createCategory } from '@/actions/category'
import Link from 'next/link'

export default function NewCategoryPage() {
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Új kategória létrehozása</h1>
        <Link 
          href="/receptek" 
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Vissza a receptekhez
        </Link>
      </div>

      <form action={createCategory} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategória neve *
          </label>
          <input 
            type="text" 
            name="name" 
            required 
            placeholder="pl. Piskóták és tészták"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leírás (opcionális)
          </label>
          <textarea 
            name="description" 
            rows={3}
            placeholder="Rövid leírás a kategóriáról..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 shadow-sm"
        >
          Kategória mentése
        </button>
      </form>
    </div>
  )
}