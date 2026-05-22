import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// Inline SVG icon set mirroring the handoff. Sized via the `size` prop
// (defaults to 22, matching the tab-bar icon size). Stroke 1.7 by default
// — adjust per-call with the `stroke` prop. Color follows `color` (passed
// in from the caller, usually theme.colors.ink or theme.colors.accent).
//
// Names match the design spec exactly so screens can refer to them by string.
const PATHS = {
  sun: ({ s, c }) => (
    <>
      <Circle cx={12} cy={12} r={4} stroke={c} strokeWidth={s} fill="none" />
      <Line x1={12} y1={2} x2={12} y2={5} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={22} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={2} y1={12} x2={5} y2={12} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={19} y1={12} x2={22} y2={12} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={4.9} y1={4.9} x2={6.9} y2={6.9} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={17.1} y1={17.1} x2={19.1} y2={19.1} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={4.9} y1={19.1} x2={6.9} y2={17.1} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={17.1} y1={6.9} x2={19.1} y2={4.9} stroke={c} strokeWidth={s} strokeLinecap="round" />
    </>
  ),
  sunset: ({ s, c }) => (
    <>
      <Path d="M6 17a6 6 0 0 1 12 0" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" />
      <Line x1={3} y1={17} x2={21} y2={17} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={12} y1={3} x2={12} y2={7} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={4} y1={10} x2={6} y2={11} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={20} y1={10} x2={18} y2={11} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={9} y1={20} x2={15} y2={20} stroke={c} strokeWidth={s} strokeLinecap="round" />
    </>
  ),
  moon: ({ s, c }) => (
    <Path
      d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
      stroke={c}
      strokeWidth={s}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  briefcase: ({ s, c }) => (
    <>
      <Rect x={3} y={7} width={18} height={13} rx={2} stroke={c} strokeWidth={s} fill="none" />
      <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={s} fill="none" />
      <Line x1={3} y1={13} x2={21} y2={13} stroke={c} strokeWidth={s} />
    </>
  ),
  palm: ({ s, c }) => (
    <>
      <Path d="M12 21V11" stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Path
        d="M12 11C12 7 9 5 5 6c2-3 7-3 10 0c0-4 4-5 7-3c-2 1-3 3-3 5c-3 0-5 1-7 3"
        stroke={c}
        strokeWidth={s}
        fill="none"
        strokeLinejoin="round"
      />
    </>
  ),
  plus: ({ s, c }) => (
    <>
      <Line x1={12} y1={5} x2={12} y2={19} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={5} y1={12} x2={19} y2={12} stroke={c} strokeWidth={s} strokeLinecap="round" />
    </>
  ),
  calendar: ({ s, c }) => (
    <>
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={c} strokeWidth={s} fill="none" />
      <Line x1={3} y1={10} x2={21} y2={10} stroke={c} strokeWidth={s} />
      <Line x1={8} y1={3} x2={8} y2={7} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={7} stroke={c} strokeWidth={s} strokeLinecap="round" />
    </>
  ),
  "calendar-plus": ({ s, c }) => (
    <>
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={c} strokeWidth={s} fill="none" />
      <Line x1={3} y1={10} x2={21} y2={10} stroke={c} strokeWidth={s} />
      <Line x1={8} y1={3} x2={8} y2={7} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={7} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={12} y1={13} x2={12} y2={18} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={9.5} y1={15.5} x2={14.5} y2={15.5} stroke={c} strokeWidth={s} strokeLinecap="round" />
    </>
  ),
  clock: ({ s, c }) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={s} fill="none" />
      <Polyline points="12,7 12,12 16,14" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  tag: ({ s, c }) => (
    <>
      <Path d="M20.5 13.5L13.5 20.5l-9-9V4.5h7l9 9z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round" />
      <Circle cx={8.5} cy={8.5} r={1.4} fill={c} />
    </>
  ),
  "chev-left": ({ s, c }) => (
    <Polyline points="15,5 8,12 15,19" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chev-right": ({ s, c }) => (
    <Polyline points="9,5 16,12 9,19" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chev-down": ({ s, c }) => (
    <Polyline points="5,9 12,16 19,9" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chev-up": ({ s, c }) => (
    <Polyline points="5,15 12,8 19,15" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  list: ({ s, c }) => (
    <>
      <Line x1={8} y1={6} x2={20} y2={6} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={8} y1={12} x2={20} y2={12} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={8} y1={18} x2={20} y2={18} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Circle cx={4} cy={6} r={1} fill={c} />
      <Circle cx={4} cy={12} r={1} fill={c} />
      <Circle cx={4} cy={18} r={1} fill={c} />
    </>
  ),
  chart: ({ s, c }) => (
    <>
      <Rect x={3} y={13} width={4} height={8} stroke={c} strokeWidth={s} fill="none" />
      <Rect x={10} y={8} width={4} height={13} stroke={c} strokeWidth={s} fill="none" />
      <Rect x={17} y={4} width={4} height={17} stroke={c} strokeWidth={s} fill="none" />
    </>
  ),
  user: ({ s, c }) => (
    <>
      <Circle cx={12} cy={8} r={4} stroke={c} strokeWidth={s} fill="none" />
      <Path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" />
    </>
  ),
  gear: ({ s, c }) => (
    <>
      <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={s} fill="none" />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9A1.7 1.7 0 0 0 10 3.1V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
        stroke={c}
        strokeWidth={s}
        fill="none"
        strokeLinejoin="round"
      />
    </>
  ),
  check: ({ s, c }) => (
    <Polyline points="4,12 10,18 20,6" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  document: ({ s, c }) => (
    <>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round" />
      <Polyline points="14,2 14,8 20,8" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round" />
      <Line x1={8} y1={13} x2={16} y2={13} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={8} y1={17} x2={16} y2={17} stroke={c} strokeWidth={s} strokeLinecap="round" />
    </>
  ),
  share: ({ s, c }) => (
    <>
      <Circle cx={18} cy={5} r={3} stroke={c} strokeWidth={s} fill="none" />
      <Circle cx={6} cy={12} r={3} stroke={c} strokeWidth={s} fill="none" />
      <Circle cx={18} cy={19} r={3} stroke={c} strokeWidth={s} fill="none" />
      <Line x1={8.6} y1={10.6} x2={15.4} y2={6.4} stroke={c} strokeWidth={s} />
      <Line x1={8.6} y1={13.4} x2={15.4} y2={17.6} stroke={c} strokeWidth={s} />
    </>
  ),
  bell: ({ s, c }) => (
    <>
      <Path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round" />
      <Path d="M10 21a2 2 0 0 0 4 0" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" />
    </>
  ),
  star: ({ s, c }) => (
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      stroke={c}
      strokeWidth={s}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  gift: ({ s, c }) => (
    <>
      <Rect x={3} y={9} width={18} height={12} rx={1.5} stroke={c} strokeWidth={s} fill="none" />
      <Line x1={3} y1={13} x2={21} y2={13} stroke={c} strokeWidth={s} />
      <Line x1={12} y1={9} x2={12} y2={21} stroke={c} strokeWidth={s} />
      <Path d="M12 9c-2 0-3.5-1-3.5-2.5C8.5 5 9.5 4 11 4c1 0 1.5 1 1 5" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round" />
      <Path d="M12 9c2 0 3.5-1 3.5-2.5C15.5 5 14.5 4 13 4c-1 0-1.5 1-1 5" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round" />
    </>
  ),
  sparkle: ({ s, c }) => (
    <Path
      d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5z M19 14l.9 2.2L22 17l-2.1.8L19 20l-.9-2.2L16 17l2.1-.8z"
      stroke={c}
      strokeWidth={s}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  "arrow-up": ({ s, c }) => (
    <>
      <Line x1={12} y1={4} x2={12} y2={20} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Polyline points="6,10 12,4 18,10" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "arrow-down": ({ s, c }) => (
    <>
      <Line x1={12} y1={4} x2={12} y2={20} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Polyline points="6,14 12,20 18,14" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "arrow-right": ({ s, c }) => (
    <>
      <Line x1={4} y1={12} x2={20} y2={12} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Polyline points="14,6 20,12 14,18" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  edit: ({ s, c }) => (
    <Path
      d="M4 20h4l10-10-4-4L4 16v4z M14 6l4 4"
      stroke={c}
      strokeWidth={s}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  trash: ({ s, c }) => (
    <>
      <Line x1={4} y1={6} x2={20} y2={6} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" stroke={c} strokeWidth={s} fill="none" />
      <Path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={s} fill="none" />
    </>
  ),
  shield: ({ s, c }) => (
    <Path d="M12 2l8 3v7a8 8 0 0 1-8 8 8 8 0 0 1-8-8V5z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round" />
  ),
  lock: ({ s, c }) => (
    <>
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={c} strokeWidth={s} fill="none" />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={c} strokeWidth={s} fill="none" />
    </>
  ),
  mail: ({ s, c }) => (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={c} strokeWidth={s} fill="none" />
      <Polyline points="3,7 12,13 21,7" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  receipt: ({ s, c }) => (
    <>
      <Path
        d="M6 3h12v18l-3-2-3 2-3-2-3 2z"
        stroke={c}
        strokeWidth={s}
        fill="none"
        strokeLinejoin="round"
      />
      <Line x1={9} y1={8} x2={15} y2={8} stroke={c} strokeWidth={s} strokeLinecap="round" />
      <Line x1={9} y1={12} x2={15} y2={12} stroke={c} strokeWidth={s} strokeLinecap="round" />
    </>
  ),
};

export default function Icon({
  name,
  size = 22,
  color = "currentColor",
  stroke = 1.7,
  style,
}) {
  const Render = PATHS[name];
  if (!Render) {
    if (__DEV__) console.warn(`Icon: unknown name "${name}"`);
    return null;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Render s={stroke} c={color} />
    </Svg>
  );
}
