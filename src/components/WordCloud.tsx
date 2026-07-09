import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  words: string[];
  onPressWord: (word: string) => void;
};

function getWordFontSize(word: string): number {
  const length = word.replace(/[^a-zA-Z]/g, "").length;
  return Math.min(Math.max(12 + length * 0.9, 13), 26);
}

export function WordCloud({ words, onPressWord }: Props) {
  return (
    <View style={styles.wrap}>
      {words.map((word, index) => (
        <Pressable
          key={`${word}-${index}`}
          onPress={() => onPressWord(word)}
          style={[styles.chip, { paddingVertical: getWordFontSize(word) > 18 ? 8 : 6 }]}
        >
          <Text style={[styles.wordText, { fontSize: getWordFontSize(word) }]}>{word}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "flex-end"
  },
  chip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE"
  },
  wordText: {
    color: "#1E3A8A",
    fontWeight: "700"
  }
});
