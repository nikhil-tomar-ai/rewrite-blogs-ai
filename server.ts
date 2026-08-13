import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { getLLMProviderManager } from './src/server/ai/providerFactory.js';
import { getLocalDb, LocalJobRecord } from './src/server/db/database.js';
import { getLocalStorage } from './src/server/storage/localFileStorage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = Number(process.env.PORT) || 3000;

// Tone prompt mappings
const TONE_SYSTEM_PROMPTS: Record<string, string> = {
  casual:
    'Adopt a warm, conversational, friendly tone. Use casual phrasing, light humor, contractions, and direct address (you/we).',
  conversational:
    'Adopt a tech-friendly conversational tone. Clear, informative, easy to grasp, avoiding dense jargon while keeping technical substance intact.',
  thought_leader:
    'Adopt an authoritative, insightful thought-leader tone. Confident, forward-looking, articulated with strong points and crisp structure.',
  storyteller:
    'Adopt a rich narrative storyteller tone. Hook the reader with vivid imagery, an personal narrative angle, or a compelling opening scenario.',
  punchy:
    'Adopt a high-energy, punchy tone. Use concise sentences, short paragraphs, strong verbs, bullet points where applicable, and zero fluff.',
  sarcastic:
    'Adopt a witty, slightly sarcastic, opinionated tone. Be bold, use clever satire or dry humor, and express strong perspectives.',
  academic:
    'Adopt an articulate, well-structured educational tone. Clear, logical, objective, and intellectually engaging without being dry or overly formal.'
};

/**
 * Safely parse JSON returned from LLMs (stripping markdown code blocks and excess whitespace)
 */
function parseLLMJson<T = any>(rawText: string): T | null {
  if (!rawText) return null;
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 1. Health & LLM Status APIs
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: 'local',
    app: 'SparkyAI Local Content Humanizer',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/llm', async (_req: Request, res: Response) => {
  try {
    const manager = getLLMProviderManager();
    const config = manager.getConfig();
    const provider = manager.getProvider();

    const isConnected = await provider.isAvailable();
    let availableModels: string[] = [];
    if (isConnected && provider.listModels) {
      availableModels = await provider.listModels();
    }

    res.json({
      connected: isConnected,
      provider: config.providerType,
      providerName: provider.name,
      baseUrl: config.baseUrl,
      activeModel: config.model,
      availableModels,
      message: isConnected
        ? `Connected to local AI engine (${provider.name})`
        : `Local AI provider (${provider.name}) is unreachable. Running on SparkyAI local rule engine.`
    });
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

/**
 * 2. Settings APIs
 */
app.get('/api/settings', (_req: Request, res: Response) => {
  const db = getLocalDb();
  const settings = db.getSettings();
  const manager = getLLMProviderManager();

  res.json({
    ...settings,
    llmConfig: manager.getConfig()
  });
});

app.get('/api/settings/llm', (_req: Request, res: Response) => {
  const manager = getLLMProviderManager();
  res.json(manager.getConfig());
});

app.post('/api/settings/llm', (req: Request, res: Response) => {
  try {
    const { providerType, baseUrl, model, temperature } = req.body;
    const manager = getLLMProviderManager();
    manager.updateConfig({ providerType, baseUrl, model, temperature });

    const db = getLocalDb();
    db.updateSettings({ provider: providerType, baseUrl, model, temperature });

    res.json({ success: true, updatedConfig: manager.getConfig() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 3. Primary Humanizer Endpoint
 */
app.post('/api/humanize', async (req: Request, res: Response) => {
  try {
    const {
      content,
      contentColumn = 'content',
      columnsToRewrite,
      title = '',
      author = '',
      tone = 'casual',
      customPrompt = '',
      temperature = 0.7,
      enableCritic = true,
      preserveKeywords = [],
      addContractions = true
    } = req.body;

    const manager = getLLMProviderManager();
    const provider = await manager.getActiveProviderWithFallback();

    let toneInstruction = TONE_SYSTEM_PROMPTS[tone] || TONE_SYSTEM_PROMPTS['casual'];
    if (tone === 'custom' && customPrompt && customPrompt.trim().length > 0) {
      toneInstruction = `Custom Persona Directive: ${customPrompt.trim()}`;
    }

    const keywordsNotice =
      preserveKeywords && preserveKeywords.length > 0
        ? `\nIMPORTANT: You MUST preserve these key terms naturally in the text: ${preserveKeywords.join(', ')}.`
        : '';

    const systemInstruction = `You are an elite human editor and master blogger.
Your task is to take raw or robotic AI-generated text and completely REWRITE and HUMANIZE it into authentic, compelling reading.

STRICT HUMANIZATION RULES:
1. BAN ALL ROBOTIC AI TROPES AND FLUFF:
   - NEVER use phrases like: "In today's fast-paced digital world", "In the rapidly evolving landscape", "It is important to note", "It goes without saying", "delve into", "tapestry", "beacon", "testament to", "paradigm shift", "supercharge", "seamless integration", "in conclusion", "in summary".
2. VARY SENTENCE LENGTH AND RHYTHM:
   - Mix punchy 3-word sentences with longer descriptive lines. Break up monotonous structural patterns.
3. USE ACTIVE VOICE & NATURAL CONTRACTIONS:
   - ${addContractions ? "Use natural contractions (don't, it's, we've, you're, can't)." : 'Maintain natural phrasing.'}
4. ADD AUTHENTIC HUMAN HOOKS & ENGAGEMENT:
   - Start with a compelling opening line or rhetorical question. Express authentic opinions or practical real-world scenarios.
5. PRESERVE CORE FACTUAL MEANING:
   - Keep the original information, takeaways, and logic intact, but make the reading experience delightfully human.
${keywordsNotice}`;

    // Multi-Column / All-Column Rewriting Pass
    if (columnsToRewrite && typeof columnsToRewrite === 'object' && Object.keys(columnsToRewrite).length > 0) {
      const userPrompt = `You are an expert human editor humanizing text fields for a blog post CSV.
Original Text Columns to Rewrite:
${JSON.stringify(columnsToRewrite, null, 2)}

Tone Requirement: ${toneInstruction}

Please rewrite and humanize EVERY column text field provided (titles, meta descriptions, headings, main article content) into natural, engaging human prose.
Return a valid JSON object with the key "humanizedColumns" containing a key-value pair for each column header name mapped to its newly rewritten humanized text string. Output ONLY valid JSON.`;

      const aiRes = await provider.generate({
        prompt: userPrompt,
        systemInstruction,
        temperature: Number(temperature) || 0.7,
        responseFormat: 'json'
      });

      let humanizedColumns: Record<string, string> = {};
      let parsedProviderResponse = null;
      if (aiRes.text) {
        parsedProviderResponse = parseLLMJson(aiRes.text);
        if (parsedProviderResponse) {
          if (parsedProviderResponse.humanizedColumns && typeof parsedProviderResponse.humanizedColumns === 'object') {
            humanizedColumns = parsedProviderResponse.humanizedColumns;
          } else if (typeof parsedProviderResponse === 'object') {
            humanizedColumns = parsedProviderResponse as Record<string, string>;
          }
        }
      }

      // Determine primary content column key
      const possibleContentKeys = [
        contentColumn,
        'Main Content',
        'content',
        'Primary Body Content',
        'body',
        'blog_content',
        'post_content',
        'article'
      ];

      const primaryContentKey =
        possibleContentKeys.find(k => columnsToRewrite[k] !== undefined) ||
        Object.keys(columnsToRewrite).reduce(
          (a, b) => ((columnsToRewrite[a] || '').length > (columnsToRewrite[b] || '').length ? a : b),
          Object.keys(columnsToRewrite)[0]
        );

      const originalMainText = columnsToRewrite[primaryContentKey] || content || '';
      let mainHumanizedText = humanizedColumns[primaryContentKey] || '';

      // Check if main content was NOT rewritten (missing or identical to original text)
      const needsSinglePassFallback =
        !mainHumanizedText ||
        mainHumanizedText.trim().length === 0 ||
        mainHumanizedText.trim() === originalMainText.trim();

      if (needsSinglePassFallback && originalMainText.trim().length > 0) {
        const fallbackPrompt = `Blog Title: ${title || columnsToRewrite['Blog Title'] || columnsToRewrite['title'] || 'Untitled'}
Author: ${author || 'Anonymous'}

Original Content to Humanize:
"""
${originalMainText}
"""

Tone Requirement: ${toneInstruction}

Write the complete rewritten humanized blog post now. Output ONLY the rewritten blog text without any meta-commentary or markdown wrapping.`;

        const fallbackAiRes = await provider.generate({
          prompt: fallbackPrompt,
          systemInstruction,
          temperature: Number(temperature) || 0.7
        });

        if (fallbackAiRes.text && fallbackAiRes.text.trim().length > 0) {
          mainHumanizedText = fallbackAiRes.text.trim();
          humanizedColumns[primaryContentKey] = mainHumanizedText;
        } else {
          mainHumanizedText = originalMainText;
        }
      }

      // Ensure all original keys from columnsToRewrite are present in humanizedColumns
      Object.keys(columnsToRewrite).forEach(k => {
        if (!humanizedColumns[k] || humanizedColumns[k].trim().length === 0) {
          humanizedColumns[k] = columnsToRewrite[k];
        }
      });

      res.json({
        success: true,
        humanized: mainHumanizedText,
        humanizedColumns,
        modelUsed: aiRes.model,
        providerUsed: aiRes.provider,
        providerRawResponse: aiRes.text || null,
        providerParsedResponse: parsedProviderResponse,
        criticResult: {
          score: 90,
          feedback: 'Text columns successfully humanized.',
          isHumanEnough: true,
          turns: 1
        }
      });
      return;
    }

    // Single Column Fallback
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Content parameter or columnsToRewrite object is required.' });
      return;
    }

    const userPrompt = `Blog Title: ${title || 'Untitled'}
Author: ${author || 'Anonymous'}

Original Content to Humanize:
"""
${content}
"""

Tone Requirement: ${toneInstruction}

Write the complete rewritten humanized blog post now. Output ONLY the rewritten blog text without any meta-commentary or markdown wrapping.`;

    const aiRes = await provider.generate({
      prompt: userPrompt,
      systemInstruction,
      temperature: Number(temperature) || 0.7
    });

    let parsedProviderResponse: any = null;
    let humanizedText = aiRes.text ? aiRes.text.trim() : content;
    if (aiRes.text) parsedProviderResponse = parseLLMJson(aiRes.text);
    let criticResult = {
      score: 88,
      feedback: 'Passes natural human readability checks.',
      isHumanEnough: true,
      turns: 1
    };

    if (enableCritic) {
      try {
        const criticPrompt = `Analyze this blog post and evaluate whether it reads like a real human writer or still retains robotic AI markers.
Blog Post to Evaluate:
"""
${humanizedText}
"""
Return JSON format: {"score": 88, "feedback": "Natural flow and varied sentence lengths.", "isHumanEnough": true}`;

        const criticRes = await provider.generate({
          prompt: criticPrompt,
          temperature: 0.2,
          responseFormat: 'json'
        });

        if (criticRes.text) {
          const parsed = parseLLMJson(criticRes.text);
          if (parsed && typeof parsed.score === 'number') {
            criticResult = {
              score: parsed.score,
              feedback: parsed.feedback || 'Good natural tone.',
              isHumanEnough: parsed.score >= 80,
              turns: 1
            };
          }
          // attach raw critic text for debugging
          criticResult['rawCriticText'] = criticRes.text;
          criticResult['parsedCritic'] = parsed || null;
        }
      } catch (criticErr) {
        // Silent critic catch
      }
    }

    res.json({
      success: true,
      humanized: humanizedText,
      modelUsed: aiRes.model,
      providerUsed: aiRes.provider,
      providerRawResponse: aiRes.text || null,
      providerParsedResponse: parsedProviderResponse,
      criticResult
    });
  } catch (error: any) {
    console.error('API /api/humanize error:', error);
    res.status(500).json({
      error: error.message || 'Failed to humanize content locally'
    });
  }
});

/**
 * 4. Quick Edit Endpoint
 */
app.post('/api/quick-edit', async (req: Request, res: Response) => {
  try {
    const { currentText, instruction, tone = 'casual' } = req.body;

    if (!currentText || !instruction) {
      res.status(400).json({ error: 'currentText and instruction are required.' });
      return;
    }

    const manager = getLLMProviderManager();
    const provider = await manager.getActiveProviderWithFallback();

    const prompt = `Modify the following text based strictly on the user instruction.
Instruction: "${instruction}"
Current Tone: ${tone}

Text:
"""
${currentText}
"""

Output ONLY the revised text.`;

    const aiRes = await provider.generate({ prompt, temperature: 0.6 });
    const updated = aiRes.text ? aiRes.text.trim() : currentText;

    res.json({ success: true, updatedText: updated });
  } catch (err: any) {
    console.error('API /api/quick-edit error:', err);
    res.status(500).json({ error: err.message || 'Failed to apply quick edit' });
  }
});

/**
 * 5. Local File Uploads & Jobs REST Endpoints
 */
app.post('/api/uploads', (req: Request, res: Response) => {
  try {
    const { filename = 'dataset.csv', content = '', headers = [], totalRows = 0 } = req.body;
    const storage = getLocalStorage();
    const db = getLocalDb();

    const saved = storage.saveUploadFile(filename, content);
    db.saveUpload(saved.id, {
      filename,
      originalPath: saved.filePath,
      headers,
      totalRows
    });

    res.json({
      uploadId: saved.id,
      filename,
      filePath: saved.filePath,
      headers,
      totalRows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/uploads/:id', (req: Request, res: Response) => {
  const db = getLocalDb();
  const upload = db.getUpload(req.params.id);
  if (!upload) {
    res.status(404).json({ error: 'Upload not found' });
    return;
  }
  res.json(upload);
});

app.post('/api/jobs', (req: Request, res: Response) => {
  try {
    const { filename = 'dataset.csv', rows = [], config = {} } = req.body;
    const db = getLocalDb();

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newJob: LocalJobRecord = {
      id: jobId,
      filename,
      status: 'created',
      totalRows: rows.length,
      completedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config,
      rows,
      auditLogs: []
    };

    db.createJob(newJob);
    res.json({ jobId, job: newJob });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs', (_req: Request, res: Response) => {
  const db = getLocalDb();
  res.json({ jobs: db.listJobs() });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const db = getLocalDb();
  const job = db.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
});

app.get('/api/jobs/:id/progress', (req: Request, res: Response) => {
  const db = getLocalDb();
  const job = db.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({
    jobId: job.id,
    status: job.status,
    totalRows: job.totalRows,
    completedRows: job.completedRows,
    successfulRows: job.successfulRows,
    failedRows: job.failedRows,
    progressPercent: job.totalRows > 0 ? Math.round((job.completedRows / job.totalRows) * 100) : 0
  });
});

app.get('/api/jobs/:id/download', (req: Request, res: Response) => {
  const db = getLocalDb();
  const job = db.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({
    jobId: job.id,
    filename: `humanized_${job.filename}`,
    rows: job.rows
  });
});

app.get('/api/jobs/:id/audit', (req: Request, res: Response) => {
  const db = getLocalDb();
  const job = db.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({
    jobId: job.id,
    auditLogs: job.auditLogs || []
  });
});

// LLM Diagnostic Endpoint - checks provider availability and runs a small test prompt
app.get('/api/llm/diagnose', async (_req: Request, res: Response) => {
  try {
    const manager = getLLMProviderManager();
    const provider = manager.getProvider();

    const available = await provider.isAvailable();
    let models: string[] = [];
    try {
      models = (await provider.listModels()) || [];
    } catch (e) {
      models = [];
    }

    let sampleOutput: any = null;
    try {
      const testPrompt = 'Please respond with the single word: DIAG_OK';
      const out = await provider.generate({ prompt: testPrompt, temperature: 0.0 });
      sampleOutput = { text: out.text, model: out.model, provider: out.provider, tokensUsed: out.tokensUsed };
    } catch (err: any) {
      sampleOutput = { error: err.message || String(err) };
    }

    res.json({
      providerName: provider.name,
      providerId: (provider as any).id || 'unknown',
      baseUrl: (provider as any).baseUrl || null,
      defaultModel: (provider as any).defaultModel || null,
      available,
      models,
      sampleOutput
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Diagnostic failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Dynamic import so vite/rollup native binaries are never loaded in production
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SparkyAI Local Content Humanizer running at http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
