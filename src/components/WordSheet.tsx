import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WordMeaning } from "../types";

type Props = {
  visible: boolean;
  loading?: boolean;
  meaning: WordMeaning | null;
  onClose: () => void;
};

export function WordSheet({ visible, loading = false, meaning, onClose }: Props) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>單字解釋</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>查詢中...</Text>
            </View>
          ) : meaning ? (
            <>
              <Text style={styles.word}>{meaning.word}</Text>
              <Text style={styles.text}>{meaning.phonetic}</Text>
              <Text style={styles.text}>詞性：{meaning.partOfSpeech}</Text>
              <Text style={styles.text}>中文譯義：{meaning.definitionZhTw}</Text>
              <Text style={styles.text}>例句（英文）：{meaning.example}</Text>
            </>
          ) : (
            <Text style={styles.text}>請先點選一個單字。</Text>
          )}
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>關閉</Text>
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
