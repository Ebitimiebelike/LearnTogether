/**
 * Generates the PWA icons in `public/icons/`.
 *
 * PNGs are encoded here with Node's built-in zlib rather than pulled from an
 * image library, so the project keeps no dependency that exists only to draw
 * three squares. Run with `npm run icons`; the output is committed, so this
 * does not run during a build.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

/** Brand colours, matching `--primary` and `--canvas` in globals.css. */
const PRIMARY = [0x25, 0x57, 0xc7];
const LIGHT = [0xf7, 0xf6, 0xf3];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** Encodes RGB pixel data as a PNG. `pixels` is a flat [r,g,b,...] array. */
function encodePng(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour
  // 10–12 are compression, filter and interlace methods, all 0.

  // Each scanline is prefixed with a filter-type byte; 0 means "no filter".
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 3;
      const target = rowStart + 1 + x * 3;
      raw[target] = pixels[source];
      raw[target + 1] = pixels[source + 1];
      raw[target + 2] = pixels[source + 2];
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Draws the mark: a rounded square in the brand blue with a light "L" on it.
 *
 * `padding` is the fraction of the icon left as background — maskable icons
 * need their content inside the safe zone, so they are drawn smaller.
 */
function drawIcon(size, { padding = 0, rounded = true } = {}) {
  const pixels = new Uint8Array(size * size * 3);
  const inset = Math.round(size * padding);
  const boxSize = size - inset * 2;
  const radius = rounded ? boxSize * 0.22 : 0;

  // Stroke geometry for the "L", in units of the inner box.
  const strokeWidth = boxSize * 0.16;
  const left = inset + boxSize * 0.32;
  const top = inset + boxSize * 0.24;
  const bottom = inset + boxSize * 0.72;
  const right = inset + boxSize * 0.7;

  const insideRoundedBox = (x, y) => {
    if (x < inset || y < inset || x >= inset + boxSize || y >= inset + boxSize) {
      return false;
    }
    if (radius === 0) return true;
    // Only the four corner squares need a distance check.
    const dx = Math.max(inset + radius - x, x - (inset + boxSize - 1 - radius), 0);
    const dy = Math.max(inset + radius - y, y - (inset + boxSize - 1 - radius), 0);
    return dx * dx + dy * dy <= radius * radius;
  };

  const insideL = (x, y) => {
    const inVertical = x >= left && x < left + strokeWidth && y >= top && y < bottom;
    const inFoot =
      y >= bottom - strokeWidth && y < bottom && x >= left && x < right;
    return inVertical || inFoot;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let colour = LIGHT;
      if (insideRoundedBox(x, y)) colour = insideL(x, y) ? LIGHT : PRIMARY;
      const offset = (y * size + x) * 3;
      pixels[offset] = colour[0];
      pixels[offset + 1] = colour[1];
      pixels[offset + 2] = colour[2];
    }
  }

  return encodePng(size, size, pixels);
}

mkdirSync(OUT_DIR, { recursive: true });

const outputs = [
  ["icon-192.png", drawIcon(192)],
  ["icon-512.png", drawIcon(512)],
  ["apple-touch-icon.png", drawIcon(180, { rounded: false })],
  // Maskable icons are cropped to a circle on some launchers, so the mark sits
  // well inside the 80% safe zone.
  ["maskable-512.png", drawIcon(512, { padding: 0.14, rounded: false })],
];

for (const [name, buffer] of outputs) {
  writeFileSync(join(OUT_DIR, name), buffer);
  console.log(`wrote public/icons/${name} (${buffer.length} bytes)`);
}
