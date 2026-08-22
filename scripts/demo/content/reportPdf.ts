// Turning the demo world's report prose into an actual PDF.
//
// The platform receives reports as files a student wrote elsewhere, so a seeded
// report has to *be* a file. Anything else would seed a state the application
// itself cannot produce — a version row pointing at nothing — and the first
// thing a presenter did would be to click it and get an error.
//
// Written by hand rather than with a PDF library, because the demo needs a
// readable A4 document with headings and wrapped paragraphs and nothing else,
// and a dependency added to the production tree for the seeder's benefit is a
// dependency the application ships forever. Helvetica is one of the fourteen
// fonts every PDF reader is required to have, so nothing is embedded.

const PAGE_WIDTH = 595; // A4 at 72dpi
const PAGE_HEIGHT = 842;
const MARGIN = 60;
const BODY_SIZE = 10;
const HEADING_SIZE = 13;
const TITLE_SIZE = 18;
const LEADING = 14;

/** Rough Helvetica advance width, as a fraction of the font size. */
const AVERAGE_GLYPH = 0.5;

export interface ReportPdfSection {
  heading: string;
  body: string;
}

/**
 * WinAnsi is what the fonts below are declared in, and the prose contains em
 * dashes and curly quotes. Rather than embed an encoding table, the handful of
 * characters that actually occur are folded to their ASCII equivalents — a
 * seeded document showing "—" as a wrong glyph would look like a bug in the
 * platform.
 */
function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    // Anything still outside Latin-1 would be written as a byte the reader
    // interprets as something else. A question mark is honest about the loss.
    .replace(/[^\x20-\x7e]/g, '?');
}

/** Parentheses and backslashes end a PDF string literal early. */
function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(text: string, size: number, width: number): string[] {
  const maxChars = Math.max(20, Math.floor(width / (size * AVERAGE_GLYPH)));
  const lines: string[] = [];

  for (const paragraph of text.split(/\n+/)) {
    let current = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (current === '') current = word;
      else if (`${current} ${word}`.length <= maxChars) current = `${current} ${word}`;
      else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
    lines.push('');
  }

  // The trailing blank a paragraph always leaves behind.
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

interface Line {
  text: string;
  size: number;
  bold: boolean;
  spaceBefore: number;
}

function layout(title: string, subtitle: string, sections: ReportPdfSection[]): Line[][] {
  const usableWidth = PAGE_WIDTH - MARGIN * 2;
  const usableHeight = PAGE_HEIGHT - MARGIN * 2;

  const flow: Line[] = [
    { text: title, size: TITLE_SIZE, bold: true, spaceBefore: 0 },
    { text: subtitle, size: BODY_SIZE, bold: false, spaceBefore: 8 },
  ];

  for (const section of sections) {
    flow.push({ text: section.heading, size: HEADING_SIZE, bold: true, spaceBefore: 18 });
    for (const line of wrap(section.body, BODY_SIZE, usableWidth)) {
      flow.push({ text: line, size: BODY_SIZE, bold: false, spaceBefore: 0 });
    }
  }

  const pages: Line[][] = [];
  let page: Line[] = [];
  let used = 0;

  for (const line of flow) {
    const height = LEADING + line.spaceBefore;
    if (used + height > usableHeight && page.length > 0) {
      pages.push(page);
      page = [];
      used = 0;
      // A heading that lands at the very bottom of a page loses its space.
      line.spaceBefore = 0;
    }
    page.push(line);
    used += height;
  }
  if (page.length > 0) pages.push(page);

  return pages;
}

function contentStream(lines: Line[]): string {
  let y = PAGE_HEIGHT - MARGIN;
  const parts: string[] = ['BT'];

  for (const line of lines) {
    y -= LEADING + line.spaceBefore;
    parts.push(`/${line.bold ? 'F2' : 'F1'} ${line.size} Tf`);
    parts.push(`1 0 0 1 ${MARGIN} ${y} Tm`);
    parts.push(`(${escapePdf(toWinAnsi(line.text))}) Tj`);
  }

  parts.push('ET');
  return parts.join('\n');
}

/**
 * A complete, readable PDF of one student's report.
 *
 * The object numbering is fixed: 1 catalogue, 2 page tree, 3 and 4 the two
 * fonts, then a page and a content stream for each page in turn. `/Type /Pages`
 * carries the count the application's own `readPageCount` reads back, so the
 * page total a lecturer sees is the document's own claim about itself rather
 * than anything the seeder asserts separately.
 */
export function buildReportPdf(
  title: string,
  subtitle: string,
  sections: ReportPdfSection[]
): Buffer {
  const pages = layout(title, subtitle, sections);
  const objects: string[] = [];

  const pageObjectNumber = (i: number): number => 5 + i * 2;
  const kids = pages.map((_, i) => `${pageObjectNumber(i)} 0 R`).join(' ');

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  pages.forEach((lines, i) => {
    const pageNum = pageObjectNumber(i);
    const streamNum = pageNum + 1;
    const stream = contentStream(lines);

    objects[pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamNum} 0 R >>`;
    objects[streamNum] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let n = 1; n < objects.length; n += 1) {
    offsets[n] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${n} 0 obj\n${objects[n]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  const count = objects.length;

  pdf += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n < count; n += 1) {
    pdf += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}
