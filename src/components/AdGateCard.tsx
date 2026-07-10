import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { cardBase, colors, radius, spacing } from "../theme";
import { constants, PointsState } from "../services/pointsLedger";

type Props = {
  pointsState: PointsState;
  onWatchAd: () => void;
  uiLanguage: UiLanguageCode;
};

export function AdGateCard({ pointsState, onWatchAd, uiLanguage }: Props) {
  return (
    <View style={[styles.card, cardBase]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t(uiLanguage, "pointsCenter")}</Text>
          <Text style={styles.pointsLine}>{t(uiLanguage, "currentPoints", { points: pointsState.points })}</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        <View style={[styles.chip, styles.chipGreen]}>
          <Ionicons name="add-circle-outline" size={14} color={colors.success} />
          <Text style={styles.chipGreenText}>{t(uiLanguage, "adReward", { reward: constants.REWARD_PER_AD })}</Text>
        </View>
        <View style={[styles.chip, styles.chipAmber]}>
          <Ionicons name="remove-circle-outline" size={14} color={colors.warning} />
          <Text style={styles.chipAmberText}>{t(uiLanguage, "translateCost", { cost: constants.TRANSLATION_COST })}</Text>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onWatchAd}>
        <Ionicons name="play-circle" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>{t(uiLanguage, "watchAd")}</Text>
      </Pressable>
      <Text style={styles.hint}>{t(uiLanguage, "pointsHint")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  pointsLine: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  chipGreen: {
    backgroundColor: colors.successSoft
  },
  chipGreenText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success
  },
  chipAmber: {
    backgroundColor: colors.warningSoft
  },
  chipAmberText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14
  },
  buttonPressed: {
    opacity: 0.92
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16
  }
});
