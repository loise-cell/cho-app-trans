import { Platform, ViewStyle } from "react-native";

export const colors = {
  bg: "#F4F6FB",
  bgAccent: "#E8EDFF",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  primarySoft: "#EEF2FF",
  primaryBorder: "#C7D2FE",
  accent: "#06B6D4",
  accentSoft: "#CFFAFE",
  success: "#059669",
  successSoft: "#D1FAE5",
  successBorder: "#6EE7B7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  overlay: "rgba(15, 23, 42, 0.5)"
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24
};

export function cardShadow(level = 3): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: "#1E293B",
      shadowOffset: { width: 0, height: level * 2 },
      shadowOpacity: 0.09,
      shadowRadius: level * 4
    },
    android: { elevation: level },
    default: {}
  }) as ViewStyle;
}

export const cardBase: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.borderLight,
  ...cardShadow(2)
};
