import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme';

type Props = {
  source: ImageSourcePropType;
  /** width / height of the artwork. The supplied illustrations are 3:2. */
  aspectRatio?: number;
  /** Largest width in dp, so it stays tidy on tablets. */
  maxWidth?: number;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Decorative illustration on a white plate. The artwork has a white
 * background, so the plate keeps it looking intentional (not a white box) in
 * dark mode too. Hidden from screen readers - the surrounding text carries the
 * meaning.
 */
const Illustration = ({
  source,
  aspectRatio = 3 / 2,
  maxWidth = 280,
  bordered = true,
  style,
}: Props) => {
  const { colors } = useTheme();

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.plate,
        { maxWidth, aspectRatio },
        bordered && styles.bordered,
        bordered && { borderColor: colors.border },
        style,
      ]}>
      <Image
        source={source}
        style={styles.image}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
};

export default Illustration;

const styles = StyleSheet.create({
  plate: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
