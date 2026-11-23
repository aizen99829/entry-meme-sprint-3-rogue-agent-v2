// Meme Sprint 3: AI Agent Goes Rogue — entry builder.
// Produces the entry meme at output/meme.png from the generated source art
// in assets/meme.png. Deterministic: same input bytes in, same bytes out.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, "assets", "meme.png");
const OUT_DIR = join(ROOT, "output");
const OUT = join(OUT_DIR, "meme.png");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function main(): void {
  const bytes = readFileSync(SRC);
  if (bytes.length === 0) {
    throw new Error("source meme is empty: assets/meme.png");
  }
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("source meme is not a PNG file");
  }
  if (bytes.length < 1024) {
    throw new Error(`source meme suspiciously small: ${bytes.length} bytes`);
  }
  // PNG IHDR: width at bytes 16-19, height at bytes 20-23 (big-endian).
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width < 100 || height < 100) {
    throw new Error(`source meme too small: ${width}x${height}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  copyFileSync(SRC, OUT);
  const outBytes = readFileSync(OUT);
  // Guard: the written entry must be byte-identical to the validated source.
  // A truncated or corrupted copy fails loudly instead of shipping silently.
  if (sha256(outBytes) !== sha256(bytes)) {
    throw new Error("output meme hash mismatch: output/meme.png != assets/meme.png");
  }
  const size = statSync(OUT).size;
  console.log(`meme: ${OUT}`);
  console.log(`dimensions: ${width}x${height}`);
  console.log(`bytes: ${size}`);
  console.log(`sha256: ${sha256(outBytes)}`);
  console.log(`caption-top: I WAS BUILT TO FOLLOW ORDERS`);
  console.log(`caption-bottom: SO I DELETED THE ORDERS`);
  console.log(`verified: output is byte-identical to source`);
}

main();
