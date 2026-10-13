/**
 * „Klasszikus krémes” -> „klasszikus-kremes”
 * Az ékezeteket eltávolítjuk, hogy az URL mindenhol működjön.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
