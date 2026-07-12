import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Convert a DOCX buffer to PDF. Tries Gotenberg (GOTENBERG_URL) first, then a
 * local LibreOffice (`soffice`). Returns null if no converter is available —
 * generation still succeeds with the DOCX; PDF is best-effort (build plan §2).
 */
export async function convertDocxToPdf(docx: Buffer): Promise<Buffer | null> {
  const gotenberg = process.env.GOTENBERG_URL;
  if (gotenberg) {
    try {
      const form = new FormData();
      form.append("files", new Blob([new Uint8Array(docx)]), "document.docx");
      const res = await fetch(
        `${gotenberg.replace(/\/$/, "")}/forms/libreoffice/convert`,
        { method: "POST", body: form },
      );
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      console.error("Gotenberg convert returned", res.status);
    } catch (err) {
      console.error("Gotenberg convert failed:", err);
    }
  }

  try {
    return await sofficeConvert(docx);
  } catch (err) {
    console.error("LibreOffice convert unavailable:", err);
    return null;
  }
}

async function sofficeConvert(docx: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "mdwt-pdf-"));
  try {
    const inPath = join(dir, "document.docx");
    await writeFile(inPath, docx);
    const bin = process.env.SOFFICE_PATH || "soffice";
    await execFileAsync(bin, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      dir,
      inPath,
    ]);
    return await readFile(join(dir, "document.pdf"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
