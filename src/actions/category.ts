'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  const color = formData.get('color') as string || '#22c55e'
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')

  await prisma.category.create({
    data: { name, slug, color },
  })

  revalidatePath('/')
  redirect('/')
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const color = formData.get('color') as string || '#22c55e'
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')

  await prisma.category.update({
    where: { id },
    data: { name, slug, color },
  })

  revalidatePath('/')
  redirect('/')
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({
    where: { id },
  })

  revalidatePath('/')
  redirect('/')
}