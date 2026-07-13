import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { CropRect, WordMeaning } from "../types";
import {
  SOURCE_TO_MYMEMORY,
  SOURCE_TO_OCR,
  SourceLanguageCode,
  TARGET_TO_MYMEMORY,
  TargetLanguageCode
} from "../i18n/languages";
import { mapCropRectToImage } from "../utils/cropMapping";
import { unwrapSoftLineBreaks } from "../utils/textUnwrap";
import { apiUrl, apiRequestHeaders, useApiProxy } from "./apiConfig";

type OcrSpaceResponse = {
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string[] | string;
  ParsedResults?: Array<{
    ParsedText: string;
  }>;
};

type DictionaryApiEntry = {
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{
      definition?: string;
      example?: string;
    }>;
  }>;
};

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";
const TRANSLATE_ENDPOINT = "https://api.mymemory.translated.net/get";
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY ?? "helloworld";
const TRANSLATE_MAX_CHARS = 450;
const wordCache = new Map<string, WordMeaning>();

/** Clean OCR: keep chat lines; unwrap article column breaks into paragraphs. */
function normalizeOcrText(text: string): string {
  return unwrapSoftLineBreaks(text);
}

function splitTextForTranslate(text: string, chunkSize: number): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining);
      break;
    }
    const part = remaining.slice(0, chunkSize);
    const breakAt = Math.max(part.lastIndexOf("."), part.lastIndexOf(","), part.lastIndexOf(" "), part.lastIndexOf("\n"));
    const index = breakAt > 50 ? breakAt : chunkSize;
    const chunk = remaining.slice(0, index).trim();
    chunks.push(chunk);
    remaining = remaining.slice(index).trim();
  }
  return chunks;
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g);
  if (!parts) {
    return [text.trim()].filter(Boolean);
  }
  return parts.map((part) => part.trim()).filter(Boolean);
}

function looksLikeChatParagraph(text: string): boolean {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    return false;
  }
  let hits = 0;
  for (const line of lines) {
    if (/^.{1,48}\s*[:：]\s*.+/.test(line) || /^[A-Za-z0-9_.\-]{2,32}\s*[「"']/.test(line)) {
      hits += 1;
    }
  }
  return hits >= 2;
}

function isMostlyTargetScript(text: string, target: TargetLanguageCode): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  if (target === "zh-TW" || target === "zh-CN" || target === "ja") {
    const cjk = (trimmed.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
    const letters = (trimmed.match(/[A-Za-z]/g) || []).length;
    return cjk > 0 && cjk >= letters;
  }
  if (target === "ko") {
    const hangul = (trimmed.match(/[\uac00-\ud7af]/g) || []).length;
    const letters = (trimmed.match(/[A-Za-z]/g) || []).length;
    return hangul > 0 && hangul >= letters;
  }
  if (target === "th") {
    const thai = (trimmed.match(/[\u0e00-\u0e7f]/g) || []).length;
    return thai > trimmed.length * 0.4;
  }
  return false;
}

async function translateChunkDirect(
  text: string,
  source: SourceLanguageCode,
  target: TargetLanguageCode
): Promise<string> {
  const from = SOURCE_TO_MYMEMORY[source] ?? "en";
  const to = TARGET_TO_MYMEMORY[target] ?? "en";
  const params = new URLSearchParams({
    q: text,
    langpair: `${from}|${to}`
  });
  const response = await fetch(`${TRANSLATE_ENDPOINT}?${params}`);
  if (!response.ok) {
    throw new Error("Translation service unavailable.");
  }
  const data = (await response.json()) as {
    responseStatus?: number;
    responseDetails?: string;
    quotaFinished?: boolean;
    responseData?: { translatedText?: string };
  };
  if (data.quotaFinished) {
    throw new Error("Translation quota exceeded for today. Try again tomorrow.");
  }
  if (data.responseStatus && data.responseStatus !== 200) {
    throw new Error(data.responseDetails || "Translation failed.");
  }
  return data.responseData?.translatedText?.trim() || text;
}

async function translateChunk(
  text: string,
  source: SourceLanguageCode,
  target: TargetLanguageCode
): Promise<string> {
  if (isMostlyTargetScript(text, target)) {
    return text;
  }

  const from = SOURCE_TO_MYMEMORY[source] ?? "en";
  const to = TARGET_TO_MYMEMORY[target] ?? "en";
  if (from === to && source !== "auto") {
    return text;
  }

  // MyMemory blocks Cloudflare datacenter IPs; OCR stays on Worker, translate from device.
  return translateChunkDirect(text, source, target);
}

async function translateParagraph(
  paragraph: string,
  source: SourceLanguageCode,
  target: TargetLanguageCode
): Promise<string> {
  // Only keep line-by-line when it looks like chat; article soft-breaks are already unwrapped
  if (looksLikeChatParagraph(paragraph)) {
    const lines = paragraph
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const out: string[] = [];
    for (const line of lines) {
      if (line.length <= TRANSLATE_MAX_CHARS) {
        out.push(await translateChunk(line, source, target));
      } else {
        const chunks = splitTextForTranslate(line, TRANSLATE_MAX_CHARS);
        const chunkResults: string[] = [];
        for (const chunk of chunks) {
          chunkResults.push(await translateChunk(chunk, source, target));
        }
        out.push(chunkResults.join(" "));
      }
    }
    return out.join("\n");
  }

  const sentences = splitSentences(paragraph.replace(/\n+/g, " "));
  const translated: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= TRANSLATE_MAX_CHARS) {
      translated.push(await translateChunk(sentence, source, target));
      continue;
    }
    const chunks = splitTextForTranslate(sentence, TRANSLATE_MAX_CHARS);
    const chunkResults: string[] = [];
    for (const chunk of chunks) {
      chunkResults.push(await translateChunk(chunk, source, target));
    }
    translated.push(chunkResults.join(" "));
  }
  return translated.join(" ");
}

export async function translateText(
  text: string,
  source: SourceLanguageCode,
  target: TargetLanguageCode
): Promise<string> {
  if (!text.trim()) {
    return "";
  }

  if (looksLikeChatParagraph(text)) {
    return translateParagraph(text, source, target);
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const translatedParagraphs: string[] = [];
  for (const paragraph of paragraphs.length ? paragraphs : [text.trim()]) {
    translatedParagraphs.push(await translateParagraph(paragraph, source, target));
  }
  return translatedParagraphs.join("\n\n");
}

const POS_LABEL: Record<string, string> = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adverb: "adverb",
  preposition: "preposition",
  pronoun: "pronoun",
  conjunction: "conjunction",
  interjection: "interjection",
  article: "article",
  determiner: "determiner",
  exclamation: "exclamation",
  "proper noun": "proper noun"
};

function formatWordMeaning(partOfSpeech: string, wordZh: string, properNounLabel: string, noDefLabel: string): string {
  const cleaned = wordZh.trim();
  if (!cleaned) {
    return noDefLabel;
  }
  if (partOfSpeech === "proper noun") {
    return `（${properNounLabel}）${cleaned}`;
  }
  if (partOfSpeech && partOfSpeech !== "unknown") {
    return `（${POS_LABEL[partOfSpeech.toLowerCase()] || partOfSpeech}）${cleaned}`;
  }
  return cleaned;
}

function pickExampleFromContext(word: string, context: string): string | null {
  const pattern = new RegExp(`[^.!?\\n]*\\b${word}\\b[^.!?\\n]*[.!?]?`, "i");
  const match = context.match(pattern);
  const sentence = match?.[0]?.trim() || null;
  if (!sentence) {
    return null;
  }
  if (sentence.length <= 140) {
    return sentence;
  }
  return `${sentence.slice(0, 137)}...`;
}

const PROPER_NOUN_ZH: Record<string, string> = {
  trump: "川普（特朗普）",
  iran: "伊朗",
  china: "中國",
  taiwan: "台灣",
  japan: "日本",
  korea: "韓國",
  israel: "以色列",
  ukraine: "烏克蘭",
  russia: "俄羅斯",
  biden: "拜登",
  obama: "歐巴馬",
  democrats: "民主黨",
  republican: "共和黨",
  republicans: "共和黨",
  congress: "美國國會",
  pentagon: "五角大廈",
  tehran: "德黑蘭",
  london: "倫敦",
  paris: "巴黎",
  washington: "華盛頓",
  california: "加州",
  texas: "德州",
  bbc: "BBC",
  reuters: "路透社"
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toLookupForm(word: string, context: string): string {
  const raw = word.trim();
  if (/^[A-Z]/.test(raw)) {
    return raw;
  }
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const pattern = new RegExp(`\\b${escapeRegExp(capitalized)}\\b`);
  if (pattern.test(context)) {
    return capitalized;
  }
  return raw;
}

function isLikelyProperNoun(word: string, context: string): boolean {
  const raw = word.trim();
  const lower = raw.toLowerCase();
  if (PROPER_NOUN_ZH[lower]) {
    return true;
  }
  if (/^[A-Z][a-z]+$/.test(raw) || /^[A-Z]{2,}$/.test(raw)) {
    return true;
  }
  const lookupForm = toLookupForm(raw, context);
  return lookupForm !== raw.toLowerCase() && /^[A-Z]/.test(lookupForm);
}

function pickBestDefinition(entry: DictionaryApiEntry, word: string, context: string) {
  const lowerContext = context.toLowerCase();
  let bestDefinition = "";
  let bestExample = "";
  let bestPartOfSpeech = "unknown";
  let bestScore = -1;

  for (const meaning of entry.meanings ?? []) {
    for (const definition of meaning.definitions ?? []) {
      const defText = definition.definition?.trim() || "";
      const exampleText = definition.example?.trim() || "";
      let score = 0;
      if (exampleText) {
        score += 2;
      }
      if (defText && lowerContext.includes(defText.toLowerCase().slice(0, 12))) {
        score += 2;
      }
      if (exampleText && lowerContext.includes(exampleText.toLowerCase().slice(0, 20))) {
        score += 3;
      }
      if (lowerContext.includes(word.toLowerCase())) {
        score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestDefinition = defText;
        bestExample = exampleText;
        bestPartOfSpeech = meaning.partOfSpeech || "unknown";
      }
    }
  }

  return {
    definition: bestDefinition || "No definition available.",
    example: bestExample,
    partOfSpeech: bestPartOfSpeech
  };
}

function parseOcrResponse(data: OcrSpaceResponse): string {
  if (data.IsErroredOnProcessing) {
    const message = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(", ") : data.ErrorMessage || "OCR failed.";
    throw new Error(message);
  }
  const parsedText = normalizeOcrText(data.ParsedResults?.[0]?.ParsedText || "");
  if (!parsedText) {
    throw new Error("No text detected. Adjust the photo or crop range.");
  }
  return parsedText;
}

async function runOcrDirect(base64Image: string, sourceLanguage: SourceLanguageCode): Promise<string> {
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
    headers: {
      apikey: OCR_API_KEY
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("OCR service unavailable.");
  }

  return parseOcrResponse((await response.json()) as OcrSpaceResponse);
}

async function runOcrViaProxy(base64Image: string, sourceLanguage: SourceLanguageCode): Promise<string> {
  const response = await fetch(apiUrl("/v1/ocr"), {
    method: "POST",
    headers: apiRequestHeaders(),
    body: JSON.stringify({ base64Image, sourceLanguage })
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    const error = new Error(message || "OCR service unavailable.");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  const data = (await response.json()) as { text?: string; error?: string };
  if (data.error) {
    throw new Error(data.error);
  }
  const parsedText = normalizeOcrText(data.text || "");
  if (!parsedText) {
    throw new Error("No text detected. Adjust the photo or crop range.");
  }
  return parsedText;
}

function shouldFallbackOcrFromProxy(error: unknown): boolean {
  const status = (error as Error & { status?: number }).status;
  if (status === 401 || status === 429) {
    return false;
  }
  const message = error instanceof Error ? error.message : String(error);
  return (
    status === 502 ||
    status === 503 ||
    message.includes("OCR service unavailable") ||
    message.includes("service unavailable") ||
    message.includes("Failed to fetch") ||
    message.includes("Network request failed")
  );
}

async function runOcrWithBase64(base64Image: string, sourceLanguage: SourceLanguageCode): Promise<string> {
  if (useApiProxy()) {
    try {
      return await runOcrViaProxy(base64Image, sourceLanguage);
    } catch (error) {
      if (!shouldFallbackOcrFromProxy(error)) {
        throw error;
      }
      // OCR.space blocks Cloudflare egress IPs; retry from the device.
    }
  }
  return runOcrDirect(base64Image, sourceLanguage);
}

async function cropImageForOcr(params: {
  imageUri: string;
  cropRect: CropRect;
  previewSize: { width: number; height: number };
  imageSize: { width: number; height: number };
}): Promise<{ base64: string; uri: string }> {
  const { imageUri, cropRect, previewSize, imageSize } = params;
  const imageCrop = mapCropRectToImage({ cropRect, previewSize, imageSize });
  const cropped = await manipulateAsync(
    imageUri,
    [
      {
        crop: {
          originX: imageCrop.x,
          originY: imageCrop.y,
          width: imageCrop.width,
          height: imageCrop.height
        }
      }
    ],
    {
      base64: true,
      compress: 0.9,
      format: SaveFormat.JPEG
    }
  );

  if (!cropped.base64) {
    throw new Error("Image crop failed. Please pick the image again.");
  }

  return { base64: cropped.base64, uri: cropped.uri };
}

export async function runOcrOnCrop(params: {
  imageUri: string;
  cropRect: CropRect;
  previewSize: { width: number; height: number };
  imageSize: { width: number; height: number };
  sourceLanguage: SourceLanguageCode;
}): Promise<{ sourceText: string; croppedImageUri: string }> {
  const { sourceLanguage, ...cropParams } = params;
  const cropped = await cropImageForOcr(cropParams);
  const sourceText = await runOcrWithBase64(cropped.base64, sourceLanguage);
  return { sourceText, croppedImageUri: cropped.uri };
}

export async function runRealOcrAndTranslate(params: {
  imageUri: string;
  cropRect: CropRect;
  previewSize: { width: number; height: number };
  imageSize: { width: number; height: number };
  sourceLanguage: SourceLanguageCode;
  targetLanguage: TargetLanguageCode;
}): Promise<{ sourceText: string; translatedText: string; croppedImageUri: string }> {
  const { sourceLanguage, targetLanguage, ...cropParams } = params;
  const { sourceText, croppedImageUri } = await runOcrOnCrop({ ...cropParams, sourceLanguage });
  const translatedText = await translateText(sourceText, sourceLanguage, targetLanguage);
  return {
    sourceText,
    translatedText,
    croppedImageUri
  };
}

export const lookupWordMeaning = async (
  word: string,
  context = "",
  targetLanguage: TargetLanguageCode = "zh-TW",
  labels?: { properNoun: string; noDefinition: string }
): Promise<WordMeaning> => {
  const properNounLabel = labels?.properNoun ?? "proper noun";
  const noDefLabel = labels?.noDefinition ?? "No definition found";
  const lookupForm = toLookupForm(word, context);
  const normalized = lookupForm.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) {
    throw new Error("Please tap an English word.");
  }

  const cacheKey = `${normalized}:${targetLanguage}:${isLikelyProperNoun(word, context) ? "pn" : "wd"}`;
  const cached = wordCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (isLikelyProperNoun(word, context)) {
    const mappedZh = targetLanguage.startsWith("zh") ? PROPER_NOUN_ZH[normalized] : undefined;
    const wordZh = mappedZh || (await translateChunk(lookupForm, "eng", targetLanguage));
    const exampleEnglish = pickExampleFromContext(lookupForm, context) || "No example available.";
    const result: WordMeaning = {
      word: lookupForm,
      phonetic: "/N/A/",
      partOfSpeech: "proper noun",
      definitionZhTw: formatWordMeaning("proper noun", wordZh, properNounLabel, noDefLabel),
      example: exampleEnglish
    };
    wordCache.set(cacheKey, result);
    return result;
  }

  let phonetic = "/N/A/";
  let partOfSpeech = "unknown";
  let exampleEnglish = pickExampleFromContext(lookupForm, context) || "No example available.";

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`
    );
    if (response.ok) {
      const entries = (await response.json()) as DictionaryApiEntry[];
      const entry = entries[0];
      const picked = pickBestDefinition(entry, normalized, context);
      phonetic = entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text || "/N/A/";
      partOfSpeech = picked.partOfSpeech;
      if (picked.example) {
        exampleEnglish = picked.example.length <= 140 ? picked.example : `${picked.example.slice(0, 137)}...`;
      }
    }
  } catch {
    // Dictionary failure: still provide word translation
  }

  const wordZh = await translateChunk(normalized, "eng", targetLanguage);
  const definitionZhTw = formatWordMeaning(partOfSpeech, wordZh, properNounLabel, noDefLabel);

  const result: WordMeaning = {
    word: lookupForm,
    phonetic,
    partOfSpeech,
    definitionZhTw,
    example: exampleEnglish
  };

  wordCache.set(cacheKey, result);
  return result;
};
