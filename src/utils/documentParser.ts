import mammoth from 'mammoth';

export interface DocumentSection {
  id: string;
  heading: string;
  level: number; // 1 for H1, 2 for H2, 3 for H3, 0 for introductory/body
  content: string;
  wordCount: number;
}

export interface ParsedDocument {
  filename: string;
  fileSize: number;
  format: 'docx' | 'markdown' | 'txt' | 'html' | 'unknown';
  title: string;
  rawText: string;
  markdownContent: string;
  sections: DocumentSection[];
  totalWords: number;
  totalParagraphs: number;
  estimatedReadingTimeMinutes: number;
  fleschScore: number;
  aiFluffPercentage: number;
  detectedHeadingsCount: number;
}

/**
 * Common robotic / AI phrases to detect fluff density in documents
 */
const ROBOTIC_PATTERNS = [
  /\bin today's (?:fast-paced|rapidly evolving|digital|modern) (?:world|age|landscape|era)\b/gi,
  /\bit is (?:important|crucial|essential|worth noting) to (?:note|remember|consider)\b/gi,
  /\bdelve (?:deeply )?into\b/gi,
  /\btapestry of\b/gi,
  /\btestament to\b/gi,
  /\bbeacon of\b/gi,
  /\bseamless(?:ly)? integrat(?:ion|ed|ing|es)?\b/gi,
  /\bparadigm shift\b/gi,
  /\bsupercharge\b/gi,
  /\bharness the power of\b/gi,
  /\bin summary,? it is clear that\b/gi,
  /\bin conclusion,?\b/gi,
  /\bfurthermore,?\b/gi,
  /\bmoreover,?\b/gi,
  /\bgame-changer\b/gi,
  /\bnavigating the complexities\b/gi,
  /\bstands as a\b/gi,
  /\bmultifaceted\b/gi,
  /\bplethora of\b/gi,
  /\bnot only .*? but also\b/gi
];

/**
 * Calculate Flesch Reading Ease score
 */
export function calculateDocumentFleschScore(text: string): number {
  if (!text || text.trim().length === 0) return 100;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 100;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = words.length;

  let syllableCount = 0;
  words.forEach((w) => {
    syllableCount += countSyllables(w);
  });

  const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  return Math.min(100, Math.max(0, Math.round(score)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Calculate fluff/robotic percentage
 */
export function calculateDocumentFluffPercentage(text: string): number {
  if (!text) return 0;
  let hitCount = 0;
  for (const pattern of ROBOTIC_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      hitCount += matches.length;
    }
  }
  const totalWords = text.trim().split(/\s+/).filter(Boolean).length;
  if (totalWords === 0) return 0;
  const fluffDensity = (hitCount * 12) / totalWords;
  return Math.min(100, Math.round(fluffDensity * 100));
}

/**
 * Convert HTML string (e.g. from Mammoth) into clean, semantic Markdown
 */
export function htmlToCleanMarkdown(html: string): string {
  if (!html) return '';

  let md = html;

  // Replace headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n');

  // Replace blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, content) => {
    const cleaned = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n');
    return `\n\n> ${cleaned.trim()}\n\n`;
  });

  // Replace unordered list items
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '\n$1\n');
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '\n$1\n');

  // Replace paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');

  // Bold and Italics
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");

  // Clean excessive blank lines
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  return md;
}

/**
 * Split markdown text into structured DocumentSection array
 */
export function parseSectionsFromMarkdown(markdown: string, defaultTitle: string = 'Untitled Document'): {
  title: string;
  sections: DocumentSection[];
} {
  const lines = markdown.split('\n');
  const sections: DocumentSection[] = [];
  let detectedTitle = defaultTitle;

  let currentHeading = 'Introduction';
  let currentLevel = 0;
  let currentLines: string[] = [];
  let sectionIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);

    if (headingMatch) {
      const hashes = headingMatch[1];
      const headingText = headingMatch[2].trim();
      const level = hashes.length;

      // If we find an H1 and have not yet set detectedTitle, use it
      if (level === 1 && detectedTitle === defaultTitle) {
        detectedTitle = headingText;
      }

      // Flush previous section if it has content
      if (currentLines.length > 0 || currentHeading !== 'Introduction') {
        const content = currentLines.join('\n').trim();
        if (content.length > 0) {
          sections.push({
            id: `sec_${sectionIndex++}`,
            heading: currentHeading,
            level: currentLevel,
            content,
            wordCount: content.split(/\s+/).filter(Boolean).length
          });
        }
      }

      currentHeading = headingText;
      currentLevel = level;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush final section
  const finalContent = currentLines.join('\n').trim();
  if (finalContent.length > 0 || sections.length === 0) {
    sections.push({
      id: `sec_${sectionIndex++}`,
      heading: currentHeading,
      level: currentLevel,
      content: finalContent || currentHeading,
      wordCount: (finalContent || currentHeading).split(/\s+/).filter(Boolean).length
    });
  }

  return { title: detectedTitle, sections };
}

/**
 * Parse an uploaded document file (.docx, .md, .txt, .html)
 */
export async function parseDocumentFile(file: File): Promise<ParsedDocument> {
  const filename = file.name;
  const fileSize = file.size;
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  let format: ParsedDocument['format'] = 'unknown';
  let rawText = '';
  let markdownContent = '';

  if (ext === 'docx') {
    format = 'docx';
    const arrayBuffer = await file.arrayBuffer();
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      markdownContent = htmlToCleanMarkdown(result.value);
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      rawText = textResult.value;
    } catch (err: any) {
      console.warn('Mammoth docx parse warning:', err);
      // Fallback: read as raw text
      rawText = await file.text();
      markdownContent = rawText;
    }
  } else if (ext === 'md' || ext === 'markdown') {
    format = 'markdown';
    rawText = await file.text();
    markdownContent = rawText;
  } else if (ext === 'html' || ext === 'htm') {
    format = 'html';
    const html = await file.text();
    rawText = html.replace(/<[^>]+>/g, ' ');
    markdownContent = htmlToCleanMarkdown(html);
  } else {
    // txt or other
    format = 'txt';
    rawText = await file.text();
    markdownContent = rawText;
  }

  const baseTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const { title, sections } = parseSectionsFromMarkdown(markdownContent, baseTitle);

  const words = markdownContent.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const paragraphs = markdownContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const totalParagraphs = Math.max(1, paragraphs.length);
  const estimatedReadingTimeMinutes = Math.max(1, Math.round(totalWords / 200));
  const fleschScore = calculateDocumentFleschScore(markdownContent);
  const aiFluffPercentage = calculateDocumentFluffPercentage(markdownContent);
  const detectedHeadingsCount = sections.filter((s) => s.level > 0).length;

  return {
    filename,
    fileSize,
    format,
    title,
    rawText,
    markdownContent,
    sections,
    totalWords,
    totalParagraphs,
    estimatedReadingTimeMinutes,
    fleschScore,
    aiFluffPercentage,
    detectedHeadingsCount
  };
}
