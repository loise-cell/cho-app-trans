import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  imageUri: string;
  sourceText: string;
  translatedText: string;
};

export function TranslationCompareCard({ imageUri, sourceText, translatedText }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>翻譯對照（你框選的範圍）</Text>
      <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      <View style={styles.textBlock}>
        <Text style={styles.label}>OCR 原文</Text>
        <Text style={styles.sourceText}>{sourceText}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.label}>中文翻譯</Text>
        <Text style={styles.translatedText}>{translatedText}</Text>
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
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280"
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
