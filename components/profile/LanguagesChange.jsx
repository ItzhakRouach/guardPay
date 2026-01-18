import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";

export default function LanguagesChange({ visable, hideModal, setLang, lang }) {
  const { t } = useTranslation();

  const theme = useTheme();
  const styles = makeStyle(theme);

  return (
    <Portal>
      <Modal
        visible={visable}
        onDismiss={hideModal}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>{t("index.choose_lang")}</Text>
        <SegmentedButtons
          value={lang}
          onValueChange={setLang}
          buttons={[
            { value: "he", label: t("index.he"), icon: "abjad-hebrew" },
            { value: "en", label: t("index.en"), icon: "alphabet-latin" },
          ]}
          style={styles.segmented}
        />
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme) =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.colors.surface,
      padding: 25,
      margin: 20,
      borderRadius: 30,
      width: "90%",
      alignSelf: "center",
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 20,
      color: theme.colors.primary,
    },
    segmented: {
      marginTop: 5,
      padding: 10,
    },
  });
