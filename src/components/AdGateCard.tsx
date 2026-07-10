import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { cardBase, colors, radius, spacing } from "../theme";
import { AdRewardTier, constants, PointsState, translateCountAvailable } from "../services/pointsLedger";

export type LastAdReward = {
  earned: number;
  tier: AdRewardTier;
};

type Props = {
  pointsState: PointsState;
  onWatchAd: () => void;
  uiLanguage: UiLanguageCode;
  lastReward?: LastAdReward | null;
  hasSuperLuckyBadge?: boolean;
};

export function AdGateCard({ pointsState, onWatchAd, uiLanguage, lastReward, hasSuperLuckyBadge = false }: Props) {
  const { points, totalAdsWatched } = pointsState;
  const translateCount = translateCountAvailable(points);
  const remainder = points % constants.TRANSLATION_COST;
  const progress = points === 0 ? 0 : remainder === 0 ? 1 : remainder / constants.TRANSLATION_COST;
  const needMore = remainder === 0 ? (translateCount > 0 ? 0 : constants.TRANSLATION_COST) : constants.TRANSLATION_COST - remainder;

  return (
    <View style={[styles.card, cardBase]}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Ionicons name="sparkles" size={18} color={colors.warning} />
          <Text style={styles.title}>{t(uiLanguage, "pointsCenter")}</Text>
        </View>
        <Text style={styles.stats}>{t(uiLanguage, "pointsStatsAds", { count: totalAdsWatched })}</Text>
      </View>

      <View style={styles.balancePanel}>
        <Text style={styles.balanceLabel}>{t(uiLanguage, "pointsCenter")}</Text>
        <Text style={styles.balanceValue}>{points}</Text>
        <View style={styles.statusPill}>
          <Ionicons name={translateCount > 0 ? "checkmark-circle" : "hourglass-outline"} size={14} color={translateCount > 0 ? colors.success : colors.warning} />
          <Text style={[styles.statusText, translateCount > 0 ? styles.statusReady : styles.statusPending]}>
            {translateCount > 0
              ? t(uiLanguage, "translateReady", { count: translateCount })
              : t(uiLanguage, "translateNeedMore", { need: needMore })}
          </Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {t(uiLanguage, "translateCost", { cost: constants.TRANSLATION_COST })}
        </Text>
      </View>

      <View style={styles.rulesRow}>
        <View style={[styles.ruleCard, styles.ruleNormal]}>
          <Ionicons name="gift-outline" size={18} color={colors.success} />
          <Text style={styles.ruleTitle}>{t(uiLanguage, "adRewardNormal", { reward: constants.REWARD_PER_AD })}</Text>
        </View>
        <View style={[styles.ruleCard, styles.ruleJackpot]}>
          <Ionicons name="flash" size={18} color={colors.warning} />
          <Text style={styles.ruleTitle}>
            {t(uiLanguage, "adJackpotRule", {
              chance: constants.JACKPOT_CHANCE_PERCENT,
              jackpot: constants.JACKPOT_REWARD
            })}
          </Text>
        </View>
      </View>

      <View style={[styles.ruleCard, styles.ruleMega]}>
        <Ionicons name="diamond" size={20} color="#7C3AED" />
        <Text style={styles.ruleMegaTitle}>
          {t(uiLanguage, "adMegaJackpotRule", {
            chance: constants.MEGA_JACKPOT_CHANCE_PERCENT,
            jackpot: constants.MEGA_JACKPOT_REWARD
          })}
        </Text>
      </View>

      <View style={[styles.badgeCard, hasSuperLuckyBadge ? styles.badgeUnlocked : styles.badgeLocked]}>
        <View style={[styles.badgeIconWrap, hasSuperLuckyBadge && styles.badgeIconUnlocked]}>
          <Ionicons name="ribbon" size={22} color={hasSuperLuckyBadge ? "#7C3AED" : colors.textMuted} />
        </View>
        <View style={styles.badgeTextWrap}>
          <Text style={[styles.badgeName, hasSuperLuckyBadge && styles.badgeNameUnlocked]}>
            {t(uiLanguage, "badgeSuperLuckyName")}
          </Text>
          <Text style={styles.badgeDesc}>
            {hasSuperLuckyBadge ? t(uiLanguage, "badgeSuperLuckyDesc") : t(uiLanguage, "badgeSuperLuckyLocked")}
          </Text>
        </View>
        {hasSuperLuckyBadge ? <Ionicons name="checkmark-circle" size={22} color="#7C3AED" /> : <Ionicons name="lock-closed" size={18} color={colors.textMuted} />}
      </View>

      {lastReward ? (
        <View
          style={[
            styles.lastReward,
            lastReward.tier === "lucky" && styles.lastRewardJackpot,
            lastReward.tier === "mega" && styles.lastRewardMega
          ]}
        >
          <Ionicons
            name={lastReward.tier === "mega" ? "diamond" : lastReward.tier === "lucky" ? "trophy" : "add-circle"}
            size={16}
            color={lastReward.tier === "mega" ? "#7C3AED" : lastReward.tier === "lucky" ? colors.warning : colors.success}
          />
          <Text
            style={[
              styles.lastRewardText,
              lastReward.tier === "lucky" && styles.lastRewardJackpotText,
              lastReward.tier === "mega" && styles.lastRewardMegaText
            ]}
          >
            {lastReward.tier === "mega"
              ? t(uiLanguage, "lastRewardMega", { points: lastReward.earned })
              : lastReward.tier === "lucky"
                ? t(uiLanguage, "lastRewardJackpot", { points: lastReward.earned })
                : t(uiLanguage, "lastRewardNormal", { points: lastReward.earned })}
          </Text>
        </View>
      ) : null}

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onWatchAd}>
        <Ionicons name="play-circle" size={22} color="#FFFFFF" />
        <Text style={styles.buttonText}>{t(uiLanguage, "watchAd")}</Text>
      </Pressable>
      <Text style={styles.hint}>{t(uiLanguage, "pointsHint")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    overflow: "hidden"
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  stats: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600"
  },
  balancePanel: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark,
    letterSpacing: 0.5
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 52
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.75)"
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700"
  },
  statusReady: {
    color: colors.success
  },
  statusPending: {
    color: colors.warning
  },
  progressBlock: {
    gap: 6
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.borderLight,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary
  },
  progressHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right"
  },
  rulesRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  ruleCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
    alignItems: "flex-start"
  },
  ruleNormal: {
    backgroundColor: colors.successSoft
  },
  ruleJackpot: {
    backgroundColor: colors.warningSoft
  },
  ruleMega: {
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: undefined,
    alignSelf: "stretch"
  },
  ruleTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18
  },
  ruleMegaTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#5B21B6",
    lineHeight: 18
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1
  },
  badgeLocked: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border
  },
  badgeUnlocked: {
    backgroundColor: "#F3E8FF",
    borderColor: "#C4B5FD"
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center"
  },
  badgeIconUnlocked: {
    backgroundColor: "#EDE9FE"
  },
  badgeTextWrap: {
    flex: 1,
    gap: 2
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textMuted
  },
  badgeNameUnlocked: {
    color: "#5B21B6"
  },
  badgeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16
  },
  lastReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  lastRewardJackpot: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: "#FCD34D"
  },
  lastRewardText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.success
  },
  lastRewardJackpotText: {
    color: colors.warning
  },
  lastRewardMega: {
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#C4B5FD"
  },
  lastRewardMegaText: {
    color: "#6D28D9"
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15
  },
  buttonPressed: {
    opacity: 0.92
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800"
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16
  }
});
