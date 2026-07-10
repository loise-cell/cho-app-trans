import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Ionicons from "@expo/vector-icons/Ionicons";
import { cardBase, colors, radius, spacing } from "../theme";
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
    <View style={[styles.card, cardBase]}>
      <View style={styles.titleRow}>
        <Ionicons name="documents-outline" size={18} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.previewWrap}>
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      </View>

      <TextBlock
        label={sourceLabel}
        text={displaySource}
        copied={copiedKey === "source"}
        copyLabel={copyLabel}
        copiedLabel={copiedLabel}
        onCopy={() => copyText("source", displaySource)}
        muted
      />
      <View style={styles.divider} />
      <TextBlock
        label={translationLabel}
        text={displayTranslation}
        copied={copiedKey === "translation"}
        copyLabel={copyLabel}
        copiedLabel={copiedLabel}
        onCopy={() => copyText("translation", displayTranslation)}
        muted={false}
      />
    </View>
  );
}

function TextBlock({
  label,
  text,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
  muted
}: {
  label: string;
  text: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
  muted: boolean;
}) {
  return (
    <View style={styles.textBlock}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Pressable style={[styles.copyButton, copied && styles.copyButtonDone]} onPress={onCopy}>
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={copied ? colors.success : colors.primary} />
          <Text style={[styles.copyText, copied && styles.copyTextDone]}>{copied ? copiedLabel : copyLabel}</Text>
        </Pressable>
      </View>
      <View style={[styles.textBox, muted ? styles.textBoxMuted : styles.textBoxHighlight]}>
        <Text style={[styles.bodyText, !muted && styles.bodyTextBold]} selectable>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    flex: 1
  },
  previewWrap: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border
  },
  preview: {
    width: "100%",
    height: 180
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight
  },
  textBlock: {
    gap: spacing.sm
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  copyButtonDone: {
    backgroundColor: colors.successSoft
  },
  copyText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700"
  },
  copyTextDone: {
    color: colors.success
  },
  textBox: {
    borderRadius: radius.md,
    padding: spacing.md
  },
  textBoxMuted: {
    backgroundColor: colors.surfaceMuted
  },
  textBoxHighlight: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.textSecondary
  },
  bodyTextBold: {
    color: colors.text,
    fontWeight: "600"
  }
});
