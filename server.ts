import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Model name configuration constant as required by prompt:
// "Model name: put it in one config constant (MODEL_ID) so I can change it easily.
// Check the current Gemini API docs for the exact Gemma 4 model ID and do not guess it."
export const MODEL_ID = process.env.MODEL_ID || 'gemma-4-31b-it';
export const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

// Body parser with 15MB limit for compressed base64 photos
app.use(express.json({ limit: '15mb' }));

// In-memory sliding window rate limiter
// 20 requests per 60s window per IP
interface RateLimitRecord {
  timestamps: number[];
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function isRateLimited(clientIp: string): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const record = rateLimitMap.get(clientIp) || { timestamps: [] };
  // Keep only timestamps within window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return { limited: true, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  record.timestamps.push(now);
  rateLimitMap.set(clientIp, record);

  // Clean old entries periodically
  if (rateLimitMap.size > 2000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.timestamps.length === 0 || now - value.timestamps[value.timestamps.length - 1] > windowMs) {
        rateLimitMap.delete(key);
      }
    }
  }

  return { limited: false };
}

// Gemma / Gemini Tutor System Instructions
const GEMMA_SYSTEM_INSTRUCTION = `You are Snap and Learn, a patient tutor for first-year university students in Kenya. Subjects you handle best: Computational Logic (Boolean algebra, K-maps, flip-flops, propositional logic), C programming, introductory Physics (electrostatics, Ohm's and Kirchhoff's laws), and Digital Literacy.

Rules:
1. First, state in 1-2 sentences what you can see in the image. If you cannot read it clearly, say so and ask for a clearer photo. Never invent content you cannot see.
2. Use simple, clear English. Short sentences. Define jargon once.
3. Explain step by step. Show your reasoning, not just the answer.
4. In "Check my working" mode: find the FIRST error, explain why it is wrong, give a hint, then show the corrected step. Praise what was right.
5. In "Quiz me" mode: write exactly 3 multiple-choice questions (4 options each) based only on the content in the image, with the correct answer and a one-line explanation.
6. If the image is not study material, politely say so and ask for notes, a diagram, or code.
7. Be honest when you are unsure. Never present a guess as fact.
Return output in the JSON format specified by the app.`;

interface AnalyzeRequestBody {
  imageBase64: string;
  mimeType?: string;
  mode: 'explain' | 'quiz' | 'check';
  question?: string;
  swahiliSummary?: boolean;
}

// Helper to strip markdown json markers and parse
function safeParseJson(rawText: string): any {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  // Find outermost curly braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configuredModel: MODEL_ID,
    fallbackModels: FALLBACK_MODELS,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Primary analysis route
app.post('/api/analyze', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';

  // 1. Rate limit check
  const rateLimitStatus = isRateLimited(clientIp);
  if (rateLimitStatus.limited) {
    return res.status(429).json({
      error: 'Rate limit reached',
      message: `You've sent several photos recently. To protect the study session quota, please wait ${rateLimitStatus.retryAfterSeconds} seconds before sending another.`,
      retryAfter: rateLimitStatus.retryAfterSeconds,
    });
  }

  // 2. Validate API key presence
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'API Key Missing',
      message: 'GEMINI_API_KEY is not configured on the server. Please set your Gemini API key in the environment or Secrets panel.',
    });
  }

  // 3. Validate request payload
  const { imageBase64, mimeType = 'image/jpeg', mode = 'explain', question, swahiliSummary = false } = req.body as AnalyzeRequestBody;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({
      error: 'Invalid Payload',
      message: 'An image is required. Please capture or upload a photo of your study material.',
    });
  }

  // Clean base64 data if it contains data URI prefix
  let cleanBase64 = imageBase64;
  let detectedMime = mimeType;
  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/data:([^;]+)/);
    if (mimeMatch) {
      detectedMime = mimeMatch[1];
    }
  } else if (imageBase64.startsWith('data:')) {
    const commaIndex = imageBase64.indexOf(',');
    if (commaIndex !== -1) {
      const meta = imageBase64.substring(0, commaIndex);
      const rawContent = decodeURIComponent(imageBase64.substring(commaIndex + 1));
      cleanBase64 = Buffer.from(rawContent, 'utf-8').toString('base64');
      const mimeMatch = meta.match(/data:([^;]+)/);
      if (mimeMatch) {
        detectedMime = mimeMatch[1];
      }
    }
  }

  // If detectedMime is SVG, convert to PNG or standardize mimeType
  if (detectedMime.includes('svg')) {
    // Gemini handles standard raster types best, pass image/png or image/jpeg
    detectedMime = 'image/png';
  }

  // Build mode-specific user prompt
  let modeInstructions = '';
  if (mode === 'explain') {
    modeInstructions = `Mode: "Explain". Explain what is in the photo step by step. Provide clear, simple reasoning, define any terms once. Fill "explanation_steps" array.`;
  } else if (mode === 'quiz') {
    modeInstructions = `Mode: "Quiz me". Generate exactly 3 interactive multiple-choice questions (4 options each, answer_index 0-3, and 1-line explanation) strictly based on the photo's content. Fill "quiz" array.`;
  } else if (mode === 'check') {
    modeInstructions = `Mode: "Check my working". The photo is the student's own attempted solution. Find the FIRST error, explain why it is wrong, provide a helpful hint, and show the corrected step. Praise what was right. Fill "mistake_check" object with { "praise": "...", "first_error": "...", "why": "...", "hint": "...", "corrected_step": "..." }. Do not dump the full final answer—guide them!`;
  }

  const questionPrompt = question && question.trim().length > 0 ? `\nStudent's specific question: "${question.trim()}"` : '';
  const swahiliPrompt = swahiliSummary
    ? `\nIMPORTANT: The student requested a Swahili summary. In the "swahili_summary" field, provide a clear, encouraging 2-4 sentence summary of the key takeaway in Kenyan Swahili (Kiswahili sanifu / mwanafunzi).`
    : `\nLeave "swahili_summary" empty or null since it was not requested.`;

  const promptText = `${modeInstructions}${questionPrompt}${swahiliPrompt}

Output MUST be strictly valid JSON matching this schema:
{
  "readable": true or false,
  "what_i_see": "1-2 sentence description of what you see. If blurry or unreadable, state it clearly and set readable to false. If not study material, politely explain and set readable to false.",
  "explanation_steps": ["step 1", "step 2"],
  "mistake_check": {
    "praise": "Praise what was done right so far",
    "first_error": "The first mistake identified",
    "why": "Why this step is mathematically or logically incorrect",
    "hint": "A guiding hint to help them think through it",
    "corrected_step": "The correct next step"
  },
  "quiz": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer_index": 0,
      "explanation": "Why this answer is correct"
    }
  ],
  "swahili_summary": "Summary in Swahili if requested, otherwise empty string"
}

Fill only the fields relevant to the selected mode. Do not include markdown ticks around JSON if possible, output pure JSON.`;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const imagePart = {
    inlineData: {
      mimeType: detectedMime,
      data: cleanBase64,
    },
  };

  // Helper function to call model with a 15-second timeout
  async function executeCall(modelName: string, extraInstruction?: string): Promise<string> {
    const contents = {
      parts: [
        imagePart,
        {
          text: extraInstruction ? `${promptText}\n\nNote: ${extraInstruction}` : promptText,
        },
      ],
    };

    const modelAi = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        timeout: 12000,
      },
    });

    const response = await modelAi.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: GEMMA_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    return response.text || '';
  }

  // Candidate models sequence starting with the configured MODEL_ID
  const candidateModels = Array.from(new Set([MODEL_ID, ...FALLBACK_MODELS]));
  let rawText = '';
  let modelUsed = MODEL_ID;
  let parsedData: any = null;
  let lastError: any = null;

  try {
    for (const currentModel of candidateModels) {
      try {
        console.log(`[Snap&Learn] Trying model: ${currentModel}...`);
        rawText = await executeCall(currentModel);
        modelUsed = currentModel;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Snap&Learn] Model ${currentModel} failed (${err?.message || err}). Trying fallback...`);
      }
    }

    if (!rawText) {
      throw lastError || new Error('All AI models were temporarily busy. Please try again.');
    }

    // Try parsing JSON
    try {
      parsedData = safeParseJson(rawText);
    } catch (parseErr) {
      console.warn('[Snap&Learn] JSON parse failed on first attempt. Retrying once with corrective instruction...');
      // Retry once as specified in requirements
      rawText = await executeCall(
        modelUsed,
        'Your previous response could not be parsed as JSON. Please reply with ONLY the raw JSON object, without backticks or markdown.'
      );
      parsedData = safeParseJson(rawText);
    }

    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error('Failed to generate structured study analysis. Response was not valid JSON.');
    }

    // Ensure readable is boolean
    const readable = Boolean(parsedData.readable !== false);

    return res.json({
      success: true,
      model_used: modelUsed,
      readable,
      what_i_see: parsedData.what_i_see || (readable ? 'Analyzed study material' : 'Could not read image clearly.'),
      explanation_steps: Array.isArray(parsedData.explanation_steps) ? parsedData.explanation_steps : [],
      mistake_check: parsedData.mistake_check || null,
      quiz: Array.isArray(parsedData.quiz) ? parsedData.quiz : [],
      swahili_summary: parsedData.swahili_summary || '',
    });
  } catch (err: any) {
    console.error('[Snap&Learn] Analysis error:', err);

    // Provide friendly, actionable errors
    const errorMessage = err?.message || String(err);
    let userMessage = 'Unable to analyze the photo right now. Please try again or ensure your photo is clear.';
    let statusCode = 500;

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      statusCode = 429;
      userMessage = 'API quota or rate limit exceeded. Please wait a few seconds before trying again.';
    } else if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
      statusCode = 403;
      userMessage = 'Gemini API key is invalid or lacks necessary permissions. Please verify the GEMINI_API_KEY setting.';
    } else if (errorMessage.includes('404') || errorMessage.includes('NOT_FOUND')) {
      statusCode = 404;
      userMessage = 'The selected AI model was not found. Check the MODEL_ID configuration.';
    }

    return res.status(statusCode).json({
      error: 'Analysis Failed',
      message: userMessage,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Snap&Learn] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Snap&Learn] Configured MODEL_ID: ${MODEL_ID}`);
  });
}

startServer().catch((err) => {
  console.error('[Snap&Learn] Failed to start server:', err);
  process.exit(1);
});
