const SAFE_EDGE = 3;

export const maskSensitiveValue = (value: string | number | null | undefined): string => {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  if (text.length <= SAFE_EDGE * 2) return `${text.slice(0, 1)}•••${text.slice(-1)}`;
  return `${text.slice(0, SAFE_EDGE)}•••••${text.slice(-SAFE_EDGE)}`;
};

export const maskAmount = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return "••••";
  return "••••••";
};

export const sanitizeCsvCell = (value: string): string => {
  const trimmed = value.trim().replace(/^"|"$/g, "");
  return trimmed
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F<>`"'\\]/g, "")
    .replace(/^[=+@-]+/, "")
    .slice(0, 120);
};

export const isSafeIdentifier = (value: string): boolean => /^[A-Za-z0-9._:-]{1,80}$/.test(value);