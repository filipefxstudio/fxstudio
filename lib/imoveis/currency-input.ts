function formatIntegerPart(intPart: string): string {
  const digits = intPart.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatFromRawInput(input: string): string {
  const cleaned = input.replace(/[^\d,]/g, "");
  const commaIndex = cleaned.indexOf(",");
  const intRaw = commaIndex >= 0 ? cleaned.slice(0, commaIndex) : cleaned;
  const decRaw = commaIndex >= 0 ? cleaned.slice(commaIndex + 1) : "";
  const formattedInt = formatIntegerPart(intRaw);

  if (commaIndex >= 0) {
    return `${formattedInt},${decRaw.replace(/\D/g, "").slice(0, 2)}`;
  }

  return formattedInt;
}

/** Formata valor numérico ou texto bruto para exibição no input (ex.: 800.000 ou 800.000,00). */
export function formatCurrencyInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }

    const [intPart, decPart] = value.toFixed(2).split(".");
    const formatted = formatIntegerPart(intPart);

    if (decPart === "00") {
      return formatted;
    }

    return `${formatted},${decPart}`;
  }

  return formatFromRawInput(value);
}

/** Converte texto formatado (800.000,50) em número puro para persistência. */
export function parseCurrencyInput(formatted: string): number | null {
  const trimmed = formatted.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);

  return Number.isFinite(num) ? num : null;
}
