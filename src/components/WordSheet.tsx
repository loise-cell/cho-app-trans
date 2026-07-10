import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { colors, radius, spacing } from "../theme";
import { WordMeaning } from "../types";

type Props = {
  visible: boolean;
  loading?: boolean;
  meaning: WordMeaning | null;
  onClose: () => void;
  uiLanguage: UiLanguageCode;
};

export function WordSheet({ visible, loading = false, meaning, onClose, uiLanguage }: Props) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
            <Text style={styles.title}>{t(uiLanguage, "wordSheetTitle")}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t(uiLanguage, "lookingUp")}</Text>
            </View>
          ) : meaning ? (
            <View style={styles.content}>
              <Text style={styles.word}>{meaning.word}</Text>
              <Text style={styles.phonetic}>{meaning.phonetic}</Text>
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{meaning.partOfSpeech}</Text>
                </View>
              </View>
              <View style={styles.meaningBox}>
                <Text style={styles.meaningText}>{t(uiLanguage, "meaning", { text: meaning.definitionZhTw })}</Text>
              </View>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleText}>{t(uiLanguage, "example", { text: meaning.example })}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.empty}>{t(uiLanguage, "pickWordFirst")}</Text>
          )}

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{t(uiLanguage, "close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text
  },
  loadingWrap: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14
  },
  content: {
    gap: spacing.sm
  },
  word: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text
  },
  phonetic: {
    fontSize: 14,
    color: colors.textMuted
  },
  tagRow: {
    flexDirection: "row",
    marginTop: spacing.xs
  },
  tag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark
  },
  meaningBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm
  },
  meaningText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    fontWeight: "600"
  },
  exampleBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    fontStyle: "italic"
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: spacing.lg
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15
  }
});
