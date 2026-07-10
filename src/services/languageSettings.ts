import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SourceLanguageCode,
  TargetLanguageCode,
  UiLanguageCode,
  defaultSourceForUi
} from "../i18n/languages";

const STORAGE_KEY = "choapptrans.languageSettings.v1";

export type LanguageSettings = {
  uiLanguage: UiLanguageCode;
  sourceLanguage: SourceLanguageCode;
  targetLanguage: TargetLanguageCode;
  onboardingDone: boolean;
};

export const defaultLanguageSettings: LanguageSettings = {
  uiLanguage: "zh-TW",
  sourceLanguage: "auto",
  targetLanguage: "zh-TW",
  onboardingDone: false
};

export async function loadLanguageSettings(): Promise<LanguageSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultLanguageSettings };
    }
    const parsed = JSON.parse(raw) as Partial<LanguageSettings>;
    return {
      uiLanguage: parsed.uiLanguage ?? defaultLanguageSettings.uiLanguage,
      sourceLanguage: parsed.sourceLanguage ?? defaultLanguageSettings.sourceLanguage,
      targetLanguage: parsed.targetLanguage ?? defaultLanguageSettings.targetLanguage,
      onboardingDone: Boolean(parsed.onboardingDone)
    };
  } catch {
    return { ...defaultLanguageSettings };
  }
}

export async function saveLanguageSettings(settings: LanguageSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function settingsAfterUiPick(uiLanguage: UiLanguageCode): LanguageSettings {
  return {
    uiLanguage,
    sourceLanguage: defaultSourceForUi(uiLanguage),
    targetLanguage: uiLanguage,
    onboardingDone: true
  };
}
