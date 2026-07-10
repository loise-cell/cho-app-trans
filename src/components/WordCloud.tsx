import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";

type Props = {
  words: string[];
  onPressWord: (word: string) => void;
};

const CHIP_COLORS = [
  { bg: "#EEF2FF", border: "#C7D2FE", text: "#4338CA" },
  { bg: "#ECFEFF", border: "#A5F3FC", text: "#0E7490" },
  { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D" },
  { bg: "#FFF7ED", border: "#FED7AA", text: "#C2410C" }
];

function getWordFontSize(word: string): number {
  const length = word.replace(/[^a-zA-Z]/g, "").length;
  return Math.min(Math.max(12 + length * 0.85, 13), 24);
}

export function WordCloud({ words, onPressWord }: Props) {
  return (
    <View style={styles.wrap}>
      {words.map((word, index) => {
        const palette = CHIP_COLORS[index % CHIP_COLORS.length];
        const fontSize = getWordFontSize(word);
        return (
          <Pressable
            key={`${word}-${index}`}
            onPress={() => onPressWord(word)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: palette.bg,
                borderColor: palette.border,
                paddingVertical: fontSize > 18 ? 9 : 7,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }]
              }
            ]}
          >
            <Text style={[styles.wordText, { fontSize, color: palette.text }]}>{word}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "flex-end"
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    borderWidth: 1
  },
  wordText: {
    fontWeight: "700"
  }
});
