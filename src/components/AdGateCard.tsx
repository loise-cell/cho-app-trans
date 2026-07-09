import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { constants, PointsState } from "../services/pointsLedger";

type Props = {
  pointsState: PointsState;
  onWatchAd: () => void;
};

export function AdGateCard({ pointsState, onWatchAd }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>點數中心</Text>
      <Text style={styles.content}>目前點數：{pointsState.points}</Text>
      <Text style={styles.content}>看一次廣告 +{constants.REWARD_PER_AD} 點</Text>
      <Text style={styles.content}>翻譯一次 -{constants.TRANSLATION_COST} 點</Text>
      <Pressable style={styles.button} onPress={onWatchAd}>
        <Text style={styles.buttonText}>觀看廣告領點數</Text>
      </Pressable>
      <Text style={styles.hint}>廣告完成後將自動加點，翻譯時扣點。</Text>
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
