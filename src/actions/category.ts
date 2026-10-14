'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) {
    throw new Error('A kategória neve kötelező!')
  }

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  try {
    await db.category.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    })
  } catch (error) {
    console.error('Hiba a kategória mentésekor:', error)
    throw new Error('Nem sikerült létrehozni a kategóriát.')
  }

  revalidatePath('/receptek')
  redirect('/receptek')
}