import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { colors, radius, spacing } from "../theme";

const MIN_DISPLAY_MS = 1700;
const EXIT_MS = 420;

type Props = {
  uiLanguage: UiLanguageCode;
  ready: boolean;
  onFinish: () => void;
};

export function AppSplash({ uiLanguage, ready, onFinish }: Props) {
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(28)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const tagY = useRef(new Animated.Value(20)).current;
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;
  const mountedAt = useRef(Date.now()).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(ringScale, {
          toValue: 1.35,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(tagOpacity, { toValue: 1, duration: 480, delay: 120, useNativeDriver: true }),
        Animated.timing(tagY, { toValue: 0, duration: 560, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ])
    ]).start();

    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.35, duration: 360, useNativeDriver: true })
        ])
      );

    const dotAnim = Animated.parallel([pulse(dot1, 0), pulse(dot2, 140), pulse(dot3, 280)]);
    dotAnim.start();
    return () => dotAnim.stop();
  }, [dot1, dot2, dot3, logoOpacity, logoScale, ringOpacity, ringScale, tagOpacity, tagY, titleOpacity, titleY]);

  useEffect(() => {
    if (!ready || finishedRef.current) {
      return;
    }

    const elapsed = Date.now() - mountedAt;
    const waitMs = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      if (finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          onFinish();
        }
      });
    }, waitMs);

    return () => clearTimeout(timer);
  }, [mountedAt, onFinish, ready, screenOpacity]);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <View style={styles.blobA} />
      <View style={styles.blobB} />
      <View style={styles.blobC} />

      <View style={styles.center}>
        <View style={styles.logoStage}>
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }]
              }
            ]}
          />
          <Animated.View
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }]
              }
            ]}
          >
            <Ionicons name="language" size={42} color={colors.primary} />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
          <Text style={styles.title}>{t(uiLanguage, "appTitle")}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: tagOpacity, transform: [{ translateY: tagY }] }}>
          <Text style={styles.tagline}>{t(uiLanguage, "splashTagline")}</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  blobA: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    right: -50
  },
  blobB: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: 80,
    left: -40
  },
  blobC: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: "38%",
    right: 24
  },
  center: {
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xxl
  },
  logoStage: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm
  },
  ring: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)"
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "center"
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.86)",
    textAlign: "center",
    fontWeight: "600"
  },
  footer: {
    position: "absolute",
    bottom: 56,
    flexDirection: "row",
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)"
  }
});
