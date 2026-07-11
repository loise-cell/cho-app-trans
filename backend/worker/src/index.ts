/**
 * Cho App Trans API Proxy (Cloudflare Worker)
 *
 * Deploy: cd backend/worker && npm install && npx wrangler secret put OCR_SPACE_API_KEY
 * Set EXPO_PUBLIC_API_BASE_URL to your worker URL (e.g. https://choapptrans-api.your-subdomain.workers.dev)
 */

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";
const TRANSLATE_ENDPOINT = "https://api.mymemory.translated.net/get";

const SOURCE_TO_OCR: Record<string, string> = {
  auto: "cht",
  cht: "cht",
  chs: "chs",
  en: "eng",
  ja: "jpn",
  ko: "kor",
  es: "spa",
  fr: "fre",
  de: "ger",
  pt: "por",
  vi: "vie",
  th: "tha",
  id: "ind"
};

const SOURCE_TO_MYMEMORY: Record<string, string> = {
  auto: "en",
  cht: "zh-TW",
  chs: "zh-CN",
  en: "en",
  ja: "ja",
  ko: "ko",
  es: "es",
  fr: "fr",
  de: "de",
  pt: "pt",
  vi: "vi",
  th: "th",
  id: "id"
};

const TARGET_TO_MYMEMORY: Record<string, string> = { ...SOURCE_TO_MYMEMORY };

type Env = {
  OCR_SPACE_API_KEY: string;
  API_SECRET?: string;
  RATE_LIMIT_PER_MINUTE?: string;
};

type RateBucket = { count: number; resetAt: number };
const rateMap = new Map<string, RateBucket>();

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}

function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
}

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const bucket = rateMap.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= limit) {
    return false;
  }
  bucket.count += 1;
  return true;
}

function authorize(request: Request, env: Env): boolean {
  if (!env.API_SECRET) {
    return true;
  }
  const header = request.headers.get("Authorization") || "";
  return header === `Bearer ${env.API_SECRET}`;
}

async function handleOcr(body: { base64Image?: string; sourceLanguage?: string }, env: Env): Promise<Response> {
  const base64Image = body.base64Image?.trim();
  if (!base64Image) {
    return json({ error: "base64Image is required" }, 400);
  }
  const sourceLanguage = body.sourceLanguage || "auto";
  const ocrLang = SOURCE_TO_OCR[sourceLanguage] ?? "cht";
  const formData = new FormData();
  formData.append("base64Image", `data:image/jpeg;base64,${base64Image}`);
  formData.append("language", ocrLang);
  formData.append("isOverlayRequired", "false");
  formData.append("OCREngine", "2");
  if (sourceLanguage === "auto" || sourceLanguage === "cht" || sourceLanguage === "chs") {
    formData.append("detectOrientation", "true");
  }

  const response = await fetch(OCR_ENDPOINT, {
    method: "POST",
    headers: { apikey: env.OCR_SPACE_API_KEY },
    body: formData
  });
  if (!response.ok) {
    return json({ error: "OCR service unavailable" }, 502);
  }
  const data = (await response.json()) as {
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string[] | string;
    ParsedResults?: Array<{ ParsedText?: string }>;
  };
  if (data.IsErroredOnProcessing) {
    const message = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(", ") : data.ErrorMessage || "OCR failed";
    return json({ error: message }, 422);
  }
  const text = data.ParsedResults?.[0]?.ParsedText?.trim() || "";
  if (!text) {
    return json({ error: "No text detected" }, 422);
  }
  return json({ text });
}

async function handleTranslate(
  body: { text?: string; source?: string; target?: string },
  _env: Env
): Promise<Response> {
  const text = body.text?.trim();
  if (!text) {
    return json({ error: "text is required" }, 400);
  }
  const source = body.source || "auto";
  const target = body.target || "zh-TW";
  const from = SOURCE_TO_MYMEMORY[source] ?? "en";
  const to = TARGET_TO_MYMEMORY[target] ?? "zh-TW";
  const url = `${TRANSLATE_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${from}|${to}`)}`;
  const response = await fetch(url);
  if (!response.ok) {
    return json({ error: "Translation service unavailable" }, 502);
  }
  const data = (await response.json()) as { responseData?: { translatedText?: string } };
  return json({ translatedText: data.responseData?.translatedText?.trim() || text });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true }, 200, cors);
    }

    if (!authorize(request, env)) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    const limit = Number(env.RATE_LIMIT_PER_MINUTE || "30");
    if (!checkRateLimit(clientIp(request), Number.isFinite(limit) ? limit : 30)) {
      return json({ error: "Rate limit exceeded" }, 429, cors);
    }

    if (request.method !== "POST") {
      return json({ error: "Not found" }, 404, cors);
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON" }, 400, cors);
    }

    if (url.pathname === "/v1/ocr") {
      const response = await handleOcr(body as { base64Image?: string; sourceLanguage?: string }, env);
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      return new Response(response.body, { status: response.status, headers });
    }

    if (url.pathname === "/v1/translate") {
      const response = await handleTranslate(body as { text?: string; source?: string; target?: string }, env);
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      return new Response(response.body, { status: response.status, headers });
    }

    return json({ error: "Not found" }, 404, cors);
  }
};
