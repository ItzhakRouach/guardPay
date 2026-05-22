import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Button,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { useLanguage } from "../../hooks/lang-context";
import { SWATCHES } from "../../lib/shiftColors";

// Picker modal: shows the 8 swatches in a grid. Caller controls visibility
// via `visible` and gets the chosen hex back via `onSelect(hex)`.
export default function ShiftColorsModal({
  visible,
  onDismiss,
  title,
  currentColor,
  onSelect,
}) {
  const theme = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const styles = makeStyle(theme, isRTL);

  const [selected, setSelected] = useState(currentColor);

  const handleSave = () => {
    if (selected && selected !== currentColor) {
      onSelect(selected);
    }
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Text variant="titleLarge" style={styles.title}>
          {title || t("appearance.choose_color")}
        </Text>

        <View style={styles.grid}>
          {SWATCHES.map((swatch) => {
            const isSelected =
              (selected || currentColor || "").toUpperCase() ===
              swatch.light.toUpperCase();
            return (
              <Pressable
                key={swatch.name}
                onPress={() => setSelected(swatch.light)}
                accessibilityRole="button"
                accessibilityLabel={t(`appearance.swatch.${swatch.name}`)}
                style={[
                  styles.swatchWrap,
                  isSelected && {
                    borderColor: theme.colors.primary,
                    borderWidth: 2,
                  },
                ]}
              >
                <View
                  style={[styles.swatch, { backgroundColor: swatch.light }]}
                />
                <Text variant="labelSmall" style={styles.swatchLabel}>
                  {t(`appearance.swatch.${swatch.name}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button mode="text" onPress={onDismiss}>
            {t("common.cancel")}
          </Button>
          <Button mode="contained" onPress={handleSave}>
            {t("shiftDetails.saveNote")}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme, isRTL) =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      borderRadius: 28,
      padding: 24,
    },
    title: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
      marginBottom: 18,
      textAlign: isRTL ? "right" : "left",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      justifyContent: "space-between",
      marginBottom: 24,
    },
    swatchWrap: {
      width: "22%",
      alignItems: "center",
      padding: 6,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    swatchLabel: {
      marginTop: 6,
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },
  });
