import { useAssets } from "expo-asset";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { WebView } from "react-native-webview";

export default function SecurityLawPDF({ visable, hideModal }) {
  const { height } = Dimensions.get("window");
  const theme = useTheme();
  const styles = makeStyle(theme, height);

  // טעינת ה-Asset
  const [assets, error] = useAssets([
    require("../../assets/security_law_IL_2024.pdf"),
  ]);

  return (
    <Portal>
      <Modal
        visible={visable}
        onDismiss={hideModal}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface elevation={4} style={styles.surfaceWrapper}>
          <View style={styles.contentInner}>
            <View style={styles.header}>
              <IconButton icon="close" size={24} onPress={hideModal} />
            </View>
            <View style={styles.webViewWrapper}>
              {assets && assets[0] ? (
                <WebView
                  source={{ uri: assets[0].localUri || assets[0].uri }}
                  style={styles.webView}
                  originWhitelist={["*"]}
                  allowFileAccess={true}
                  scalesPageToFit={true}
                />
              ) : (
                <View style={styles.loaderContainer}>
                  {error ? (
                    <Text>שגיאה בטעינת הקובץ</Text>
                  ) : (
                    <ActivityIndicator
                      size="large"
                      color={theme.colors.primary}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const makeStyle = (theme, height) =>
  StyleSheet.create({
    modalContainer: {
      backgroundColor: "transparent",
      margin: 20,
      borderRadius: 20,
      height: height * 0.8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    webViewWrapper: {
      flex: 1,
    },
    webView: {
      flex: 1,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    surfaceWrapper: {
      flex: 1,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    contentInner: {
      flex: 1,
      borderRadius: 20,
      overflow: "hidden",
    },
  });
