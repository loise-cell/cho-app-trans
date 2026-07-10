import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { UI_LANGUAGES, UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";

type Props = {
  onComplete: (uiLanguage: UiLanguageCode) => void;
};

export function LanguageOnboarding({ onComplete }: Props) {
  const [selected, setSelected] = useState<UiLanguageCode>("zh-TW");

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t(selected, "onboardingTitle")}</Text>
      <Text style={styles.subtitle}>{t(selected, "onboardingSubtitle")}</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {UI_LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelected(lang.code)}
            >
              <Text style={[styles.optionNative, active && styles.optionTextActive]}>{lang.nativeLabel}</Text>
              <Text style={[styles.optionEn, active && styles.optionTextActive]}>{lang.englishLabel}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={styles.button} onPress={() => onComplete(selected)}>
        <Text style={styles.buttonText}>{t(selected, "onboardingContinue")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
    paddingTop: 48,
    gap: 12
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827"
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22
  },
  list: {
    flex: 1
  },
  listContent: {
    gap: 8,
    paddingBottom: 16
  },
  option: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  optionActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8"
  },
  optionNative: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827"
  },
  optionEn: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2
  },
  optionTextActive: {
    color: "#FFFFFF"
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16
  }
});
