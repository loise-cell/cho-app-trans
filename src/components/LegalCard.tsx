import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LegalDocId } from "../legal/documents";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { cardBase, colors, radius, spacing } from "../theme";
import { LegalDocumentModal } from "./LegalDocumentModal";

type Props = {
  uiLanguage: UiLanguageCode;
};

const LINKS: Array<{ id: LegalDocId; icon: keyof typeof Ionicons.glyphMap; labelKey: "legalPrivacy" | "legalTerms" | "legalAdPoints" }> = [
  { id: "privacy", icon: "shield-checkmark-outline", labelKey: "legalPrivacy" },
  { id: "terms", icon: "document-text-outline", labelKey: "legalTerms" },
  { id: "adPoints", icon: "gift-outline", labelKey: "legalAdPoints" }
];

export function LegalCard({ uiLanguage }: Props) {
  const [openDoc, setOpenDoc] = useState<LegalDocId | null>(null);

  return (
    <>
      <View style={[styles.card, cardBase]}>
        <View style={styles.titleRow}>
          <Ionicons name="reader-outline" size={18} color={colors.primary} />
          <Text style={styles.title}>{t(uiLanguage, "legalSectionTitle")}</Text>
        </View>
        <Text style={styles.hint}>{t(uiLanguage, "legalSectionHint")}</Text>
        {LINKS.map((link) => (
          <Pressable
            key={link.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => setOpenDoc(link.id)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name={link.icon} size={18} color={colors.primary} />
              <Text style={styles.rowLabel}>{t(uiLanguage, link.labelKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
      <LegalDocumentModal
        visible={openDoc !== null}
        docId={openDoc}
        uiLanguage={uiLanguage}
        onClose={() => setOpenDoc(null)}
      />
    </>
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
    gap: spacing.sm
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  rowPressed: {
    opacity: 0.9
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  }
});
