import "react-native-gesture-handler";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { AdGateCard } from "./src/components/AdGateCard";
import { AppHeader } from "./src/components/AppHeader";
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
import { cardBase, colors, radius, spacing } from "./src/theme";
import Ionicons from "@expo/vector-icons/Ionicons";

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
          <ActivityIndicator size="large" color={colors.primary} />
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <AppHeader title={t(ui, "appTitle")} subtitle={t(ui, "appSubtitle")} points={pointsState.points} />

          <View style={styles.tabWrap}>
            <Pressable
              onPress={() => setActiveTab("editor")}
              style={[styles.tab, activeTab === "editor" && styles.tabActive]}
            >
              <Ionicons name="crop-outline" size={16} color={activeTab === "editor" ? "#FFFFFF" : colors.primary} />
              <Text style={[styles.tabText, activeTab === "editor" && styles.tabTextActive]}>{t(ui, "tabEditor")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("result")}
              style={[styles.tab, activeTab === "result" && styles.tabActive]}
            >
              <Ionicons name="reader-outline" size={16} color={activeTab === "result" ? "#FFFFFF" : colors.primary} />
              <Text style={[styles.tabText, activeTab === "result" && styles.tabTextActive]}>{t(ui, "tabResult")}</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable style={({ pressed }) => [styles.actionButton, styles.actionPrimary, pressed && styles.pressed]} onPress={captureFromCamera}>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
              <Text style={styles.actionPrimaryText}>{t(ui, "takePhoto")}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.actionButton, styles.actionSecondary, pressed && styles.pressed]} onPress={pickFromLibrary}>
              <Ionicons name="images-outline" size={22} color={colors.primary} />
              <Text style={styles.actionSecondaryText}>{t(ui, "pickImage")}</Text>
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
            <View style={[styles.welcomeCard, cardBase]}>
              <Text style={styles.welcomeTitle}>{t(ui, "welcomeTitle")}</Text>
              <StepRow n={1} text={t(ui, "welcomeStep1")} />
              <StepRow n={2} text={t(ui, "welcomeStep2")} />
              <StepRow n={3} text={t(ui, "welcomeStep3")} />
              <View style={styles.hintBox}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.welcomeHint}>{t(ui, "welcomeHint")}</Text>
              </View>
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
              <View style={styles.langPairPill}>
                <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                <Text style={styles.langPair}>
                  {t(ui, "langPairHint", {
                    source: sourceLabel,
                    target: labelForUiLanguage(langSettings.targetLanguage)
                  })}
                </Text>
              </View>

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
                <Pressable
                  style={({ pressed }) => [styles.translateButton, pressed && styles.pressed, loading && styles.translateDisabled]}
                  onPress={translate}
                  disabled={loading}
                >
                  <Ionicons name="language" size={20} color="#FFFFFF" />
                  <Text style={styles.translateText}>
                    {loading ? t(ui, "translating") : t(ui, "startTranslate", { cost: constants.TRANSLATION_COST })}
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
            <View style={[styles.welcomeCard, cardBase]}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
              </View>
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

              <View style={[styles.resultCard, cardBase]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="text-outline" size={18} color={colors.primary} />
                  <Text style={styles.blockTitle}>{t(ui, "wordsTitle")}</Text>
                </View>
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

              <View style={[styles.resultCard, cardBase]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={styles.blockTitle}>{t(ui, "recentHistory")}</Text>
                </View>
                {history.length === 0 ? (
                  <Text style={styles.placeholder}>{t(ui, "noHistory")}</Text>
                ) : (
                  history.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                      <Text style={styles.historyText} numberOfLines={2}>
                        {item.translatedText}
                      </Text>
                    </View>
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

function StepRow({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNum}>{n}</Text>
      </View>
      <Text style={styles.welcomeStep}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg
  },
  loadingScreen: {
    alignItems: "center",
    justifyContent: "center"
  },
  container: {
    padding: spacing.lg,
    paddingTop: Platform.OS === "android" ? (NativeStatusBar.currentHeight || 0) + 10 : spacing.lg,
    gap: spacing.md
  },
  welcomeCard: {
    padding: spacing.lg,
    gap: spacing.md
  },
  emptyIcon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center"
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },
  stepNum: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary
  },
  welcomeStep: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs
  },
  welcomeHint: {
    flex: 1,
    fontSize: 12,
    color: colors.primaryDark,
    lineHeight: 18
  },
  langPairPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill
  },
  langPair: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark
  },
  tabWrap: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.sm,
    paddingVertical: 11
  },
  tabActive: {
    backgroundColor: colors.primary
  },
  tabText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13
  },
  tabTextActive: {
    color: "#FFFFFF"
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: 14
  },
  actionPrimary: {
    backgroundColor: colors.primary
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  actionPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14
  },
  actionSecondaryText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  translateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    marginBottom: 4
  },
  translateDisabled: {
    opacity: 0.7
  },
  translateText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15
  },
  resultCard: {
    padding: spacing.lg,
    gap: spacing.sm
  },
  resultBlock: {
    gap: spacing.md
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  blockTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: colors.text,
    flex: 1
  },
  toggleWordsButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  toggleWordsText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700"
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: 14
  },
  historyItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600"
  },
  historyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20
  }
});
