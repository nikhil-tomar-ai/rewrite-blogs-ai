import {
  ContentType,
  ExpansionLevel,
  HumanizationLevel,
  WritingStyle
} from '../types/models.js';

/**
 * Placeholder Protection Token Pair
 */
export interface MaskedContent {
  maskedText: string;
  placeholderMap: Record<string, string>;
}

export interface PromptInput {
  content: string;
  contentType?: ContentType;
  humanizationLevel?: HumanizationLevel;
  expansionLevel?: ExpansionLevel;
  writingStyle?: WritingStyle;
  customInstructions?: string;
  preserveKeywords?: string[];
  placeholderProtection?: boolean;
}

export class PromptService {
  private static instance: PromptService;

  public static getInstance(): PromptService {
    if (!PromptService.instance) {
      PromptService.instance = new PromptService();
    }
    return PromptService.instance;
  }

  /**
   * Section 41: Protect Placeholders, Variables, URLs, and HTML Tags
   * Replaces tokens like {{var}}, [LINK_URL], https://..., <tag> with unique safety tokens.
   */
  public protectPlaceholders(text: string): MaskedContent {
    const placeholderMap: Record<string, string> = {};
    let counter = 0;

    // 1. Protect Mustache variables e.g. {{variable_name}}
    let masked = text.replace(/\{\{([^{}]+)\}\}/g, (match) => {
      counter++;
      const token = `__VAR_TOKEN_${counter}__`;
      placeholderMap[token] = match;
      return token;
    });

    // 2. Protect Bracket CTA tokens e.g. [CTA_URL], [BRAND_NAME]
    masked = masked.replace(/\[([A-Z0-9_]{3,30})\]/g, (match) => {
      counter++;
      const token = `__CTA_TOKEN_${counter}__`;
      placeholderMap[token] = match;
      return token;
    });

    // 3. Protect Complete URLs
    masked = masked.replace(/https?:\/\/[^\s"'<>]+/g, (match) => {
      counter++;
      const token = `__URL_TOKEN_${counter}__`;
      placeholderMap[token] = match;
      return token;
    });

    return { maskedText: masked, placeholderMap };
  }

  /**
   * Restores protected tokens back to their original values.
   */
  public restorePlaceholders(text: string, placeholderMap: Record<string, string>): string {
    let unmasked = text;
    for (const [token, originalValue] of Object.entries(placeholderMap)) {
      unmasked = unmasked.split(token).join(originalValue);
    }
    return unmasked;
  }

  /**
   * Section 14: Humanization Level Directives
   */
  private getHumanizationInstruction(level: HumanizationLevel = 'medium'): string {
    switch (level) {
      case 'light':
        return 'Apply LIGHT humanization: Make minimal adjustments to smooth out awkward phrasing and robotic word choices. Preserve sentence structures closely.';
      case 'strong':
        return 'Apply STRONG humanization: Extensively restructure sentences, vary cadences, and inject punchy authentic human tone, while preserving the exact core meaning and facts.';
      case 'medium':
      default:
        return 'Apply MEDIUM humanization: Restructure stiff sentences into natural conversational rhythms, balance short and long sentences, and eliminate corporate buzzwords.';
    }
  }

  /**
   * Section 15: Expansion Level Directives
   */
  private getExpansionInstruction(level: ExpansionLevel = 'none'): string {
    switch (level) {
      case 'low':
        return 'Expansion Level: LOW. Slightly unpack terse concepts by providing brief intuitive clarifications derived solely from the provided text.';
      case 'medium':
        return 'Expansion Level: MEDIUM. Provide thoughtful contextual explanations and smooth transitional bridges, maintaining the original meaning without adding unverified facts.';
      case 'high':
        return 'Expansion Level: HIGH. Thoroughly elaborate on key insights and provide deeper descriptive exposition derived strictly from the topic context.';
      case 'none':
      default:
        return 'Expansion Level: NONE. Keep the content length approximately equal to the original. Do not add supplementary paragraphs.';
    }
  }

  /**
   * Section 16 & 17: Content Type Specific Directives
   */
  private getContentTypeInstruction(contentType: ContentType = 'generic_text'): string {
    switch (contentType) {
      case 'blog_title':
        return 'Content Type: BLOG TITLE. Generate a compelling, click-worthy, natural title. Keep it punchy, eliminate generic clickbait tropes, and output ONLY the single title line.';
      case 'meta_title':
        return 'Content Type: META TITLE. Keep between 45 and 60 characters. Crisp, relevant, and engaging without fluff.';
      case 'meta_description':
        return 'Content Type: META DESCRIPTION. Keep between 130 and 155 characters. Provide an enticing overview with a natural call to action.';
      case 'h1':
      case 'h2':
      case 'h3':
        return 'Content Type: SECTION HEADING. Preserve the heading hierarchy and intent. Make it punchy and engaging. Never output multi-paragraph text.';
      case 'faq':
        return 'Content Type: FAQ CONTENT. Strictly preserve the Question & Answer structure. Humanize the answers while keeping questions direct.';
      case 'introduction':
        return 'Content Type: BLOG INTRODUCTION. Hook the reader immediately with an authentic perspective or vivid observation. Avoid cliché opening filler.';
      case 'conclusion':
        return 'Content Type: BLOG CONCLUSION. Synthesize the core takeaways into an inspiring, actionable closing thought without using "In conclusion".';
      case 'main_content':
      default:
        return 'Content Type: MAIN BLOG BODY. Ensure seamless transitions between paragraphs, lively cadence, and engaging sub-arguments.';
    }
  }

  /**
   * Section 13: Assembles the complete AI System Prompt and User Prompt
   */
  public buildPrompts(input: PromptInput): {
    systemInstruction: string;
    userPrompt: string;
    placeholderMap: Record<string, string>;
  } {
    const {
      content,
      contentType = 'generic_text',
      humanizationLevel = 'medium',
      expansionLevel = 'none',
      writingStyle = 'casual',
      customInstructions = '',
      preserveKeywords = [],
      placeholderProtection = true
    } = input;

    // Apply placeholder protection if requested
    let workingText = content;
    let placeholderMap: Record<string, string> = {};

    if (placeholderProtection) {
      const masked = this.protectPlaceholders(content);
      workingText = masked.maskedText;
      placeholderMap = masked.placeholderMap;
    }

    // Section 42: Content Safety & Factual Preservation Core Directive
    const systemInstruction = `You are a world-class human editor and master blogger.
Your mission is to transform raw or robotic text into authentic, engaging, beautifully written human prose.

ABSOLUTE FACTUAL PRESERVATION MANDATE:
1. You are transforming existing content. Preserve all meaning and factual claims.
2. DO NOT invent facts, statistics, sources, names, dates, citations, or research not present in the original text.
3. If information in the source is unclear or incomplete, preserve the uncertainty rather than guessing.
4. Strictly protect any special tokens like __VAR_TOKEN_1__, __URL_TOKEN_1__, or __CTA_TOKEN_1__ exactly as written.

ANTI-ROBOTIC AI RULES:
- BAN ALL ROBOTIC CLICHÉS: "In today's fast-paced digital world", "delve into", "tapestry", "beacon", "testament to", "paradigm shift", "supercharge", "seamless integration", "in conclusion", "in summary".
- Vary sentence length and rhythm. Break up repetitive syntactic structures.
- Use natural phrasing and active voice.

EDITORIAL DIRECTIVES:
- ${this.getHumanizationInstruction(humanizationLevel)}
- ${this.getExpansionInstruction(expansionLevel)}
- ${this.getContentTypeInstruction(contentType)}
- Writing Style Target: ${writingStyle.toUpperCase()}
${preserveKeywords.length > 0 ? `- Mandatory Keywords to preserve naturally: ${preserveKeywords.join(', ')}` : ''}
${customInstructions ? `- User Custom Directive: ${customInstructions}` : ''}`;

    const userPrompt = `Original Content to Transform:
"""
${workingText}
"""

Rewrite and humanize this content now following all directives above.
Respond in valid JSON format:
{
  "transformedContent": "...",
  "changesSummary": "Brief 1-sentence note of editorial changes made"
}`;

    return { systemInstruction, userPrompt, placeholderMap };
  }
}

export const getPromptService = () => PromptService.getInstance();
