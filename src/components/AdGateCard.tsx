import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { constants, PointsState } from "../services/pointsLedger";

type Props = {
  pointsState: PointsState;
  onWatchAd: () => void;
  uiLanguage: UiLanguageCode;
};

export function AdGateCard({ pointsState, onWatchAd, uiLanguage }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t(uiLanguage, "pointsCenter")}</Text>
      <Text style={styles.content}>{t(uiLanguage, "currentPoints", { points: pointsState.points })}</Text>
      <Text style={styles.content}>{t(uiLanguage, "adReward", { reward: constants.REWARD_PER_AD })}</Text>
      <Text style={styles.content}>{t(uiLanguage, "translateCost", { cost: constants.TRANSLATION_COST })}</Text>
      <Pressable style={styles.button} onPress={onWatchAd}>
        <Text style={styles.buttonText}>{t(uiLanguage, "watchAd")}</Text>
      </Pressable>
      <Text style={styles.hint}>{t(uiLanguage, "pointsHint")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F5F7FF",
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  title: {
    fontSize: 16,
    fontWeight: "700"
  },
  content: {
    fontSize: 14,
    color: "#1F2937"
  },
  button: {
    marginTop: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280"
  }
});
