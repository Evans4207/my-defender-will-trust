/**
 * Minimal ZIP writer, STORE method only (no compression).
 *
 * Deliberately dependency-free. The files we export are .docx and .pdf, both
 * already-compressed container formats, so deflating them again buys almost
 * nothing and would pull a compression library in for no real gain.
 *
 * Produces a standard single-disk archive with local file headers, a central
 * directory and an end-of-central-directory record. No Zip64: the export is
 * capped well below the 4 GB / 65535-entry limits.
 */

export type ZipEntry = {
  /** Path inside the archive. Forward slashes only. */
  name: string;
  data: Uint8Array;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Make entry names safe and unique. Duplicates are legal in a ZIP but many
 * extractors silently drop one, which would lose a customer's file.
 */
export function sanitizeEntryNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((raw) => {
    const cleaned =
      raw
        .replace(/\\/g, "/")
        .split("/")
        // Drop empty, "." and ".." segments: that removes any traversal and any
        // leading slash in one pass, without leaving "././" artifacts behind.
        .filter((seg) => seg !== "" && seg !== "." && seg !== "..")
        .join("/")
        // Control characters are invalid in archive entry names.
        .replace(/[\x00-\x1f\x7f]/g, "")
        .trim() || "file";
    const count = seen.get(cleaned) ?? 0;
    seen.set(cleaned, count + 1);
    if (count === 0) return cleaned;
    const dot = cleaned.lastIndexOf(".");
    return dot > 0
      ? `${cleaned.slice(0, dot)} (${count})${cleaned.slice(dot)}`
      : `${cleaned} (${count})`;
  });
}

/** DOS date/time as used in ZIP headers. Seconds have 2-second resolution. */
function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      (Math.floor(date.getSeconds() / 2) & 0x1f),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/** Build a complete ZIP archive from the given entries. */
export function createZip(entries: ZipEntry[], modified = new Date()): Buffer {
  const { time, date } = dosDateTime(modified);
  const names = sanitizeEntryNames(entries.map((e) => e.name));

  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  entries.forEach((entry, i) => {
    const nameBytes = Buffer.from(names[i], "utf8");
    const data = Buffer.from(entry.data);
    const sum = crc32(data);

    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0); // local file header signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    local.writeUInt16LE(0, 8); // method: store
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(sum, 14);
    local.writeUInt32LE(data.length, 18); // compressed size
    local.writeUInt32LE(data.length, 22); // uncompressed size
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28); // extra field length
    nameBytes.copy(local, 30);

    locals.push(local, data);

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0); // central directory signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0x0800, 8); // flags: UTF-8 names
    central.writeUInt16LE(0, 10); // method: store
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(sum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42); // offset of local header
    nameBytes.copy(central, 46);

    centrals.push(central);
    offset += local.length + data.length;
  });

  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  end.writeUInt16LE(0, 4); // this disk
  end.writeUInt16LE(0, 6); // disk with central directory
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...locals, centralDirectory, end]);
}
