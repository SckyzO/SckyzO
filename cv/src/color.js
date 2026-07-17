'use strict';

// Shared color helpers, previously duplicated across build/build.js and
// src/templates/index.js.

function normalizeHex(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('#')) return null;
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  if (trimmed.length === 7) {
    return trimmed.toLowerCase();
  }
  return null;
}

function hexToRgb(value) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  const hex = normalized.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r}, ${g}, ${b}`;
}

function validateRgb(value, label) {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be an RGB string like "59, 130, 246".`);
  }
  const match = value.match(/^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/);
  if (!match) {
    throw new Error(`${label} must be an RGB string like "59, 130, 246".`);
  }
  const parts = match.slice(1).map((part) => Number(part));
  if (parts.some((part) => part < 0 || part > 255)) {
    throw new Error(`${label} values must be in the 0-255 range.`);
  }
  return parts.join(', ');
}

module.exports = { normalizeHex, hexToRgb, validateRgb };
