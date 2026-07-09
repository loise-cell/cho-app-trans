import "react-native-gesture-handler";
import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { AdGateCard } from "./src/components/AdGateCard";
import { ImageRangeSelector } from "./src/components/ImageRangeSelector";
import { WordSheet } from "./src/components/WordSheet";
import { lookupWordMeaning, runRealOcrAndTranslate } from "./src/services/mockTranslator";
import { canTranslate, initialPointsState, rewardForAd, spendForTranslation } from "./src/services/pointsLedger";
import { CropRect, TranslationRecord, WordMeaning } from "./src/types";

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

  const allWords = useMemo(
    () =>
      sourceText
        .split(/\s+/)
        .map((word) => word.replace(/^[^a-zA-Z]+|[^a-zA-Z'.-]+$/g, ""))
        .filter((word) => /[a-zA-Z]/.test(word)),
    [sourceText]
  );

  const focusWords = useMemo(() => {
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
      if (result.length >= 12) {
        break;
      }
    }
    return result;
  }, [allWords]);

  const words = showAllWords ? allWords.slice(0, 80) : focusWords;

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
      setCropLocked(false);
      setActiveTab("editor");
    }
  };

  const captureFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("未授權", "請先允許相機權限。");
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
      setCropLocked(false);
      setActiveTab("editor");
    }
  };

  const translate = async () => {
    if (!imageUri) {
      Alert.alert("尚未選圖", "請先拍照或選取圖片。");
      return;
    }
    if (!cropLocked) {
      Alert.alert("尚未固定範圍", "請先按「確定範圍」固定翻譯區域。");
      return;
    }
    if (!canTranslate(pointsState)) {
      Alert.alert("點數不足", "請先觀看廣告獲得點數。");
      return;
    }

    setLoading(true);
    try {
      setPointsState((prev) => spendForTranslation(prev));
      const data = await runRealOcrAndTranslate({
        imageUri,
        cropRect,
        previewSize,
        imageSize
      });
      setSourceText(data.sourceText);
      setTranslatedText(data.translatedText);
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
      Alert.alert("翻譯失敗", error instanceof Error ? error.message : "未知錯誤");
    } finally {
      setLoading(false);
    }
  };

  const openWordMeaning = async (word: string) => {
    setWordSheetVisible(true);
    setWordMeaning(null);
    setWordLoading(true);
    try {
      const meaning = await lookupWordMeaning(word, sourceText);
      setWordMeaning(meaning);
    } catch (error) {
      setWordSheetVisible(false);
      Alert.alert("查詢失敗", error instanceof Error ? error.message : "未知錯誤");
    } finally {
      setWordLoading(false);
    }
  };

  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 12) + 48;

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
        <Text style={styles.title}>ChoAppTrans</Text>
        <Text style={styles.subtitle}>拍照翻譯 + 可調整範圍 + 單字解釋 + 廣告點數機制</Text>

        <View style={styles.tabWrap}>
          <Pressable onPress={() => setActiveTab("editor")} style={[styles.tab, activeTab === "editor" && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === "editor" && styles.tabTextActive]}>拍照編輯</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab("result")} style={[styles.tab, activeTab === "result" && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === "result" && styles.tabTextActive]}>翻譯結果</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable style={styles.secondaryButton} onPress={captureFromCamera}>
            <Text style={styles.secondaryText}>拍照</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={pickFromLibrary}>
            <Text style={styles.secondaryText}>選圖</Text>
          </Pressable>
        </View>

        {activeTab === "editor" && !imageUri ? (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>開始使用 ChoAppTrans</Text>
            <Text style={styles.welcomeStep}>1. 點上方「拍照」或「選圖」</Text>
            <Text style={styles.welcomeStep}>2. 框選要翻譯的區域，按「確定範圍」</Text>
            <Text style={styles.welcomeStep}>3. 扣 2 點開始翻譯，點單字看中文譯義</Text>
            <Text style={styles.welcomeHint}>提示：框外區域不會被翻譯，只處理藍框內文字。</Text>
          </View>
        ) : null}

        {activeTab === "editor" && !imageUri ? (
          <AdGateCard pointsState={pointsState} onWatchAd={() => setPointsState((prev) => rewardForAd(prev))} />
        ) : null}

        {activeTab === "editor" && imageUri ? (
          <>
            <ImageRangeSelector
              imageUri={imageUri}
              locked={cropLocked}
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
                <Text style={styles.translateText}>{loading ? "翻譯中..." : "扣 2 點開始翻譯"}</Text>
              </Pressable>
            ) : null}

            <AdGateCard pointsState={pointsState} onWatchAd={() => setPointsState((prev) => rewardForAd(prev))} />
          </>
        ) : null}

        {activeTab === "result" && !translatedText ? (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>尚無翻譯結果</Text>
            <Text style={styles.welcomeStep}>請先到「拍照編輯」完成翻譯，結果會顯示在這裡。</Text>
          </View>
        ) : null}

        {activeTab === "result" ? (
          <AdGateCard pointsState={pointsState} onWatchAd={() => setPointsState((prev) => rewardForAd(prev))} />
        ) : null}

        {activeTab === "result" && translatedText ? (
          <View style={styles.resultBlock}>
            <View style={styles.resultCard}>
              <Text style={styles.blockTitle}>重點單字（可點查看解釋）</Text>
              {allWords.length > 0 ? (
                <Pressable style={styles.toggleWordsButton} onPress={() => setShowAllWords((prev) => !prev)}>
                  <Text style={styles.toggleWordsText}>
                    {showAllWords ? `收合回重點單字（${focusWords.length}）` : `展開全部單字（${allWords.length}）`}
                  </Text>
                </Pressable>
              ) : null}
              <View style={styles.wordList}>
                {words.length === 0 ? (
                  <Text style={styles.placeholder}>尚無辨識結果</Text>
                ) : (
                  words.map((word, index) => (
                    <Pressable key={`${word}-${index}`} onPress={() => openWordMeaning(word)} style={styles.wordRow}>
                      <Text style={styles.wordIndex}>{index + 1}.</Text>
                      <Text style={styles.wordRowText}>{word}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.blockTitle}>中文翻譯</Text>
              <Text style={styles.resultText}>{translatedText || "尚無翻譯結果"}</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.blockTitle}>最近紀錄</Text>
              {history.length === 0 ? (
                <Text style={styles.placeholder}>尚無紀錄</Text>
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
  wordList: {
    gap: 8
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
  wordRow: {
    backgroundColor: "#EEF2F7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  wordIndex: {
    color: "#4B5563",
    width: 18,
    fontWeight: "700"
  },
  wordRowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827"
  },
  placeholder: {
    color: "#6B7280"
  },
  resultText: {
    color: "#111827",
    lineHeight: 22
  },
  historyText: {
    fontSize: 12,
    color: "#374151"
  }
});
