const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUTPUTS = [
  { width: 192, height: 192, fileName: 'icon-192x192.png' },
  { width: 512, height: 512, fileName: 'icon-512x512.png' }
];

const COLOR = { r: 0xF5, g: 0x7C, b: 0x00, a: 0xFF };

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createChunk = (type, data) => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
};

const createPng = ({ width, height }) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method

  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel + 1; // +1 for filter byte
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLength;
    rawData[rowStart] = 0; // no filter
    for (let x = 0; x < width; x += 1) {
      const pixelStart = rowStart + 1 + x * bytesPerPixel;
      rawData[pixelStart] = COLOR.r;
      rawData[pixelStart + 1] = COLOR.g;
      rawData[pixelStart + 2] = COLOR.b;
      rawData[pixelStart + 3] = COLOR.a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
};

const publicDir = path.join(__dirname, '..', 'public');

OUTPUTS.forEach((output) => {
  const pngBuffer = createPng(output);
  const filePath = path.join(publicDir, output.fileName);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Generated ${output.fileName} (${output.width}x${output.height})`);
});

