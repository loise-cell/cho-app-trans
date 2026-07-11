import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { AdRewardTier } from "../services/pointsLedger";
import { colors, radius, spacing } from "../theme";

const PARTICLE_COUNT = 12;
const AUTO_DISMISS_MS = 2800;

type Props = {
  visible: boolean;
  tier: AdRewardTier;
  points: number;
  uiLanguage: UiLanguageCode;
  extraMessage?: string;
  onFinish: () => void;
};

export function JackpotCelebration({ visible, tier, points, uiLanguage, extraMessage, onFinish }: Props) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const flashScale = useRef(new Animated.Value(0.5)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const pointsScale = useRef(new Animated.Value(0.6)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.4)
    }))
  ).current;
  const finishedRef = useRef(false);

  const isMega = tier === "mega";
  const isLucky = tier === "lucky" || isMega;

  useEffect(() => {
    if (!visible || !isLucky) {
      return;
    }
    finishedRef.current = false;

    overlayOpacity.setValue(0);
    cardScale.setValue(0.3);
    cardOpacity.setValue(0);
    iconRotate.setValue(0);
    flashScale.setValue(0.5);
    flashOpacity.setValue(0);
    pointsScale.setValue(0.6);
    shake.setValue(0);
    particleAnims.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0.4);
    });

    const particleBursts = particleAnims.map((particle, index) => {
      const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 72 + (index % 3) * 18;
      return Animated.parallel([
        Animated.timing(particle.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(particle.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(particle.x, {
          toValue: Math.cos(angle) * distance,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(particle.y, {
          toValue: Math.sin(angle) * distance,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.delay(380),
          Animated.timing(particle.opacity, { toValue: 0, duration: 320, useNativeDriver: true })
        ])
      ]);
    });

    const shakeAnim = Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true })
    ]);

    const entrance = Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flashOpacity, { toValue: isMega ? 0.85 : 0.7, duration: 180, useNativeDriver: true }),
          Animated.timing(flashScale, {
            toValue: isMega ? 2.2 : 1.9,
            duration: 520,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          })
        ]),
        Animated.timing(flashOpacity, { toValue: 0.15, duration: 400, useNativeDriver: true })
      ]),
      Animated.sequence([
        Animated.delay(80),
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true
          }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.back(1.6)),
            useNativeDriver: true
          }),
          Animated.spring(pointsScale, {
            toValue: 1,
            friction: 4,
            tension: 140,
            delay: 180,
            useNativeDriver: true
          })
        ])
      ]),
      Animated.sequence([Animated.delay(200), Animated.stagger(30, particleBursts)])
    ]);

    entrance.start();
    shakeAnim.start();

    const timer = setTimeout(() => {
      if (finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      Animated.timing(overlayOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          onFinish();
        }
      });
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [
    visible,
    isLucky,
    isMega,
    overlayOpacity,
    cardScale,
    cardOpacity,
    iconRotate,
    flashScale,
    flashOpacity,
    pointsScale,
    shake,
    particleAnims,
    onFinish
  ]);

  if (!visible || tier === "normal") {
    return null;
  }

  const title = isMega ? t(uiLanguage, "megaJackpotTitle") : t(uiLanguage, "jackpotTitle");
  const body = isMega ? t(uiLanguage, "megaJackpotBody", { points }) : t(uiLanguage, "jackpotBody", { points });
  const accent = isMega ? "#7C3AED" : colors.warning;
  const accentSoft = isMega ? "#F3E8FF" : colors.warningSoft;
  const iconName = isMega ? "diamond" : "flash";

  const shakeX = shake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-6, 0, 6]
  });
  const spin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-18deg", "0deg"]
  });

  const dismiss = () => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Pressable style={styles.pressRoot} onPress={dismiss}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }, { translateX: shakeX }]
            }
          ]}
        >
          <Animated.View
            style={[
              styles.flash,
              isMega ? styles.flashMega : styles.flashLucky,
              {
                opacity: flashOpacity,
                transform: [{ scale: flashScale }]
              }
            ]}
          />
          <View style={styles.particleLayer} pointerEvents="none">
            {particleAnims.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  { backgroundColor: index % 2 === 0 ? accent : "#FCD34D" },
                  {
                    opacity: particle.opacity,
                    transform: [{ translateX: particle.x }, { translateY: particle.y }, { scale: particle.scale }]
                  }
                ]}
              />
            ))}
          </View>
          <Animated.View style={[styles.iconWrap, { backgroundColor: accentSoft, transform: [{ rotate: spin }] }]}>
            <Ionicons name={iconName} size={42} color={accent} />
          </Animated.View>
          <Text style={[styles.title, { color: accent }]}>{title}</Text>
          <Animated.Text style={[styles.points, { transform: [{ scale: pointsScale }] }]}>+{points}</Animated.Text>
          <Text style={styles.body}>{body}</Text>
          {extraMessage ? <Text style={styles.extra}>{extraMessage}</Text> : null}
          <Text style={styles.tapHint}>{t(uiLanguage, "close")}</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pressRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FCD34D"
  },
  flash: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: "18%"
  },
  flashLucky: {
    backgroundColor: "#FDE68A"
  },
  flashMega: {
    backgroundColor: "#DDD6FE"
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  particle: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: spacing.xs
  },
  points: {
    fontSize: 44,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.sm
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22
  },
  extra: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: "#6D28D9",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20
  },
  tapHint: {
    marginTop: spacing.lg,
    fontSize: 12,
    color: colors.textMuted
  }
});
