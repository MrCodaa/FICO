// Uklanja metapodatke (EXIF/GPS, XMP, tekstualne komentare) iz slike bez ikakve biblioteke.
// Klijent ih već briše (canvas), ali server ne smije vjerovati klijentu: neko može poslati
// originalnu sliku direktno na API. Ako je fajl oštećen ili neočekivan, vraća se neizmijenjen
// (tip je već provjeren po magic bajtima).
import type { DetectedImageType } from "./detectImageType";

function stripJpeg(buf: Buffer): Buffer {
  const parts: Buffer[] = [buf.subarray(0, 2)]; // SOI
  let pos = 2;
  while (pos + 4 <= buf.length) {
    if (buf[pos] !== 0xff) return buf;
    const marker = buf[pos + 1];
    if (marker === 0xff) {
      pos += 1;
      continue;
    }
    // SOS: dalje idu sami podaci slike, kopiraj sve do kraja.
    if (marker === 0xda) {
      parts.push(buf.subarray(pos));
      return Buffer.concat(parts);
    }
    const len = buf.readUInt16BE(pos + 2);
    if (len < 2 || pos + 2 + len > buf.length) return buf;
    const segment = buf.subarray(pos, pos + 2 + len);
    // APP1 (EXIF/XMP), APP13 (Photoshop/IPTC) i COM (komentar) se izbacuju.
    const drop = marker === 0xe1 || marker === 0xed || marker === 0xfe;
    if (!drop) parts.push(segment);
    pos += 2 + len;
  }
  return buf;
}

const PNG_DROP = new Set(["eXIf", "tEXt", "iTXt", "zTXt"]);

function stripPng(buf: Buffer): Buffer {
  const parts: Buffer[] = [buf.subarray(0, 8)];
  let pos = 8;
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const end = pos + 12 + len;
    if (end > buf.length) return buf;
    const type = buf.toString("ascii", pos + 4, pos + 8);
    if (!PNG_DROP.has(type)) parts.push(buf.subarray(pos, end));
    pos = end;
    if (type === "IEND") return Buffer.concat(parts);
  }
  return buf;
}

function stripWebp(buf: Buffer): Buffer {
  const parts: Buffer[] = [];
  let pos = 12;
  while (pos + 8 <= buf.length) {
    const type = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const end = pos + 8 + size + (size % 2);
    if (pos + 8 + size > buf.length) return buf;
    const chunk = Buffer.from(buf.subarray(pos, Math.min(end, buf.length)));
    if (type === "EXIF" || type === "XMP ") {
      pos = end;
      continue;
    }
    if (type === "VP8X" && chunk.length >= 9) chunk[8] = (chunk[8] ?? 0) & ~(0x08 | 0x04); // zastavice EXIF i XMP
    parts.push(chunk);
    pos = end;
  }
  const body = Buffer.concat(parts);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(body.length + 4, 4);
  header.write("WEBP", 8, "ascii");
  return Buffer.concat([header, body]);
}

export function stripImageMetadata(buf: Buffer, type: DetectedImageType): Buffer {
  try {
    if (type === "image/jpeg") return stripJpeg(buf);
    if (type === "image/png") return stripPng(buf);
    return stripWebp(buf);
  } catch {
    return buf;
  }
}
