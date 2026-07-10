import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, radius, spacing } from "../theme";

type Props = {
  title: string;
  subtitle: string;
  points: number;
};

export function AppHeader({ title, subtitle, points }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.blobA} />
      <View style={styles.blobB} />
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="language" size={22} color={colors.primary} />
          </View>
          <View style={styles.titles}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.pointsBadge}>
          <Ionicons name="diamond" size={14} color={colors.warning} />
          <Text style={styles.pointsValue}>{points}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: "hidden",
    marginBottom: spacing.sm
  },
  blobA: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -40,
    right: -20
  },
  blobB: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -30,
    left: 20
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md
  },
  brand: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  titles: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.82)"
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill
  },
  pointsValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text
  }
});
