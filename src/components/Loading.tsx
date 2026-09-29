import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';

type LoadingProps = {
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
};

const Loading = ({
  message = 'Loading...',
  fullScreen = true,
  style,
}: LoadingProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        fullScreen ? styles.fullScreen : styles.inline,
        { backgroundColor: colors.background },
        style,
      ]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
  },
});