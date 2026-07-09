export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WordMeaning = {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definitionZhTw: string;
  example: string;
};

export type TranslationRecord = {
  id: string;
  createdAt: string;
  sourceText: string;
  translatedText: string;
  cropRect: CropRect;
};
