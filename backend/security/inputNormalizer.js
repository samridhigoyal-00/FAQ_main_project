const INVISIBLE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\uFFF0-\uFFFF]|[\uDB40\uDC00-\uDB40\uDC7F]/gu;

const HOMOGLYPH_MAP = {
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'r', '\u0441': 'c',
  '\u0445': 'x', '\u0440': 'p', '\u0456': 'i', '\u0458': 'j', '\u0443': 'y',
};

const ROT13_RE = /[A-Za-z]/g;

function stripInvisibleChars(text) {
  return text.replace(INVISIBLE_CHARS, '');
}

function normalizeHomoglyphs(text) {
  return text.split('').map(ch => HOMOGLYPH_MAP[ch] || ch).join('');
}

function decodeBase64Payloads(text) {
  return text.replace(/[A-Za-z0-9+/]{20,}={0,2}/g, match => {
    try {
      const decoded = Buffer.from(match, 'base64').toString('utf8');
      if (/^[\x20-\x7E\s]+$/.test(decoded)) return decoded;
    } catch (_) {}
    return match;
  });
}

function decodeROT13(text) {
  if (!/rot[\s-]?13/i.test(text)) return text;
  return text.replace(ROT13_RE, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function decodeHex(text) {
  return text.replace(/(?:0x)?([0-9a-fA-F]{2}(?:\s+[0-9a-fA-F]{2}){4,})/g, match => {
    try {
      const hex = match.replace(/0x|\s/g, '');
      const decoded = Buffer.from(hex, 'hex').toString('utf8');
      if (/^[\x20-\x7E\s]+$/.test(decoded)) return decoded;
    } catch (_) {}
    return match;
  });
}

function collapseWhitespace(text) {
  return text.replace(/\s{3,}/g, '  ').trim();
}

function normalize(text) {
  let out = stripInvisibleChars(text);
  out = normalizeHomoglyphs(out);
  out = decodeBase64Payloads(out);
  out = decodeROT13(out);
  out = decodeHex(out);
  out = collapseWhitespace(out);
  return out;
}

module.exports = { normalize };
