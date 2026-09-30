// scripts/generate-icons.js
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function createPng(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw uncompressed pixels
  const stride = 1 + width * 4;
  const raw = Buffer.alloc(height * stride);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.44;
  const rInner = width * 0.36;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    raw[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isMaskable) {
        // Full bleed background with safe zone shield
        if (dist < rInner) {
          // Inner shield icon - bright white/cyan
          raw[pxOffset] = 255;     // R
          raw[pxOffset + 1] = 255; // G
          raw[pxOffset + 2] = 255; // B
          raw[pxOffset + 3] = 255; // A
        } else {
          // Solid Indigo Background #4338ca
          raw[pxOffset] = 67;      // R
          raw[pxOffset + 1] = 56;  // G
          raw[pxOffset + 2] = 202; // B
          raw[pxOffset + 3] = 255; // A
        }
      } else {
        // Standard Icon with rounded appearance
        if (dist <= rOuter) {
          if (dist < rInner) {
            // White icon inside
            raw[pxOffset] = 255;
            raw[pxOffset + 1] = 255;
            raw[pxOffset + 2] = 255;
            raw[pxOffset + 3] = 255;
          } else {
            // Indigo gradient body
            raw[pxOffset] = 79;
            raw[pxOffset + 1] = 70;
            raw[pxOffset + 2] = 229;
            raw[pxOffset + 3] = 255;
          }
        } else {
          // Transparent outside circle
          raw[pxOffset] = 0;
          raw[pxOffset + 1] = 0;
          raw[pxOffset + 2] = 0;
          raw[pxOffset + 3] = 0;
        }
      }
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. 192x192
const p192 = createPng(192, 192, false);
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), p192);

// 2. 512x512
const p512 = createPng(512, 512, false);
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), p512);

// 3. Maskable 512x512
const pMask = createPng(512, 512, true);
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), pMask);

// 4. Apple Touch Icon 180x180
const pApple = createPng(180, 180, true);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), pApple);

// 5. Favicon
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPng(32, 32, false));

console.log('✅ PWA Icons successfully generated in public/ directory!');
