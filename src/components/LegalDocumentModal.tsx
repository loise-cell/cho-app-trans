import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LegalDocId, LEGAL_DOCUMENTS } from "../legal/documents";
import { UiLanguageCode } from "../i18n/languages";
import { t } from "../i18n/strings";
import { colors, radius, spacing } from "../theme";

type Props = {
  visible: boolean;
  docId: LegalDocId | null;
  uiLanguage: UiLanguageCode;
  onClose: () => void;
};

export function LegalDocumentModal({ visible, docId, uiLanguage, onClose }: Props) {
  const doc = docId ? LEGAL_DOCUMENTS[docId] : null;

  return (
    <Modal visible={visible && Boolean(doc)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {doc?.title ?? ""}
          </Text>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator>
          {doc ? (
            <>
              <Text style={styles.updated}>
                {t(uiLanguage, "legalUpdatedAt", { date: doc.updatedAt })}
              </Text>
              {doc.sections.map((section) => (
                <View key={section.heading} style={styles.section}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  {section.paragraphs.map((paragraph, index) => (
                    <Text key={`${section.heading}-${index}`} style={styles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              ))}
              <Text style={styles.footerNote}>{t(uiLanguage, "legalFullVersionHint")}</Text>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginRight: spacing.md
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center"
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.lg
  },
  updated: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  section: {
    gap: spacing.sm
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primaryDark
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary
  },
  footerNote: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: spacing.md
  }
});
