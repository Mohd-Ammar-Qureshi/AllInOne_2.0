import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme';
import { getReadableTextColor } from '../../utils/color';

type Props = {
  /** Width and height in dp. Matches the 40dp header icon buttons by default. */
  size?: number;
};

/**
 * AllInOne app icon: a rounded square in the brand colour with a medical
 * supplies case (case + cross). No text, so it stays clear at small sizes, and
 * it follows the light/dark theme automatically.
 */
const AppLogo = ({ size = 40 }: Props) => {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="AllInOne"
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: colors.primary,
        },
      ]}>
      <MaterialIcons
        name="medical-services"
        size={Math.round(size * 0.6)}
        color={getReadableTextColor(colors.primary)}
      />
    </View>
  );
};

export default AppLogo;

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});