import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deflateSync } from 'node:zlib';

const paramsSchema = z.object({
  width: z.string().regex(/^\d+$/),
  height: z.string().regex(/^\d+$/)
});

const color = { r: 0xF3, g: 0xF4, b: 0xF6, a: 0xFF };

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

const crc32 = (buffer: Buffer): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createChunk = (type: string, data: Buffer): Buffer => {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
};

const createPlaceholderPng = (width: number, height: number): Buffer => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel + 1;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLength;
    rawData[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixelStart = rowStart + 1 + x * bytesPerPixel;
      rawData[pixelStart] = color.r;
      rawData[pixelStart + 1] = color.g;
      rawData[pixelStart + 2] = color.b;
      rawData[pixelStart + 3] = color.a;
    }
  }

  const compressed = deflateSync(rawData, { level: 9 });
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
};

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: { width: string; height: string } }
): Promise<Response> {
  const parseResult = paramsSchema.safeParse(context.params);

  if (!parseResult.success) {
    return new NextResponse('Invalid dimensions', { status: 400 });
  }

  const width = Math.max(1, Math.min(1024, Number.parseInt(parseResult.data.width, 10)));
  const height = Math.max(1, Math.min(1024, Number.parseInt(parseResult.data.height, 10)));

  const pngBuffer = createPlaceholderPng(width, height);

  return new NextResponse(pngBuffer, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400, immutable'
    }
  });
}

