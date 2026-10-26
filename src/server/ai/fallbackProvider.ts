import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';

export class FallbackLocalProvider implements LLMProvider {
  id = 'local_fallback';
  name = 'SparkyAI Offline Rule Engine (Zero AI Service Needed)';
  baseUrl = 'http://localhost:3000';
  defaultModel = 'sparky-rules-v1';

  async isAvailable(): Promise<boolean> {
    return true; // Always available on the local machine
  }

  async listModels(): Promise<string[]> {
    return ['sparky-rules-v1'];
  }

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    // If JSON format was requested (e.g., multi-column or critic pass)
    if (options.responseFormat === 'json') {
      try {
        // Look for JSON input in prompt
        const jsonMatch = options.prompt.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const rawObj = JSON.parse(jsonMatch[0]);
          const humanizedCols: Record<string, string> = {};
          for (const [key, val] of Object.entries(rawObj)) {
            if (typeof val === 'string') {
              humanizedCols[key] = this.humanizeTextLocally(val);
            }
          }
          return {
            text: JSON.stringify({ humanizedColumns: humanizedCols }),
            model: this.defaultModel,
            provider: this.id
          };
        }
      } catch {
        // Fallback JSON for critic
      }

      if (options.prompt.toLowerCase().includes('critic') || options.prompt.toLowerCase().includes('score')) {
        return {
          text: JSON.stringify({
            score: 88,
            feedback: 'Local rule engine cleaned up robotic markers, tropes, and fluff.',
            isHumanEnough: true
          }),
          model: this.defaultModel,
          provider: this.id
        };
      }
    }

    // Standard text humanization pass
    const humanized = this.humanizeTextLocally(options.prompt);
    return {
      text: humanized,
      model: this.defaultModel,
      provider: this.id
    };
  }

  private humanizeTextLocally(text: string): string {
    let clean = text;

    // Extract content if wrapped in prompt template quotes
    const tripleQuoteMatches = text.match(/"""\n?([\s\S]*?)\n?"""/);
    if (tripleQuoteMatches && tripleQuoteMatches[1]) {
      clean = tripleQuoteMatches[1].trim();
    }

    // Remove AI Fluff phrases
    const fluffList = [
      /In today's fast-paced digital world,?\s*/gi,
      /In the rapidly evolving landscape of,?\s*/gi,
      /It is important to note that,?\s*/gi,
      /It goes without saying that,?\s*/gi,
      /A testament to,?\s*/gi,
      /Delve into,?\s*/gi,
      /Tapestry of,?\s*/gi,
      /In conclusion,?\s*/gi,
      /In summary,?\s*/gi
    ];

    fluffList.forEach(regex => {
      clean = clean.replace(regex, '');
    });

    // Replace robotic words with active/conversational equivalents
    clean = clean
      .replace(/\bfurthermore\b/gi, 'Plus')
      .replace(/\bmoreover\b/gi, 'Also')
      .replace(/\bconsequently\b/gi, 'So')
      .replace(/\butilize\b/gi, 'use')
      .replace(/\bseamlessly\b/gi, 'easily')
      .replace(/\bleverage\b/gi, 'use');

    // Add conversational contractions
    clean = clean
      .replace(/\bis not\b/gi, "isn't")
      .replace(/\bcannot\b/gi, "can't")
      .replace(/\bdo not\b/gi, "don't")
      .replace(/\bwill not\b/gi, "won't")
      .replace(/\bit is\b/gi, "it's")
      .replace(/\byou are\b/gi, "you're")
      .replace(/\bwe have\b/gi, "we've");

    return clean.trim();
  }
}
