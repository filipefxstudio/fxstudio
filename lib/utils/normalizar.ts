/**
 * Normaliza texto para busca accent-insensitive (pt-BR).
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Verifica se `texto` contém `consulta` de forma accent-insensitive.
 */
export function contemNormalizado(texto: string | null | undefined, consulta: string): boolean {
  if (!consulta.trim()) {
    return true;
  }

  if (!texto) {
    return false;
  }

  return normalizar(texto).includes(normalizar(consulta));
}
