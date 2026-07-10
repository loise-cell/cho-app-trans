import "react-native-gesture-handler";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { AdGateCard } from "./src/components/AdGateCard";
import { ImageRangeSelector } from "./src/components/ImageRangeSelector";
import { LanguageOnboarding } from "./src/components/LanguageOnboarding";
import { LanguageSettingsCard } from "./src/components/LanguageSettingsCard";
import { TranslationCompareCard } from "./src/components/TranslationCompareCard";
import { WordCloud } from "./src/components/WordCloud";
import { WordSheet } from "./src/components/WordSheet";
import { SOURCE_LANGUAGES, SourceLanguageCode, TargetLanguageCode, UiLanguageCode, labelForUiLanguage } from "./src/i18n/languages";
import { t } from "./src/i18n/strings";
import { lookupWordMeaning, runRealOcrAndTranslate } from "./src/services/mockTranslator";
import {
  LanguageSettings,
  defaultLanguageSettings,
  loadLanguageSettings,
  saveLanguageSettings,
  settingsAfterUiPick
} from "./src/services/languageSettings";
import { canTranslate, constants, initialPointsState, rewardForAd, spendForTranslation } from "./src/services/pointsLedger";
import { CropRect, TranslationRecord, WordMeaning } from "./src/types";
import { extractChatEntities, isExcludedWord } from "./src/utils/chatEntities";

const initialCropRect: CropRect = { x: 20, y: 20, width: 220, height: 120 };
const initialPreviewSize = { width: 320, height: 240 };

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [settingsReady, setSettingsReady] = useState(false);
  const [langSettings, setLangSettings] = useState<LanguageSettings>(defaultLanguageSettings);
  const [activeTab, setActiveTab] = useState<"editor" | "result">("editor");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState<CropRect>(initialCropRect);
  const [previewSize, setPreviewSize] = useState(initialPreviewSize);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pointsState, setPointsState] = useState(initialPointsState);
  const [wordSheetVisible, setWordSheetVisible] = useState(false);
  const [wordMeaning, setWordMeaning] = useState<WordMeaning | null>(null);
  const [history, setHistory] = useState<TranslationRecord[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showAllWords, setShowAllWords] = useState(false);
  const [cropLocked, setCropLocked] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);

  const ui = langSettings.uiLanguage;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadLanguageSettings();
      if (mounted) {
        setLangSettings(loaded);
        setSettingsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistSettings = async (next: LanguageSettings) => {
    setLangSettings(next);
    await saveLanguageSettings(next);
  };

  const chatEntities = useMemo(() => extractChatEntities(sourceText), [sourceText]);

  const allWords = useMemo(
    () =>
      sourceText
        .split(/[\s\n]+/)
        .map((word) => word.replace(/^[^a-zA-Z]+|[^a-zA-Z'.-]+$/g, ""))
        .filter((word) => /[a-zA-Z]/.test(word))
        .filter((word) => !isExcludedWord(word, chatEntities)),
    [sourceText, chatEntities]
  );

  const orderedFocusWords = useMemo(() => {
    const stopwords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "to",
      "of",
      "in",
      "on",
      "at",
      "for",
      "from",
      "with",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "this",
      "that",
      "these",
      "those",
      "it",
      "as",
      "by",
      "has",
      "have",
      "had",
      "not"
    ]);

    const seen = new Set<string>();
    const result: string[] = [];
    for (const word of allWords) {
      const normalized = word.toLowerCase();
      if (stopwords.has(normalized)) {
        continue;
      }
      if (normalized.length <= 2) {
        continue;
      }
      if (/^[A-Z]{3,}$/.test(word)) {
        continue;
      }
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      result.push(word);
    }
    return result;
  }, [allWords]);

  const words = showAllWords ? allWords : orderedFocusWords;

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      exif: false
    });
    if (!result.canceled) {
      const selected = result.assets[0];
      setImageUri(selected.uri);
      setImageSize({ width: selected.width, height: selected.height });
      setSourceText("");
      setTranslatedText("");
      setCroppedImageUri(null);
      setCropLocked(false);
      setActiveTab("editor");
    }
  };

  const captureFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t(ui, "alertNoCameraTitle"), t(ui, "alertNoCameraBody"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      exif: false
    });
    if (!result.canceled) {
      const selected = result.assets[0];
      setImageUri(selected.uri);
      setImageSize({ width: selected.width, height: selected.height });
      setSourceText("");
      setTranslatedText("");
      setCroppedImageUri(null);
      setCropLocked(false);
      setActiveTab("editor");
    }
  };

  const translate = async () => {
    if (!imageUri) {
      Alert.alert(t(ui, "alertNoImageTitle"), t(ui, "alertNoImageBody"));
      return;
    }
    if (!cropLocked) {
      Alert.alert(t(ui, "alertNoRangeTitle"), t(ui, "alertNoRangeBody"));
      return;
    }
    if (!canTranslate(pointsState)) {
      Alert.alert(t(ui, "alertNoPointsTitle"), t(ui, "alertNoPointsBody"));
      return;
    }

    setLoading(true);
    try {
      setPointsState((prev) => spendForTranslation(prev));
      const data = await runRealOcrAndTranslate({
        imageUri,
        cropRect,
        previewSize,
        imageSize,
        sourceLanguage: langSettings.sourceLanguage,
        targetLanguage: langSettings.targetLanguage
      });
      setSourceText(data.sourceText);
      setTranslatedText(data.translatedText);
      setCroppedImageUri(data.croppedImageUri);
      setActiveTab("result");
      setHistory((prev) => [
        {
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          sourceText: data.sourceText,
          translatedText: data.translatedText,
          cropRect
        },
        ...prev
      ]);
    } catch (error) {
      Alert.alert(t(ui, "alertTranslateFail"), error instanceof Error ? error.message : t(ui, "alertUnknown"));
    } finally {
      setLoading(false);
    }
  };

  const openWordMeaning = async (word: string) => {
    setWordSheetVisible(true);
    setWordMeaning(null);
    setWordLoading(true);
    try {
      const meaning = await lookupWordMeaning(word, sourceText, langSettings.targetLanguage, {
        properNoun: t(ui, "properNoun"),
        noDefinition: t(ui, "noDefinition")
      });
      setWordMeaning(meaning);
    } catch (error) {
      setWordSheetVisible(false);
      Alert.alert(t(ui, "alertLookupFail"), error instanceof Error ? error.message : t(ui, "alertUnknown"));
    } finally {
      setWordLoading(false);
    }
  };

  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 12) + 48;

  if (!settingsReady) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={[styles.safeArea, styles.loadingScreen]}>
          <ActivityIndicator size="large" color="#2563EB" />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  if (!langSettings.onboardingDone) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
          <LanguageOnboarding
            onComplete={async (uiLanguage) => {
              await persistSettings(settingsAfterUiPick(uiLanguage));
            }}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  const sourceLabel =
    langSettings.sourceLanguage === "auto"
      ? t(ui, "sourceAuto")
      : SOURCE_LANGUAGES.find((item) => item.code === langSettings.sourceLanguage)?.nativeLabel ??
        langSettings.sourceLanguage;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: bottomPad }]}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <Text style={styles.title}>{t(ui, "appTitle")}</Text>
          <Text style={styles.subtitle}>{t(ui, "appSubtitle")}</Text>

          <View style={styles.tabWrap}>
            <Pressable onPress={() => setActiveTab("editor")} style={[styles.tab, activeTab === "editor" && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === "editor" && styles.tabTextActive]}>{t(ui, "tabEditor")}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab("result")} style={[styles.tab, activeTab === "result" && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === "result" && styles.tabTextActive]}>{t(ui, "tabResult")}</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable style={styles.secondaryButton} onPress={captureFromCamera}>
              <Text style={styles.secondaryText}>{t(ui, "takePhoto")}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={pickFromLibrary}>
              <Text style={styles.secondaryText}>{t(ui, "pickImage")}</Text>
            </Pressable>
          </View>

          {activeTab === "editor" ? (
            <LanguageSettingsCard
              uiLanguage={ui}
              sourceLanguage={langSettings.sourceLanguage}
              targetLanguage={langSettings.targetLanguage}
              onChangeUi={(code: UiLanguageCode) => {
                void persistSettings({
                  ...langSettings,
                  uiLanguage: code,
                  targetLanguage: langSettings.targetLanguage === langSettings.uiLanguage ? code : langSettings.targetLanguage
                });
              }}
              onChangeSource={(code: SourceLanguageCode) => {
                void persistSettings({ ...langSettings, sourceLanguage: code });
              }}
              onChangeTarget={(code: TargetLanguageCode) => {
                void persistSettings({ ...langSettings, targetLanguage: code });
              }}
            />
          ) : null}

          {activeTab === "editor" && !imageUri ? (
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>{t(ui, "welcomeTitle")}</Text>
              <Text style={styles.welcomeStep}>{t(ui, "welcomeStep1")}</Text>
              <Text style={styles.welcomeStep}>{t(ui, "welcomeStep2")}</Text>
              <Text style={styles.welcomeStep}>{t(ui, "welcomeStep3")}</Text>
              <Text style={styles.welcomeHint}>{t(ui, "welcomeHint")}</Text>
            </View>
          ) : null}

          {activeTab === "editor" && !imageUri ? (
            <AdGateCard
              pointsState={pointsState}
              uiLanguage={ui}
              onWatchAd={() => setPointsState((prev) => rewardForAd(prev))}
            />
          ) : null}

          {activeTab === "editor" && imageUri ? (
            <>
              <Text style={styles.langPair}>
                {t(ui, "langPairHint", {
                  source: sourceLabel,
                  target: labelForUiLanguage(langSettings.targetLanguage)
                })}
              </Text>

              <ImageRangeSelector
                imageUri={imageUri}
                imageSize={imageSize}
                locked={cropLocked}
                labels={{
                  rangeLocked: t(ui, "rangeLocked"),
                  rangeAdjust: t(ui, "rangeAdjust"),
                  dragHint: t(ui, "dragHint"),
                  translationArea: t(ui, "translationArea"),
                  readjustRange: t(ui, "readjustRange"),
                  confirmRange: t(ui, "confirmRange")
                }}
                onInteractionChange={(isInteracting) => {
                  setScrollEnabled(!isInteracting);
                }}
                onLock={(nextCropRect, nextPreviewSize) => {
                  setCropRect(nextCropRect);
                  setPreviewSize(nextPreviewSize);
                  setCropLocked(true);
                }}
                onUnlock={() => setCropLocked(false)}
              />

              {cropLocked ? (
                <Pressable style={styles.translateButton} onPress={translate} disabled={loading}>
                  <Text style={styles.translateText}>
                    {loading
                      ? t(ui, "translating")
                      : t(ui, "startTranslate", { cost: constants.TRANSLATION_COST })}
                  </Text>
                </Pressable>
              ) : null}

              <AdGateCard
                pointsState={pointsState}
                uiLanguage={ui}
                onWatchAd={() => setPointsState((prev) => rewardForAd(prev))}
              />
            </>
          ) : null}

          {activeTab === "result" && !translatedText ? (
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>{t(ui, "noResultTitle")}</Text>
              <Text style={styles.welcomeStep}>{t(ui, "noResultBody")}</Text>
            </View>
          ) : null}

          {activeTab === "result" ? (
            <AdGateCard
              pointsState={pointsState}
              uiLanguage={ui}
              onWatchAd={() => setPointsState((prev) => rewardForAd(prev))}
            />
          ) : null}

          {activeTab === "result" && translatedText ? (
            <View style={styles.resultBlock}>
              {croppedImageUri ? (
                <TranslationCompareCard
                  imageUri={croppedImageUri}
                  sourceText={sourceText}
                  translatedText={translatedText}
                  title={t(ui, "compareTitle")}
                  sourceLabel={t(ui, "ocrSource")}
                  translationLabel={t(ui, "translationLabel")}
                  copyLabel={t(ui, "copy")}
                  copiedLabel={t(ui, "copied")}
                />
              ) : null}

              <View style={styles.resultCard}>
                <Text style={styles.blockTitle}>{t(ui, "wordsTitle")}</Text>
                {allWords.length > 0 ? (
                  <Pressable style={styles.toggleWordsButton} onPress={() => setShowAllWords((prev) => !prev)}>
                    <Text style={styles.toggleWordsText}>
                      {showAllWords
                        ? t(ui, "collapseWords", { count: orderedFocusWords.length })
                        : t(ui, "expandWords", { count: allWords.length })}
                    </Text>
                  </Pressable>
                ) : null}
                {words.length === 0 ? (
                  <Text style={styles.placeholder}>{t(ui, "noWords")}</Text>
                ) : (
                  <WordCloud words={words} onPressWord={openWordMeaning} />
                )}
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.blockTitle}>{t(ui, "recentHistory")}</Text>
                {history.length === 0 ? (
                  <Text style={styles.placeholder}>{t(ui, "noHistory")}</Text>
                ) : (
                  history.slice(0, 3).map((item) => (
                    <Text key={item.id} style={styles.historyText}>
                      {new Date(item.createdAt).toLocaleString()} - {item.translatedText}
                    </Text>
                  ))
                )}
              </View>
            </View>
          ) : null}
        </ScrollView>

        <WordSheet
          visible={wordSheetVisible}
          loading={wordLoading}
          meaning={wordMeaning}
          uiLanguage={ui}
          onClose={() => {
            setWordSheetVisible(false);
            setWordLoading(false);
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6"
  },
  loadingScreen: {
    alignItems: "center",
    justifyContent: "center"
  },
  container: {
    padding: 16,
    paddingTop: Platform.OS === "android" ? (NativeStatusBar.currentHeight || 0) + 10 : 16,
    gap: 12
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827"
  },
  welcomeStep: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22
  },
  welcomeHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280"
  },
  title: {
    fontSize: 24,
    fontWeight: "800"
  },
  subtitle: {
    color: "#4B5563"
  },
  langPair: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF"
  },
  tabWrap: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 4
  },
  tab: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10
  },
  tabActive: {
    backgroundColor: "#1D4ED8"
  },
  tabText: {
    color: "#1E3A8A",
    fontWeight: "700"
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "700"
  },
  translateButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 4
  },
  translateText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  resultCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  resultBlock: {
    gap: 12
  },
  blockTitle: {
    fontWeight: "700",
    fontSize: 15
  },
  toggleWordsButton: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  toggleWordsText: {
    color: "#1E40AF",
    fontSize: 12,
    fontWeight: "700"
  },
  placeholder: {
    color: "#6B7280"
  },
  historyText: {
    fontSize: 12,
    color: "#374151"
  }
});
