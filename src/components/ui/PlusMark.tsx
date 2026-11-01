import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Soft decorative "+" (medical cross). Purely visual, never interactive. */
const PlusMark = ({ size = 56, style }: Props) => {
  const { colors } = useTheme();
  const bar = Math.round(size * 0.32);
  const color = colors.primaryLight;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.bar,
          { backgroundColor: color, width: size, height: bar, top: (size - bar) / 2, borderRadius: bar / 2 },
        ]}
      />
      <View
        style={[
          styles.bar,
          { backgroundColor: color, width: bar, height: size, left: (size - bar) / 2, borderRadius: bar / 2 },
        ]}
      />
    </View>
  );
};

export default PlusMark;

const styles = StyleSheet.create({
  bar: { position: 'absolute' },
});
