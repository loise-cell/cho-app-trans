import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { unwrapSoftLineBreaks } from "../utils/textUnwrap";

type Props = {
  imageUri: string;
  sourceText: string;
  translatedText: string;
  title: string;
  sourceLabel: string;
  translationLabel: string;
  copyLabel: string;
  copiedLabel: string;
};

export function TranslationCompareCard({
  imageUri,
  sourceText,
  translatedText,
  title,
  sourceLabel,
  translationLabel,
  copyLabel,
  copiedLabel
}: Props) {
  const [copiedKey, setCopiedKey] = useState<"source" | "translation" | null>(null);

  const displaySource = useMemo(() => unwrapSoftLineBreaks(sourceText), [sourceText]);
  const displayTranslation = useMemo(() => unwrapSoftLineBreaks(translatedText), [translatedText]);

  const copyText = async (key: "source" | "translation", value: string) => {
    if (!value.trim()) {
      return;
    }
    await Clipboard.setStringAsync(value);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1500);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      <View style={styles.textBlock}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{sourceLabel}</Text>
          <Pressable style={styles.copyButton} onPress={() => copyText("source", displaySource)}>
            <Text style={styles.copyText}>{copiedKey === "source" ? copiedLabel : copyLabel}</Text>
          </Pressable>
        </View>
        <Text style={styles.sourceText} selectable>
          {displaySource}
        </Text>
      </View>
      <View style={styles.textBlock}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{translationLabel}</Text>
          <Pressable style={styles.copyButton} onPress={() => copyText("translation", displayTranslation)}>
            <Text style={styles.copyText}>{copiedKey === "translation" ? copiedLabel : copyLabel}</Text>
          </Pressable>
        </View>
        <Text style={styles.translatedText} selectable>
          {displayTranslation}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827"
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#F3F4F6"
  },
  textBlock: {
    gap: 4
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    flex: 1
  },
  copyButton: {
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  copyText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700"
  },
  sourceText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#1F2937"
  },
  translatedText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#111827",
    fontWeight: "600"
  }
});
