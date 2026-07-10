import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
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
          <Text style={styles.title}>{t(uiLanguage, "wordSheetTitle")}</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>{t(uiLanguage, "lookingUp")}</Text>
            </View>
          ) : meaning ? (
            <>
              <Text style={styles.word}>{meaning.word}</Text>
              <Text style={styles.text}>{meaning.phonetic}</Text>
              <Text style={styles.text}>{t(uiLanguage, "partOfSpeech", { pos: meaning.partOfSpeech })}</Text>
              <Text style={styles.text}>{t(uiLanguage, "meaning", { text: meaning.definitionZhTw })}</Text>
              <Text style={styles.text}>{t(uiLanguage, "example", { text: meaning.example })}</Text>
            </>
          ) : (
            <Text style={styles.text}>{t(uiLanguage, "pickWordFirst")}</Text>
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
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: 16,
    fontWeight: "700"
  },
  word: {
    fontSize: 20,
    fontWeight: "700"
  },
  text: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 22
  },
  loadingWrap: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20
  },
  loadingText: {
    color: "#4B5563",
    fontSize: 14
  },
  button: {
    marginTop: 10,
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
