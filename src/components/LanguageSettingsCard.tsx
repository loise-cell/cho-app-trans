import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  SOURCE_LANGUAGES,
  SourceLanguageCode,
  TargetLanguageCode,
  UI_LANGUAGES,
  UiLanguageCode,
  labelForUiLanguage
} from "../i18n/languages";
import { t } from "../i18n/strings";
import { cardBase, colors, radius, spacing } from "../theme";

type Props = {
  uiLanguage: UiLanguageCode;
  sourceLanguage: SourceLanguageCode;
  targetLanguage: TargetLanguageCode;
  onChangeUi: (code: UiLanguageCode) => void;
  onChangeSource: (code: SourceLanguageCode) => void;
  onChangeTarget: (code: TargetLanguageCode) => void;
};

type PickerKind = "ui" | "source" | "target" | null;

export function LanguageSettingsCard({
  uiLanguage,
  sourceLanguage,
  targetLanguage,
  onChangeUi,
  onChangeSource,
  onChangeTarget
}: Props) {
  const [open, setOpen] = useState<PickerKind>(null);

  const sourceLabel =
    sourceLanguage === "auto"
      ? t(uiLanguage, "sourceAuto")
      : SOURCE_LANGUAGES.find((item) => item.code === sourceLanguage)?.nativeLabel ?? sourceLanguage;

  const targetLabel = labelForUiLanguage(targetLanguage);
  const uiLabel = labelForUiLanguage(uiLanguage);

  return (
    <View style={[styles.card, cardBase]}>
      <View style={styles.titleRow}>
        <Ionicons name="globe-outline" size={18} color={colors.primary} />
        <Text style={styles.title}>{t(uiLanguage, "languageSettings")}</Text>
      </View>
      <View style={styles.pairPill}>
        <Text style={styles.pairText}>
          {sourceLabel} → {targetLabel}
        </Text>
      </View>

      <Row
        icon="phone-portrait-outline"
        label={t(uiLanguage, "uiLanguage")}
        value={uiLabel}
        open={open === "ui"}
        onPress={() => setOpen(open === "ui" ? null : "ui")}
      />
      {open === "ui" ? (
        <OptionList
          options={UI_LANGUAGES.map((l) => ({ code: l.code, label: l.nativeLabel }))}
          selected={uiLanguage}
          onSelect={(code) => {
            onChangeUi(code as UiLanguageCode);
            setOpen(null);
          }}
        />
      ) : null}

      <Row
        icon="text-outline"
        label={t(uiLanguage, "sourceLanguage")}
        value={sourceLabel}
        open={open === "source"}
        onPress={() => setOpen(open === "source" ? null : "source")}
      />
      {open === "source" ? (
        <OptionList
          options={SOURCE_LANGUAGES.map((l) => ({
            code: l.code,
            label: l.code === "auto" ? t(uiLanguage, "sourceAuto") : l.nativeLabel
          }))}
          selected={sourceLanguage}
          onSelect={(code) => {
            onChangeSource(code as SourceLanguageCode);
            setOpen(null);
          }}
        />
      ) : null}

      <Row
        icon="flag-outline"
        label={t(uiLanguage, "targetLanguage")}
        value={targetLabel}
        open={open === "target"}
        onPress={() => setOpen(open === "target" ? null : "target")}
      />
      {open === "target" ? (
        <OptionList
          options={UI_LANGUAGES.map((l) => ({ code: l.code, label: l.nativeLabel }))}
          selected={targetLanguage}
          onSelect={(code) => {
            onChangeTarget(code as TargetLanguageCode);
            setOpen(null);
          }}
        />
      ) : null}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  open,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.row, open && styles.rowOpen]} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function OptionList({
  options,
  selected,
  onSelect
}: {
  options: Array<{ code: string; label: string }>;
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <ScrollView style={styles.options} nestedScrollEnabled>
      {options.map((opt) => (
        <Pressable
          key={opt.code}
          style={[styles.option, selected === opt.code && styles.optionActive]}
          onPress={() => onSelect(opt.code)}
        >
          <Text style={[styles.optionText, selected === opt.code && styles.optionTextActive]}>{opt.label}</Text>
          {selected === opt.code ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.sm
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  pairPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.sm
  },
  pairText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  rowOpen: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "50%"
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    flexShrink: 1
  },
  options: {
    maxHeight: 160,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.xs
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  optionActive: {
    backgroundColor: colors.primarySoft
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1
  },
  optionTextActive: {
    fontWeight: "700",
    color: colors.primaryDark
  }
});
