const parseDecimal = (value) => {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim();
  if (raw === "") return 0;
  let normalized = raw;
  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");
  if (hasComma && hasDot) {
    normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
  } else if (hasComma) {
    normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
  } else {
    normalized = normalized.replace(/\./g, "");
  }
  const num = Number(normalized);
  if (Number.isNaN(num)) return 0;
  return num;
};

console.log(parseDecimal("389.63"));
console.log(parseDecimal("1.234,56"));
console.log(parseDecimal("100"));
