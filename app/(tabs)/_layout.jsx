import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "../../components/common/Icon";
import Type from "../../components/common/Type";

const ICONS = {
  index: "gear",
  shifts: "calendar-plus",
  overview: "chart",
};

const labelKey = (name) => `tabs.${name === "index" ? "profile" : name}`;

function CustomTabBar({ state, descriptors, navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.bg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderSoft,
        paddingTop: 8,
        paddingBottom: bottomPad,
        paddingHorizontal: 8,
        gap: 4,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () =>
          navigation.emit({ type: "tabLongPress", target: route.key });
        const iconName = ICONS[route.name] || "list";
        const color = focused ? theme.colors.accent : theme.colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1 }}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: focused
                  ? theme.colors.tabActiveBg
                  : "transparent",
                gap: 4,
              }}
            >
              <Icon name={iconName} size={22} color={color} stroke={1.8} />
              <Type
                variant="tabLabel"
                color={color}
                style={{
                  fontFamily: focused
                    ? "Manrope_700Bold"
                    : "Manrope_500Medium",
                }}
              >
                {t(labelKey(route.name))}
              </Type>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="shifts" />
      <Tabs.Screen name="overview" />
    </Tabs>
  );
}
