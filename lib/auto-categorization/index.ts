/**
 * AUTO-CATEGORIZARE TRANZACȚII
 *
 * Caută keyword-uri definite de utilizator în descrierea tranzacției.
 * Normalizare: diacritice eliminate, lowercase, pentru match flexibil.
 */

interface UserKeyword {
  keyword: string;
  category_id: string;
}

/**
 * Normalizează un string: elimină diacritice + lowercase
 * Pattern identic cu cel din transactions/route.ts (search normalization)
 */
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Caută primul keyword care apare în descriere (case-insensitive, fără diacritice)
 *
 * @param description - Descrierea tranzacției
 * @param userKeywords - Lista de keyword-uri ale utilizatorului curent
 * @returns category_id dacă s-a găsit match, null altfel
 */
export function autoCategorize(
  description: string,
  userKeywords: UserKeyword[]
): string | null {
  if (!description || userKeywords.length === 0) return null;

  const normalizedDescription = normalizeText(description);

  for (const { keyword, category_id } of userKeywords) {
    if (!keyword) continue;
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedDescription.includes(normalizedKeyword)) {
      return category_id;
    }
  }

  return null;
}
