import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  Footer,
  PageNumber,
} from "docx";
import type { AssembledDocument } from "./model";

/** Render an assembled document to a DOCX buffer. */
export async function renderDocx(doc: AssembledDocument): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: doc.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
  );

  for (const section of doc.sections) {
    children.push(
      new Paragraph({
        text: section.heading,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
      }),
    );
    for (const p of section.paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun(p)],
          spacing: { after: 100 },
        }),
      );
    }
  }

  // Signature block
  children.push(
    new Paragraph({
      text: "Execution",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 80 },
    }),
  );
  for (const line of doc.signatureLines) {
    children.push(
      new Paragraph({ spacing: { before: 240 }, children: [new TextRun("__________________________________________")] }),
    );
    children.push(
      new Paragraph({ children: [new TextRun({ text: line, italics: true, size: 18 })] }),
    );
  }

  const document = new Document({
    creator: "My Defender Will & Trust",
    title: doc.title,
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "DRAFT — [ATTORNEY REVIEW REQUIRED] — not legal advice — page ",
                    size: 16,
                    color: "888888",
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

/** Extract document.xml text from a DOCX buffer (used in tests). */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) return "";
  // Strip tags, decode a couple of common entities.
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
