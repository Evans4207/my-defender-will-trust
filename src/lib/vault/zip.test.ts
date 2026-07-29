import { describe, it, expect } from "vitest";
import { createZip, crc32, sanitizeEntryNames } from "./zip";

const bytes = (s: string) => new TextEncoder().encode(s);
const FIXED = new Date("2026-07-01T12:00:00.000Z");

describe("crc32", () => {
  // The canonical CRC-32 check value for "123456789".
  it("matches the known check value", () => {
    expect(crc32(bytes("123456789"))).toBe(0xcbf43926);
  });

  it("is 0 for empty input", () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe("sanitizeEntryNames", () => {
  it("leaves ordinary names alone", () => {
    expect(sanitizeEntryNames(["will.docx"])).toEqual(["will.docx"]);
  });

  it("keeps spaces and parentheses in names", () => {
    expect(sanitizeEntryNames(["Last Will (signed).docx"])).toEqual([
      "Last Will (signed).docx",
    ]);
  });

  it("de-duplicates, preserving the extension", () => {
    expect(sanitizeEntryNames(["will.docx", "will.docx", "will.docx"])).toEqual([
      "will.docx",
      "will (1).docx",
      "will (2).docx",
    ]);
  });

  it("de-duplicates names with no extension", () => {
    expect(sanitizeEntryNames(["notes", "notes"])).toEqual(["notes", "notes (1)"]);
  });

  it("strips traversal segments, leading slashes and backslashes", () => {
    expect(sanitizeEntryNames(["/../../etc/passwd"])).toEqual(["etc/passwd"]);
    expect(sanitizeEntryNames(["a\\b.txt"])).toEqual(["a/b.txt"]);
    expect(sanitizeEntryNames(["./a/./b.txt"])).toEqual(["a/b.txt"]);
    expect(sanitizeEntryNames(["a//b.txt"])).toEqual(["a/b.txt"]);
  });

  it("falls back to a placeholder for an empty name", () => {
    expect(sanitizeEntryNames([""])).toEqual(["file"]);
  });
});

describe("createZip", () => {
  it("writes the local header, central directory and EOCD signatures", () => {
    const zip = createZip([{ name: "a.txt", data: bytes("hello") }], FIXED);
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    const eocd = zip.length - 22;
    expect(zip.readUInt32LE(eocd)).toBe(0x06054b50);
    expect(zip.readUInt16LE(eocd + 8)).toBe(1);
    expect(zip.readUInt16LE(eocd + 10)).toBe(1);
  });

  it("records the entry count for several files", () => {
    const zip = createZip(
      [
        { name: "a.txt", data: bytes("aaa") },
        { name: "b.txt", data: bytes("bbbb") },
        { name: "c.txt", data: bytes("cc") },
      ],
      FIXED,
    );
    expect(zip.readUInt16LE(zip.length - 22 + 10)).toBe(3);
  });

  it("stores data uncompressed and byte-identical", () => {
    const payload = bytes("the quick brown fox");
    const zip = createZip([{ name: "a.txt", data: payload }], FIXED);
    const start = 30 + zip.readUInt16LE(26);
    expect(zip.subarray(start, start + payload.length).toString("utf8")).toBe(
      "the quick brown fox",
    );
    expect(zip.readUInt16LE(8)).toBe(0); // method 0 = store
  });

  it("writes matching compressed and uncompressed sizes plus the CRC", () => {
    const payload = bytes("123456789");
    const zip = createZip([{ name: "a.txt", data: payload }], FIXED);
    expect(zip.readUInt32LE(14)).toBe(0xcbf43926);
    expect(zip.readUInt32LE(18)).toBe(payload.length);
    expect(zip.readUInt32LE(22)).toBe(payload.length);
  });

  it("sets the UTF-8 name flag", () => {
    const zip = createZip([{ name: "café.txt", data: bytes("x") }], FIXED);
    expect(zip.readUInt16LE(6) & 0x0800).toBe(0x0800);
  });

  it("produces a valid empty archive", () => {
    const zip = createZip([], FIXED);
    expect(zip.length).toBe(22);
    expect(zip.readUInt32LE(0)).toBe(0x06054b50);
    expect(zip.readUInt16LE(10)).toBe(0);
  });

  it("points the central directory at the right offset", () => {
    const zip = createZip([{ name: "a.txt", data: bytes("hello") }], FIXED);
    const eocd = zip.length - 22;
    const cdOffset = zip.readUInt32LE(eocd + 16);
    const cdSize = zip.readUInt32LE(eocd + 12);
    expect(zip.readUInt32LE(cdOffset)).toBe(0x02014b50);
    expect(cdOffset + cdSize).toBe(eocd);
  });
});
