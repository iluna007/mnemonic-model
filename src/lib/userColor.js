/** Colores por usuario (determinista a partir de user_id) para distinguir en comentarios */
const HUES = [0, 30, 60, 120, 180, 220, 270, 310]
const SAT = 0.7
const LIGHT = 0.5

function simpleHash(str) {
  let h = 0
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** Devuelve un color hex para el user_id (siempre el mismo para el mismo usuario) */
export function getColorForUserId(userId) {
  if (!userId) return '#9ca3af'
  const hash = simpleHash(userId)
  const hue = HUES[hash % HUES.length]
  const s = SAT
  const l = LIGHT
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0,
    g = 0,
    b = 0
  if (hue < 60) {
    r = c
    g = x
    b = 0
  } else if (hue < 120) {
    r = x
    g = c
    b = 0
  } else if (hue < 180) {
    r = 0
    g = c
    b = x
  } else if (hue < 240) {
    r = 0
    g = x
    b = c
  } else if (hue < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }
  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
