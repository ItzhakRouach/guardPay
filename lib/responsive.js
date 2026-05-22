import { useWindowDimensions } from "react-native";

// Maximum width the main content area is allowed to stretch to. Above
// this, content is centered horizontally with equal side gutters so the
// design reads the same as on a phone — instead of stretching cards and
// rows to fill the full width of an iPad.
//
// 600 px hits the comfortable iOS reading-width target used by Notes,
// Settings, Wallet, etc.
export const MAX_CONTENT_WIDTH = 600;

// One-stop contentContainerStyle bits for every ScrollView. Apply with
// a spread:
//
//   <ScrollView contentContainerStyle={{
//     ...screenContentLayout,
//     paddingHorizontal: 24,
//     paddingBottom: 120,
//   }}>
//
// Phones (<600 px wide) get the full width back via `width: 100%`; iPad
// portrait + landscape inherit the cap.
export const screenContentLayout = {
  width: "100%",
  maxWidth: MAX_CONTENT_WIDTH,
  alignSelf: "center",
};

// Pixels of empty gutter on each side of the centered content area —
// `(screen - maxContent) / 2`, clamped at 0 on phones. Used to anchor
// absolute-positioned overlays (FAB, sticky toasts) to the content
// edge instead of the screen edge.
export const useContentInset = () => {
  const { width } = useWindowDimensions();
  return Math.max(0, (width - MAX_CONTENT_WIDTH) / 2);
};
