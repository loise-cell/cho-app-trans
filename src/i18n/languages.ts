export type UiLanguageCode =
  | "zh-TW"
  | "zh-CN"
  | "en"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "vi"
  | "th"
  | "id";

/** OCR / translate source language codes used in the app */
export type SourceLanguageCode = "auto" | "eng" | "cht" | "chs" | "jpn" | "kor" | "spa" | "fre" | "ger" | "por" | "vie" | "tha" | "ind";

export type TargetLanguageCode = UiLanguageCode;

export type LanguageOption<T extends string> = {
  code: T;
  nativeLabel: string;
  englishLabel: string;
};

export const UI_LANGUAGES: LanguageOption<UiLanguageCode>[] = [
  { code: "zh-TW", nativeLabel: "繁體中文", englishLabel: "Traditional Chinese" },
  { code: "zh-CN", nativeLabel: "简体中文", englishLabel: "Simplified Chinese" },
  { code: "en", nativeLabel: "English", englishLabel: "English" },
  { code: "ja", nativeLabel: "日本語", englishLabel: "Japanese" },
  { code: "ko", nativeLabel: "한국어", englishLabel: "Korean" },
  { code: "es", nativeLabel: "Español", englishLabel: "Spanish" },
  { code: "fr", nativeLabel: "Français", englishLabel: "French" },
  { code: "de", nativeLabel: "Deutsch", englishLabel: "German" },
  { code: "pt", nativeLabel: "Português", englishLabel: "Portuguese" },
  { code: "vi", nativeLabel: "Tiếng Việt", englishLabel: "Vietnamese" },
  { code: "th", nativeLabel: "ไทย", englishLabel: "Thai" },
  { code: "id", nativeLabel: "Bahasa Indonesia", englishLabel: "Indonesian" }
];

export const SOURCE_LANGUAGES: LanguageOption<SourceLanguageCode>[] = [
  { code: "auto", nativeLabel: "Auto / Mixed", englishLabel: "Auto / Mixed" },
  { code: "eng", nativeLabel: "English", englishLabel: "English" },
  { code: "cht", nativeLabel: "繁體中文", englishLabel: "Traditional Chinese" },
  { code: "chs", nativeLabel: "简体中文", englishLabel: "Simplified Chinese" },
  { code: "jpn", nativeLabel: "日本語", englishLabel: "Japanese" },
  { code: "kor", nativeLabel: "한국어", englishLabel: "Korean" },
  { code: "spa", nativeLabel: "Español", englishLabel: "Spanish" },
  { code: "fre", nativeLabel: "Français", englishLabel: "French" },
  { code: "ger", nativeLabel: "Deutsch", englishLabel: "German" },
  { code: "por", nativeLabel: "Português", englishLabel: "Portuguese" },
  { code: "vie", nativeLabel: "Tiếng Việt", englishLabel: "Vietnamese" },
  { code: "tha", nativeLabel: "ไทย", englishLabel: "Thai" },
  { code: "ind", nativeLabel: "Bahasa Indonesia", englishLabel: "Indonesian" }
];

/** Map UI / target language → MyMemory lang code */
export const TARGET_TO_MYMEMORY: Record<TargetLanguageCode, string> = {
  "zh-TW": "zh-TW",
  "zh-CN": "zh-CN",
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

/** Map source language → MyMemory lang code (auto uses en as hint) */
export const SOURCE_TO_MYMEMORY: Record<SourceLanguageCode, string> = {
  auto: "en",
  eng: "en",
  cht: "zh-TW",
  chs: "zh-CN",
  jpn: "ja",
  kor: "ko",
  spa: "es",
  fre: "fr",
  ger: "de",
  por: "pt",
  vie: "vi",
  tha: "th",
  ind: "id"
};

/** Map source language → OCR.space language param */
export const SOURCE_TO_OCR: Record<SourceLanguageCode, string> = {
  auto: "cht",
  eng: "eng",
  cht: "cht",
  chs: "chs",
  jpn: "jpn",
  kor: "kor",
  spa: "spa",
  fre: "fre",
  ger: "ger",
  por: "por",
  vie: "vie",
  tha: "tha",
  // OCR.space may not have ind; fall back to eng
  ind: "eng"
};

export function labelForUiLanguage(code: UiLanguageCode): string {
  return UI_LANGUAGES.find((item) => item.code === code)?.nativeLabel ?? code;
}

export function defaultSourceForUi(ui: UiLanguageCode): SourceLanguageCode {
  if (ui === "zh-TW") return "auto";
  if (ui === "zh-CN") return "auto";
  if (ui === "ja") return "jpn";
  if (ui === "ko") return "kor";
  if (ui === "es") return "spa";
  if (ui === "fr") return "fre";
  if (ui === "de") return "ger";
  if (ui === "pt") return "por";
  if (ui === "vi") return "vie";
  if (ui === "th") return "tha";
  if (ui === "id") return "ind";
  return "eng";
}
