// Minimal uncompressed DDS (A8R8G8B8 / BGRA) encoder.
//
// Stellaris loads its interface icons as .dds. Browsers can't natively write
// DDS, but the format also supports plain uncompressed 32-bit BGRA surfaces,
// which the engine reads fine. We encode that directly from canvas pixels — no
// block compression needed, and the resulting files are small at icon sizes.

const DDSD_CAPS = 0x1;
const DDSD_HEIGHT = 0x2;
const DDSD_WIDTH = 0x4;
const DDSD_PIXELFORMAT = 0x1000;
const DDSD_PITCH = 0x8;

const DDPF_ALPHAPIXELS = 0x1;
const DDPF_RGB = 0x40;

const DDSCAPS_TEXTURE = 0x1000;

/** Encode RGBA pixel data (e.g. from CanvasRenderingContext2D.getImageData) into a DDS file. */
export function encodeDds(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const headerSize = 128;
  const out = new Uint8Array(headerSize + width * height * 4);
  const dv = new DataView(out.buffer);

  // Magic: "DDS "
  dv.setUint32(0, 0x20534444, true);
  // DDS_HEADER
  dv.setUint32(4, 124, true); // dwSize
  dv.setUint32(
    8,
    DDSD_CAPS | DDSD_HEIGHT | DDSD_WIDTH | DDSD_PIXELFORMAT | DDSD_PITCH,
    true,
  ); // dwFlags
  dv.setUint32(12, height, true);
  dv.setUint32(16, width, true);
  dv.setUint32(20, width * 4, true); // dwPitchOrLinearSize
  dv.setUint32(24, 0, true); // dwDepth
  dv.setUint32(28, 0, true); // dwMipMapCount
  // 11 reserved dwords (32..75) left zero.

  // DDS_PIXELFORMAT (offset 76)
  dv.setUint32(76, 32, true); // dwSize
  dv.setUint32(80, DDPF_RGB | DDPF_ALPHAPIXELS, true); // dwFlags
  dv.setUint32(84, 0, true); // dwFourCC
  dv.setUint32(88, 32, true); // dwRGBBitCount
  dv.setUint32(92, 0x00ff0000, true); // R mask
  dv.setUint32(96, 0x0000ff00, true); // G mask
  dv.setUint32(100, 0x000000ff, true); // B mask
  dv.setUint32(104, 0xff000000, true); // A mask

  // caps (offset 108)
  dv.setUint32(108, DDSCAPS_TEXTURE, true);
  // caps2..4 + reserved2 left zero (112..123)

  // Pixel data: convert RGBA -> BGRA byte order.
  let o = headerSize;
  for (let i = 0; i < width * height * 4; i += 4) {
    out[o++] = rgba[i + 2]; // B
    out[o++] = rgba[i + 1]; // G
    out[o++] = rgba[i]; // R
    out[o++] = rgba[i + 3]; // A
  }
  return out;
}

/**
 * Load an image data-URL, scale it to `size`x`size`, and return DDS bytes.
 * Returns null if the image can't be decoded.
 */
export async function imageDataUrlToDds(
  dataUrl: string,
  size = 128,
): Promise<Uint8Array | null> {
  const img = await loadImage(dataUrl);
  if (!img) return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return encodeDds(data, size, size);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
