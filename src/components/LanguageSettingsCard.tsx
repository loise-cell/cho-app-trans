import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SOURCE_LANGUAGES,
  SourceLanguageCode,
  TargetLanguageCode,
  UI_LANGUAGES,
  UiLanguageCode,
  labelForUiLanguage
} from "../i18n/languages";
import { t } from "../i18n/strings";

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
    <View style={styles.card}>
      <Text style={styles.title}>{t(uiLanguage, "languageSettings")}</Text>
      <Text style={styles.hint}>
        {t(uiLanguage, "langPairHint", { source: sourceLabel, target: targetLabel })}
      </Text>

      <Row
        label={t(uiLanguage, "uiLanguage")}
        value={uiLabel}
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
        label={t(uiLanguage, "sourceLanguage")}
        value={sourceLabel}
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
        label={t(uiLanguage, "targetLanguage")}
        value={targetLabel}
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

function Row({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value} ▾</Text>
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
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827"
  },
  hint: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151"
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8"
  },
  options: {
    maxHeight: 160,
    borderRadius: 10,
    backgroundColor: "#F3F4F6"
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB"
  },
  optionActive: {
    backgroundColor: "#DBEAFE"
  },
  optionText: {
    fontSize: 14,
    color: "#111827"
  },
  optionTextActive: {
    fontWeight: "700",
    color: "#1E40AF"
  }
});
