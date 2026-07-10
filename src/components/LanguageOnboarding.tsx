import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UI_LANGUAGES, UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { colors, radius, spacing } from "../theme";

type Props = {
  onComplete: (uiLanguage: UiLanguageCode) => void;
};

export function LanguageOnboarding({ onComplete }: Props) {
  const [selected, setSelected] = useState<UiLanguageCode>("zh-TW");

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="earth" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t(selected, "onboardingTitle")}</Text>
        <Text style={styles.subtitle}>{t(selected, "onboardingSubtitle")}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {UI_LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelected(lang.code)}
            >
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionNative, active && styles.optionTextActive]}>{lang.nativeLabel}</Text>
                <Text style={[styles.optionEn, active && styles.optionSubActive]}>{lang.englishLabel}</Text>
              </View>
              {active ? <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => onComplete(selected)}>
        <Text style={styles.buttonText}>{t(selected, "onboardingContinue")}</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    paddingTop: 56,
    gap: spacing.lg
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: spacing.md
  },
  list: {
    flex: 1
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionTextWrap: {
    flex: 1
  },
  optionNative: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  optionEn: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  optionTextActive: {
    color: "#FFFFFF"
  },
  optionSubActive: {
    color: "rgba(255,255,255,0.75)"
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    marginBottom: spacing.md
  },
  buttonPressed: {
    opacity: 0.92
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16
  }
});
