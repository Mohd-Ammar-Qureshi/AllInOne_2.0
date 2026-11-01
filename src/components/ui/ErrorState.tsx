import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import Button from './Button';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.errorSoft }]}>
        <MaterialIcons name="error-outline" size={40} color={colors.error} />
      </View>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onRetry ? (
        <Button title="Try Again" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
};

export default ErrorState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    minWidth: 160,
    marginTop: spacing.sm,
  },
});
