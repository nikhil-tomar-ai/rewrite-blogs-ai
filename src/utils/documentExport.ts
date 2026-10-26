import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

/**
 * Triggers a download of a given Blob with specified filename
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Parse inline bold and italic formatting into TextRun array
 */
function parseInlineRuns(lineText: string): TextRun[] {
  const runs: TextRun[] = [];
  // Tokenize by **bold** or *italic*
  // Regex: matches **bold** or *italic* or plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|[^*]+)/g;
  let match;

  while ((match = regex.exec(lineText)) !== null) {
    const segment = match[0];
    if (segment.startsWith('**') && segment.endsWith('**') && segment.length >= 4) {
      runs.push(
        new TextRun({
          text: segment.slice(2, -2),
          bold: true
        })
      );
    } else if (segment.startsWith('*') && segment.endsWith('*') && segment.length >= 2) {
      runs.push(
        new TextRun({
          text: segment.slice(1, -1),
          italics: true
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: segment
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: lineText }));
  }

  return runs;
}

/**
 * Generates a real Microsoft Word (.docx) file from Markdown text
 */
export async function exportToDocx(title: string, markdownContent: string): Promise<Blob> {
  const lines = markdownContent.split('\n');
  const docChildren: Paragraph[] = [];

  // Add Document Title Header if provided
  if (title && title.trim().length > 0) {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [
          new TextRun({
            text: title.trim(),
            bold: true,
            size: 36 // 18pt
          })
        ],
        spacing: { after: 300 }
      })
    );
  }

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      const headingText = line.substring(2).trim();
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: parseInlineRuns(headingText),
          spacing: { before: 360, after: 180 }
        })
      );
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      const headingText = line.substring(3).trim();
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: parseInlineRuns(headingText),
          spacing: { before: 280, after: 140 }
        })
      );
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      const headingText = line.substring(4).trim();
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: parseInlineRuns(headingText),
          spacing: { before: 220, after: 100 }
        })
      );
      i++;
      continue;
    }

    // Bulleted list item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const itemText = line.substring(2).trim();
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlineRuns(itemText),
          spacing: { after: 80 }
        })
      );
      i++;
      continue;
    }

    // Numbered list item
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      const itemText = numMatch[2].trim();
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${numMatch[1]}. `, bold: true }),
            ...parseInlineRuns(itemText)
          ],
          spacing: { after: 80 }
        })
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteText = line.substring(2).trim();
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `“ ${quoteText} ”`,
              italics: true,
              color: '4A5568'
            })
          ],
          indent: { left: 720 },
          spacing: { before: 160, after: 160 }
        })
      );
      i++;
      continue;
    }

    // Normal paragraph (may span until empty line)
    docChildren.push(
      new Paragraph({
        children: parseInlineRuns(line),
        spacing: { after: 180, line: 320 } // 1.3x line spacing
      })
    );
    i++;
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates Markdown (.md) Blob
 */
export function exportToMarkdown(title: string, markdownContent: string): Blob {
  let content = markdownContent.trim();
  // Ensure title is present as H1 if not already
  if (title && !content.startsWith('# ')) {
    content = `# ${title}\n\n${content}`;
  }
  return new Blob([content], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Generates Plain Text (.txt) Blob with clean layout
 */
export function exportToPlainText(title: string, markdownContent: string): Blob {
  // Strip markdown hashes and stars while preserving layout
  let text = markdownContent
    .replace(/^#{1,4}\s+(.+)$/gm, '$1\n----------------------------------------')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^>\s+(.+)$/gm, '   "$1"')
    .trim();

  if (title) {
    text = `${title.toUpperCase()}\n========================================\n\n${text}`;
  }

  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}

/**
 * Generates Standalone Styled HTML Document (.html) suitable for offline reading and direct print
 */
export function exportToHtml(title: string, markdownContent: string): Blob {
  // Simple markdown to HTML renderer for clean standalone document
  let bodyHtml = markdownContent
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Wrap list items in <ul>
  bodyHtml = bodyHtml.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>');

  // Wrap remaining non-tagged lines in <p>
  const paragraphs = bodyHtml
    .split(/\n\s*\n/)
    .map((block) => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h\d|ul|ol|blockquote|div)/i.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('\n\n');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Humanized Document'}</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7;
      color: #1a202c;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      background-color: #ffffff;
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-top: 2rem;
      margin-bottom: 1.25rem;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }
    h2 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #1e293b;
    }
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: #334155;
    }
    p {
      margin-bottom: 1.25rem;
      font-size: 1.05rem;
      color: #334155;
    }
    ul, ol {
      margin-bottom: 1.25rem;
      padding-left: 1.75rem;
    }
    li {
      margin-bottom: 0.5rem;
      color: #334155;
    }
    blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      margin: 1.5rem 0;
      color: #475569;
      background: #f8fafc;
      border-radius: 0 4px 4px 0;
      padding: 0.75rem 1rem;
      font-style: italic;
    }
    strong { font-weight: 600; color: #0f172a; }
    @media print {
      body { margin: 0; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${paragraphs}
</body>
</html>`;

  return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
}

/**
 * Triggers native print preview for saving as PDF or direct paper printing
 */
export function printFormattedDocument(title: string, markdownContent: string): void {
  const htmlBlob = exportToHtml(title, markdownContent);
  const blobUrl = URL.createObjectURL(htmlBlob);
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}
