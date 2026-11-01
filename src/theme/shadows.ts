import { Platform, ViewStyle } from 'react-native';

const make = (
  offsetY: number,
  opacity: number,
  blur: number,
  elevation: number,
): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0B1F4D',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;

/** Soft elevation for cards (barely visible on dark surfaces by design). */
export const shadows = {
  card: make(2, 0.05, 10, 1),
  raised: make(4, 0.1, 14, 6),
} as const;
