import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Largest system font scale the layouts are designed for. */
export const MAX_FONT_SCALE = 1.25;

export type ScreenSize = 'small' | 'medium' | 'large';

/** Side padding and tablet column width, derived from the window width. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const size: ScreenSize =
      width < 360 ? 'small' : width < 600 ? 'medium' : 'large';
    return {
      width,
      height,
      size,
      isSmall: size === 'small',
      isLarge: size === 'large',
      gutter: size === 'small' ? 12 : size === 'medium' ? 16 : 24,
      /** Content stays in a readable centred column on tablets. */
      contentMaxWidth: 640,
    };
  }, [width, height]);
}
