const HAS_TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/;

function parseDbTimestamp(date) {
  if (date instanceof Date) return date;
  const trimmed = date.trim();
  if (!trimmed) return new Date(NaN);
  if (HAS_TIMEZONE_SUFFIX.test(trimmed)) return new Date(trimmed);
  const iso = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  return new Date(`${iso}Z`);
}

const fmt = (d) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseDbTimestamp(d));

const dbValue = "2026-07-18T13:30:00";
const expected = "18/07/2026, 10:30";
const displayed = fmt(dbValue);

console.log("DB (sem Z):", dbValue);
console.log("Exibido:", displayed);
console.log("Esperado:", expected);
console.log("Status:", displayed === expected ? "OK" : "FALHOU");

if (displayed !== expected) process.exit(1);
