function toBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'si', 'sí', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'off'].includes(v)) return false;
  }
  return fallback;
}

function safeJsonParse(value, fallback) {
  try {
    if (value == null || value === '') return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  toBool,
  safeJsonParse,
  normalizeText,
  escapeHtml
};
