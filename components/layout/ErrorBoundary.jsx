import * as Updates from "expo-updates";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import { View } from "react-native";
import { Button, Text, withTheme } from "react-native-paper";

// Catches a render/lifecycle crash anywhere below it and shows a calm
// recovery screen instead of a white screen. "Retry" re-mounts the tree;
// "Restart" reloads the JS bundle (which also picks up a downloaded OTA).
//
// Class component by necessity (React has no hook for error boundaries).
// Uses Paper primitives rather than the app's Type/Icon components so the
// fallback cannot itself depend on something that just crashed.
class ErrorBoundaryInner extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  retry = () => this.setState({ error: null });

  restart = async () => {
    try {
      if (!__DEV__ && Updates.isEnabled) {
        await Updates.reloadAsync();
        return;
      }
    } catch (e) {
      console.log("[ErrorBoundary] reload failed:", e?.message);
    }
    this.retry();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { t, theme } = this.props;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
          gap: 12,
        }}
      >
        <Text variant="titleLarge" style={{ textAlign: "center" }}>
          {t("service.crash_title")}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ textAlign: "center", opacity: 0.7, maxWidth: 320 }}
        >
          {t("service.crash_body")}
        </Text>
        <View style={{ height: 8 }} />
        <Button mode="contained" onPress={this.retry} style={{ minWidth: 200 }}>
          {t("service.crash_retry")}
        </Button>
        <Button mode="text" onPress={this.restart}>
          {t("service.crash_restart")}
        </Button>
      </View>
    );
  }
}

export default withTheme(withTranslation()(ErrorBoundaryInner));
