import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { CropRect, WordMeaning } from "../types";

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

function normalizeOcrText(text: string): string {
  return text
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
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
    const breakAt = Math.max(part.lastIndexOf("."), part.lastIndexOf(","), part.lastIndexOf(" "));
    const index = breakAt > 50 ? breakAt : chunkSize;
    const chunk = remaining.slice(0, index).trim();
    chunks.push(chunk);
    remaining = remaining.slice(index).trim();
  }
  return chunks;
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  if (!parts) {
    return [text.trim()];
  }
  return parts.map((part) => part.trim()).filter(Boolean);
}

async function translateChunkToZhTw(text: string): Promise<string> {
  const url = `${TRANSLATE_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|zh-TW`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("翻譯服務暫時無法使用，請稍後再試。");
  }
  const data = (await response.json()) as {
    responseData?: { translatedText?: string };
  };
  return data.responseData?.translatedText?.trim() || text;
}

async function translateToZhTw(text: string): Promise<string> {
  if (!text.trim()) {
    return "";
  }

  const sentences = splitSentences(text);
  const translated: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= TRANSLATE_MAX_CHARS) {
      translated.push(await translateChunkToZhTw(sentence));
      continue;
    }
    const chunks = splitTextForTranslate(sentence, TRANSLATE_MAX_CHARS);
    const chunkResults: string[] = [];
    for (const chunk of chunks) {
      chunkResults.push(await translateChunkToZhTw(chunk));
    }
    translated.push(chunkResults.join(" "));
  }

  return translated.join(" ");
}

const POS_ZH: Record<string, string> = {
  noun: "名詞",
  verb: "動詞",
  adjective: "形容詞",
  adverb: "副詞",
  preposition: "介系詞",
  pronoun: "代名詞",
  conjunction: "連接詞",
  interjection: "感嘆詞",
  article: "冠詞",
  determiner: "限定詞",
  exclamation: "感嘆詞",
  "proper noun": "專有名詞"
};

function toPosZh(partOfSpeech: string): string {
  return POS_ZH[partOfSpeech.toLowerCase()] || partOfSpeech;
}

function formatWordZh(partOfSpeech: string, wordZh: string): string {
  const cleaned = wordZh.trim();
  if (!cleaned) {
    return "查無譯義";
  }
  if (partOfSpeech && partOfSpeech !== "unknown") {
    return `（${toPosZh(partOfSpeech)}）${cleaned}`;
  }
  return cleaned;
}

function pickExampleFromContext(word: string, context: string): string | null {
  const pattern = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]?`, "i");
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

async function runOcrWithBase64(base64Image: string): Promise<string> {
  const formData = new FormData();
  formData.append("base64Image", `data:image/jpeg;base64,${base64Image}`);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("OCREngine", "2");

  const response = await fetch(OCR_ENDPOINT, {
    method: "POST",
    headers: {
      apikey: OCR_API_KEY
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("OCR 服務暫時無法使用，請稍後重試。");
  }

  const data = (await response.json()) as OcrSpaceResponse;
  if (data.IsErroredOnProcessing) {
    const message = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join("，") : data.ErrorMessage || "OCR 辨識失敗。";
    throw new Error(message);
  }

  const parsedText = normalizeOcrText(data.ParsedResults?.[0]?.ParsedText || "");
  if (!parsedText) {
    throw new Error("未辨識到文字，請調整拍攝角度或翻譯範圍。");
  }
  return parsedText;
}

export async function runRealOcrAndTranslate(params: {
  imageUri: string;
  cropRect: CropRect;
  previewSize: { width: number; height: number };
  imageSize: { width: number; height: number };
}): Promise<{ sourceText: string; translatedText: string; croppedImageUri: string }> {
  const { imageUri, cropRect, previewSize, imageSize } = params;
  const scaleX = imageSize.width / previewSize.width;
  const scaleY = imageSize.height / previewSize.height;
  const cropped = await manipulateAsync(
    imageUri,
    [
      {
        crop: {
          originX: Math.max(Math.round(cropRect.x * scaleX), 0),
          originY: Math.max(Math.round(cropRect.y * scaleY), 0),
          width: Math.max(Math.round(cropRect.width * scaleX), 50),
          height: Math.max(Math.round(cropRect.height * scaleY), 50)
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
    throw new Error("圖片裁切失敗，請重新選圖。");
  }

  const sourceText = await runOcrWithBase64(cropped.base64);
  const translatedText = await translateToZhTw(sourceText);
  return {
    sourceText,
    translatedText,
    croppedImageUri: cropped.uri
  };
}

export const lookupWordMeaning = async (word: string, context = ""): Promise<WordMeaning> => {
  const lookupForm = toLookupForm(word, context);
  const normalized = lookupForm.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) {
    throw new Error("請點選英文單字。");
  }

  const cacheKey = `${normalized}:${isLikelyProperNoun(word, context) ? "pn" : "wd"}`;
  const cached = wordCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (isLikelyProperNoun(word, context)) {
    const mappedZh = PROPER_NOUN_ZH[normalized];
    const wordZh = mappedZh || (await translateChunkToZhTw(lookupForm));
    const exampleEnglish = pickExampleFromContext(lookupForm, context) || "No example available.";
    const result: WordMeaning = {
      word: lookupForm,
      phonetic: "/N/A/",
      partOfSpeech: "proper noun",
      definitionZhTw: `（專有名詞）${wordZh}`,
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
    // 字典失敗時仍提供單字翻譯
  }

  const wordZh = await translateChunkToZhTw(normalized);
  const definitionZhTw = formatWordZh(partOfSpeech, wordZh);

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
